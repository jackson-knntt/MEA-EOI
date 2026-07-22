// Merges EOI data with new membership details and writes to corporate membership database
import { sendWelcomeEmail } from "@/lib/welcomeEmail";

export async function POST(request) {
  const token = process.env.NOTION_TOKEN;
  const membershipDatabaseId = process.env.NOTION_MEMBERSHIP_DATABASE_ID;

  if (!token || !membershipDatabaseId) {
    return Response.json(
      { error: "Server is not configured. Missing Notion credentials." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, eoiData, website, vat, bio, headshotUrl, termsAccepted, applicationDate } = body;

  // Pull fields from EOI data
  const fullName  = eoiData?.fullName  || "";
  const jobTitle  = eoiData?.jobTitle  || "";
  const company   = eoiData?.company   || "";
  const linkedin  = eoiData?.linkedin  || "";
  const telephone = eoiData?.telephone || "";

  // Bundle richer EOI fields plus bio into Notes
  const notes = [
    eoiData?.orgType             ? `Organisation type: ${eoiData.orgType}` : "",
    eoiData?.areasOfInterest     ? `Areas of interest: ${eoiData.areasOfInterest}` : "",
    eoiData?.countriesOfInterest ? `Countries of interest: ${eoiData.countriesOfInterest}` : "",
    eoiData?.menaExperience      ? `MENA experience: ${eoiData.menaExperience}` : "",
    eoiData?.speakingInterest    ? `Speaking interest: ${eoiData.speakingInterest}` : "",
    eoiData?.sponsorshipInterest ? `Sponsorship interest: ${eoiData.sponsorshipInterest}` : "",
    bio?.trim()                  ? `Bio: ${bio.trim()}` : "",
    eoiData?.whyJoin             ? `Why joining: ${eoiData.whyJoin}` : "",
    eoiData?.companyDesc         ? `Company description: ${eoiData.companyDesc}` : "",
    eoiData?.roleDesc            ? `Role description: ${eoiData.roleDesc}` : "",
    eoiData?.notes               ? `Additional notes: ${eoiData.notes}` : "",
  ].filter(Boolean).join("\n");

  const properties = {
    "Full Name & Title": {
      title: [{ text: { content: String(fullName || "—").slice(0, 2000) } }],
    },
    "Terms Accepted": { checkbox: Boolean(termsAccepted) },
  };

  if (email?.trim())     properties["Email"]                   = { email: email.trim() };
  if (jobTitle?.trim())  properties["Job Title"]               = { rich_text: [{ text: { content: jobTitle.trim().slice(0, 2000) } }] };
  if (company?.trim())   properties["Company Name"]            = { rich_text: [{ text: { content: company.trim().slice(0, 2000) } }] };
  if (linkedin?.trim())  properties["LinkedIn"]                = { url: linkedin.trim() };
  if (telephone?.trim()) properties["Telephone"]               = { rich_text: [{ text: { content: telephone.trim().slice(0, 2000) } }] };
  if (website?.trim())   properties["Website"]                 = { url: website.trim() };
  if (vat?.trim())       properties["VAT Registration Number"] = { rich_text: [{ text: { content: vat.trim().slice(0, 2000) } }] };
  if (headshotUrl?.trim())properties["Headshot"]               = { url: headshotUrl.trim() };
  if (notes)             properties["Notes"]                   = { rich_text: [{ text: { content: notes.slice(0, 2000) } }] };
  if (applicationDate)   properties["Application Date"]        = { date: { start: applicationDate } };

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: membershipDatabaseId },
        properties,
      }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      console.error("Notion error:", detail);
      return Response.json(
        { error: "We could not save your details. Please try again." },
        { status: 502 }
      );
    }

    // Best-effort welcome email; never blocks a successful submission.
    try {
      await sendWelcomeEmail({ tier: "corporate", toName: fullName, toEmail: email });
    } catch (err) {
      console.error("Welcome email failed (membership still saved):", err.message);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Request failed:", err);
    return Response.json(
      { error: "We could not reach the server. Please try again." },
      { status: 500 }
    );
  }
}
