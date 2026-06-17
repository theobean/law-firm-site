import { NextResponse } from "next/server";

// POST /api/newsletter
// Body: { email, locale, botcheck }
// Forwards the email to Brevo (creates contact, adds to list).
// Honeypot: requests with a non-empty `botcheck` are silently accepted (200) but discarded.
export async function POST(req: Request) {
  try {
    const { email, locale = "el", botcheck } = await req.json();

    // Honeypot — bot filled in the hidden field. Pretend success, do nothing.
    if (botcheck) return NextResponse.json({ success: true });

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = Number(process.env.BREVO_LIST_ID);

    if (!apiKey || !listId) {
      // Env vars not yet configured on the server. Don't break the form — log and
      // return success so the visitor sees confirmation; the email is just lost.
      console.error("Brevo env vars missing (BREVO_API_KEY, BREVO_LIST_ID)");
      return NextResponse.json({ success: true });
    }

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
        attributes: { LANG: locale },
      }),
    });

    // Brevo returns 201 (created) or 204 (updated). 400 with code "duplicate_parameter"
    // means the contact already exists in this list — treat as success.
    if (res.ok) return NextResponse.json({ success: true });

    const body = await res.json().catch(() => ({}));
    if (body?.code === "duplicate_parameter") {
      return NextResponse.json({ success: true });
    }

    console.error("Brevo error", res.status, body);
    return NextResponse.json({ success: false, error: "Subscription failed" }, { status: 502 });
  } catch (err) {
    console.error("Newsletter route error", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
