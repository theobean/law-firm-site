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

    const apiKey = (process.env.BREVO_API_KEY ?? "").trim();
    const listId = Number((process.env.BREVO_LIST_ID ?? "").trim());

    if (!apiKey || !listId) {
      console.error("Brevo env vars missing", { hasKey: !!apiKey, listId });
      return NextResponse.json({ success: false, error: "Server config: missing env vars", debug: { hasKey: !!apiKey, listId } }, { status: 500 });
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

    if (res.ok) return NextResponse.json({ success: true });

    const body = await res.json().catch(() => ({}));
    if (body?.code === "duplicate_parameter") {
      return NextResponse.json({ success: true });
    }

    console.error("Brevo error", res.status, body);
    // Temporary: surface Brevo's error code/message in response so we can diagnose
    // without needing Vercel function logs. Remove once newsletter is verified.
    return NextResponse.json({
      success: false,
      error: "Subscription failed",
      debug: { status: res.status, brevo: body },
    }, { status: 502 });
  } catch (err) {
    console.error("Newsletter route error", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
