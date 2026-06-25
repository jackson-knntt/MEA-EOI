// Server-side only. Notion token lives in process.env, never in the browser.
export async function POST(request) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
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

  const {
    title, firstName, lastName, email, jobTitle, company,
    linkedin, telephone, whyJoin, sectors, countriesOfInterest,
    orgTypes, orgTypeOther, interests, interestsOther,
    speakingInterest, ypgInterest, menaExperience, menaCountries,
    relevantCountries, referrer, companyDesc, roleDesc,
    sponsorshipInterest, companySize, otherComments,
    consentComms, consentPhoto, submittedAt,
  } = body;

  const fullName = [title, firstName, lastName].filter(Boolean).join(" ").trim();

  const orgTypesStr = [
    ...(Array.isArray(orgTypes) ? orgTypes.filter((o) => o !== "Other (please specify)") : []),
    orgTypeOther,
  ].filter(Boolean).join(", ");

  const interestsStr = [
    ...(Array.isArray(interests) ? interests.filter((i) => i !== "Other (please specify)") : []),
    interestsOther,
  ].filter(Boolean).join(", ");

  // Notes contains overflow fields not in dedicated columns
  const notes = [
    sectors             ? `Sectors of interest: ${sectors}` : "",
    menaCountries       ? `MENA countries worked in: ${menaCountries}` : "",
    relevantCountries   ? `Most relevant countries: ${relevantCountries}` : "",
    ypgInterest         ? `YPG interest: ${ypgInterest}` : "",
    referrer            ? `Referred by: ${referrer}` : "",
    companySize         ? `Company size: ${companySize}` : "",
    otherComments       ? `Other comments: ${otherComments}` : "",
    `Communications consent: ${consentComms ? "Yes" : "No"}`,
    `Photography consent: ${consentPhoto ? "Yes" : "No"}`,
  ].filter(Boolean).join("\n");

  const properties = {
    "Full Name": {
      title: [{ text: { content: String(fullName || "—").slice(0, 2000) } }],
    },
    "Deal Stage": {
      select: { name: "Expression of Interest Received" },
    },
  };

  if (email?.trim())               properties["Email"]                 = { email: email.trim() };
  if (jobTitle?.trim())            properties["Job Title"]             = { rich_text: [{ text: { content: jobTitle.trim().slice(0, 2000) } }] };
  if (company?.trim())             properties["Company"]               = { rich_text: [{ text: { content: company.trim().slice(0, 2000) } }] };
  if (linkedin?.trim())            properties["LinkedIn"]              = { url: linkedin.trim() };
  if (telephone?.trim())           properties["Telephone"]             = { rich_text: [{ text: { content: telephone.trim().slice(0, 2000) } }] };
  if (orgTypesStr)                 properties["Organisation Type"]     = { rich_text: [{ text: { content: orgTypesStr.slice(0, 2000) } }] };
  if (interestsStr)                properties["Areas of Interest"]     = { rich_text: [{ text: { content: interestsStr.slice(0, 2000) } }] };
  if (whyJoin?.trim())             properties["Why Join"]              = { rich_text: [{ text: { content: whyJoin.trim().slice(0, 2000) } }] };
  if (countriesOfInterest?.trim()) properties["Countries of Interest"] = { rich_text: [{ text: { content: countriesOfInterest.trim().slice(0, 2000) } }] };
  if (menaExperience?.trim())      properties["MENA Experience"]       = { rich_text: [{ text: { content: menaExperience.trim().slice(0, 2000) } }] };
  if (companyDesc?.trim())         properties["Company Description"]   = { rich_text: [{ text: { content: companyDesc.trim().slice(0, 2000) } }] };
  if (roleDesc?.trim())            properties["Role Description"]      = { rich_text: [{ text: { content: roleDesc.trim().slice(0, 2000) } }] };
  if (speakingInterest?.trim())    properties["Speaking Interest"]     = { rich_text: [{ text: { content: speakingInterest.trim().slice(0, 2000) } }] };
  if (sponsorshipInterest?.trim()) properties["Sponsorship Interest"]  = { rich_text: [{ text: { content: sponsorshipInterest.trim().slice(0, 2000) } }] };
  if (notes)                       properties["Notes"]                 = { rich_text: [{ text: { content: notes.slice(0, 2000) } }] };
  if (submittedAt)                 properties["Submitted At"]          = { date: { start: submittedAt } };

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
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

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Request failed:", err);
    return Response.json(
      { error: "We could not reach the server. Please try again." },
      { status: 500 }
    );
  }
}
