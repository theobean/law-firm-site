import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: process.env.WEB3FORMS_ACCESS_KEY,
      subject: `Νέο μήνυμα από ${name}`,
      from_name: "Site Επικοινωνία",
      name,
      email,
      phone: phone || "—",
      message,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    console.error("Web3Forms error:", data);
    return NextResponse.json({ error: data.message }, { status: 500 });
  }

  console.log("Email sent via Web3Forms");
  return NextResponse.json({ success: true });
}
