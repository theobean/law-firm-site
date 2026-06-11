import { NextResponse } from "next/server";

const MAX = { name: 200, email: 200, phone: 50, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, message, botcheck } = body as {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    botcheck?: boolean | string;
  };

  // Honeypot: bots fill the hidden field — pretend success, send nothing
  if (botcheck) {
    return NextResponse.json({ success: true });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (
    typeof name !== "string" || name.length > MAX.name ||
    typeof email !== "string" || email.length > MAX.email || !EMAIL_RE.test(email) ||
    (phone && (typeof phone !== "string" || phone.length > MAX.phone)) ||
    typeof message !== "string" || message.length > MAX.message
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: process.env.WEB3FORMS_ACCESS_KEY,
      subject: `Νέο μήνυμα από ${name}`,
      from_name: "Δικηγορικό Γραφείο Παπαϊωάννου — Φόρμα Επικοινωνίας",
      name,
      email,
      phone: phone || "—",
      message,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    console.error("Web3Forms error:", data);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
