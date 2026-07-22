// Sends the tier-specific "welcome — you are now a member" email via EmailJS
// after a membership form is submitted.
//
// Sending is best-effort: if EmailJS is not configured, or the recipient email
// is missing, or the send fails, we log and return WITHOUT throwing so the
// membership submission (already saved in Notion) still succeeds. Callers should
// still wrap this in try/catch as a belt-and-braces guard.
//
// The email copy lives in three EmailJS templates (one per tier), so wording can
// be edited in the EmailJS dashboard without code changes. This module only
// selects the right template and passes the recipient's name/email.
//
// Required environment variables (set in Vercel, and in .env.local for testing):
//   EMAILJS_SERVICE_ID
//   EMAILJS_PUBLIC_KEY
//   EMAILJS_PRIVATE_KEY
//   EMAILJS_WELCOME_CORPORATE_TEMPLATE_ID
//   EMAILJS_WELCOME_SOLE_TRADER_TEMPLATE_ID
//   EMAILJS_WELCOME_YPG_TEMPLATE_ID

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const TEMPLATE_ENV_BY_TIER = {
  "corporate":   "EMAILJS_WELCOME_CORPORATE_TEMPLATE_ID",
  "sole-trader": "EMAILJS_WELCOME_SOLE_TRADER_TEMPLATE_ID",
  "ypg":         "EMAILJS_WELCOME_YPG_TEMPLATE_ID",
};

export async function sendWelcomeEmail({ tier, toName, toEmail }) {
  const serviceId   = process.env.EMAILJS_SERVICE_ID;
  const publicKey   = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey  = process.env.EMAILJS_PRIVATE_KEY;
  const templateEnv = TEMPLATE_ENV_BY_TIER[tier];
  const templateId  = templateEnv ? process.env[templateEnv] : undefined;

  if (!toEmail) {
    console.warn(`Welcome email skipped: no recipient email (tier: ${tier}).`);
    return;
  }
  if (!serviceId || !publicKey || !privateKey || !templateId) {
    console.warn(`Welcome email skipped: EmailJS not fully configured for tier "${tier}".`);
    return;
  }

  const res = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        email: toEmail,               // template "To Email" field: {{email}}
        to_name: toName || "Member",  // greeting: Dear {{to_name}}
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`EmailJS welcome send failed (${res.status}): ${detail}`);
  }
}
