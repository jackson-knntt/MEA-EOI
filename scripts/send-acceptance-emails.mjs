// Polls the EOI Notion database for rows where Deal Stage = "Accepted"
// and "Acceptance Email Sent" is unchecked, sends the EmailJS acceptance
// email with the personalised /apply link, then ticks the checkbox.
//
// Runs on a schedule via GitHub Actions (.github/workflows/acceptance-emails.yml).
// Can also be run manually: node scripts/send-acceptance-emails.mjs
//
// Required environment variables (GitHub Actions secrets — NEVER in code,
// this repo is public):
//   NOTION_TOKEN            Notion integration secret
//   NOTION_EOI_DATABASE_ID  EOI Submissions database ID
//   EMAILJS_SERVICE_ID      e.g. service_xxxxxxx
//   EMAILJS_TEMPLATE_ID     e.g. template_xxxxxxx
//   EMAILJS_PUBLIC_KEY      EmailJS public key
//   EMAILJS_PRIVATE_KEY     EmailJS private key

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EOI_DB_ID = process.env.NOTION_EOI_DATABASE_ID;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

const APPLY_BASE_URL = "https://mea-eoi.vercel.app/apply";
const SENT_CHECKBOX = "Acceptance Email Sent";

// Maps the "Membership Category" Select value chosen by the admin to the
// landing page the applicant is sent to. Anything unrecognised (including a
// blank category) falls back to Corporate, which preserves the original
// behaviour of this script.
const CATEGORY_PATHS = {
  "Corporate": "",              // -> /apply
  "Sole Trader": "/sole-trader", // -> /apply/sole-trader
  "YPG": "/ypg",                 // -> /apply/ypg
};

function applyLinkFor(category, email) {
  const path = CATEGORY_PATHS[category] ?? "";
  return `${APPLY_BASE_URL}${path}?email=${encodeURIComponent(email)}`;
}

const NOTION_HEADERS = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

function assertEnv() {
  const missing = [
    ["NOTION_TOKEN", NOTION_TOKEN],
    ["NOTION_EOI_DATABASE_ID", EOI_DB_ID],
    ["EMAILJS_SERVICE_ID", EMAILJS_SERVICE_ID],
    ["EMAILJS_TEMPLATE_ID", EMAILJS_TEMPLATE_ID],
    ["EMAILJS_PUBLIC_KEY", EMAILJS_PUBLIC_KEY],
    ["EMAILJS_PRIVATE_KEY", EMAILJS_PRIVATE_KEY],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

// Find rows with Deal Stage = Accepted and the sent-checkbox unticked.
// Handles pagination in case there are ever more than 100 matches.
async function findPendingRows() {
  const rows = [];
  let cursor = undefined;

  do {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${EOI_DB_ID}/query`,
      {
        method: "POST",
        headers: NOTION_HEADERS,
        body: JSON.stringify({
          filter: {
            and: [
              { property: "Deal Stage", select: { equals: "Accepted" } },
              { property: SENT_CHECKBOX, checkbox: { equals: false } },
            ],
          },
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`Notion query failed (${res.status}): ${JSON.stringify(detail)}`);
    }

    const data = await res.json();
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return rows;
}

function extractRow(page) {
  const props = page.properties;
  return {
    pageId: page.id,
    email: props["Email"]?.email || "",
    fullName: props["Full Name"]?.title?.[0]?.plain_text || "",
    category: props["Membership Category"]?.select?.name || "",
  };
}

async function sendAcceptanceEmail({ email, fullName, category }) {
  const membershipLink = applyLinkFor(category, email);

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        email: email,                    // template "To Email" field: {{email}}
        to_name: fullName || "Applicant", // greeting: Dear {{to_name}}
        membership_link: membershipLink,  // body: {{membership_link}}
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`EmailJS send failed (${res.status}): ${detail}`);
  }
}

async function markAsSent(pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      properties: {
        [SENT_CHECKBOX]: { checkbox: true },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(`Notion checkbox update failed (${res.status}): ${JSON.stringify(detail)}`);
  }
}

async function main() {
  assertEnv();

  const pages = await findPendingRows();

  if (pages.length === 0) {
    console.log("No newly accepted applicants. Nothing to do.");
    return;
  }

  console.log(`Found ${pages.length} accepted applicant(s) awaiting email.`);

  let failures = 0;

  for (const page of pages) {
    const row = extractRow(page);

    if (!row.email) {
      console.error(`SKIPPED: page ${row.pageId} ("${row.fullName}") has no email address. Checkbox left unticked so it will be retried once an email is added.`);
      failures++;
      continue;
    }

    try {
      await sendAcceptanceEmail(row);
      const cat = row.category || "Corporate (default — no category set)";
      console.log(`Sent acceptance email to ${row.email} (${row.fullName}) [${cat}]`);
    } catch (err) {
      // Email failed: do NOT tick the checkbox, so it retries next run.
      console.error(`FAILED to email ${row.email}: ${err.message}`);
      failures++;
      continue;
    }

    try {
      await markAsSent(row.pageId);
      console.log(`Marked "${SENT_CHECKBOX}" for ${row.email}`);
    } catch (err) {
      // Email went out but the checkbox failed. This WILL cause a duplicate
      // email next run unless fixed. Fail loudly so the workflow shows red.
      console.error(`WARNING: email sent to ${row.email} but checkbox update failed: ${err.message}`);
      console.error(`Tick "${SENT_CHECKBOX}" manually for this row in Notion to prevent a duplicate email.`);
      failures++;
    }
  }

  if (failures > 0) {
    process.exit(1); // makes the GitHub Actions run show as failed
  }
}

main().catch((err) => {
  console.error(`Run failed: ${err.message}`);
  process.exit(1);
});
