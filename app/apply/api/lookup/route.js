// Looks up an EOI submission in Notion by email address
export async function GET(request) {
  const token = process.env.NOTION_TOKEN;
  const eoiDatabaseId = process.env.NOTION_EOI_DATABASE_ID;

  if (!token || !eoiDatabaseId) {
    return Response.json(
      { error: "Server is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${eoiDatabaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter: {
            property: "Email",
            email: { equals: email },
          },
        }),
      }
    );

    if (!res.ok) throw new Error("Notion query failed.");

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return Response.json({ error: "No EOI found for this email." }, { status: 404 });
    }

    const page = data.results[0];
    const props = page.properties;

    // Extract all EOI fields
    const get = (prop, type) => {
      if (!props[prop]) return "";
      if (type === "title")     return props[prop].title?.[0]?.plain_text || "";
      if (type === "email")     return props[prop].email || "";
      if (type === "rich_text") return props[prop].rich_text?.[0]?.plain_text || "";
      if (type === "url")       return props[prop].url || "";
      if (type === "select")    return props[prop].select?.name || "";
      return "";
    };

    return Response.json({
      notionPageId: page.id,
      fullName:            get("Full Name",            "title"),
      email:               get("Email",                "email"),
      jobTitle:            get("Job Title",            "rich_text"),
      company:             get("Company",              "rich_text"),
      linkedin:            get("LinkedIn",             "url"),
      telephone:           get("Telephone",            "rich_text"),
      orgType:             get("Organisation Type",    "rich_text"),
      areasOfInterest:     get("Areas of Interest",   "rich_text"),
      countriesOfInterest: get("Countries of Interest","rich_text"),
      whyJoin:             get("Why Join",             "rich_text"),
      menaExperience:      get("MENA Experience",      "rich_text"),
      companyDesc:         get("Company Description",  "rich_text"),
      roleDesc:            get("Role Description",     "rich_text"),
      speakingInterest:    get("Speaking Interest",    "rich_text"),
      sponsorshipInterest: get("Sponsorship Interest", "rich_text"),
      notes:               get("Notes",                "rich_text"),
    });

  } catch (err) {
    console.error("Lookup error:", err);
    return Response.json({ error: "Lookup failed." }, { status: 500 });
  }
}
