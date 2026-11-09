import { isSameOrigin } from "@/lib/chat/security";
import { resolveQuotaIdentity } from "@/lib/chat/identity.mjs";
import { readVisitorCookie } from "@/lib/chat/visitor.mjs";

// Temporary, read-only Preview diagnosis. Remove after the authorized browser
// reset; this route never creates an identity or changes quota state.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
};

function enabled() {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.CHAT_TURNSTILE_ENABLED === "true" &&
    process.env.CHATBOT_ENABLED === "true";
}

function failure(status: number) {
  return Response.json({ error: "unavailable" }, { status, headers });
}

export function GET() {
  if (!enabled()) return failure(404);
  return new Response(`<!doctype html>
<html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Προσωρινός έλεγχος</title></head>
<body><form method="post" action="/api/chat/visitor-reference"><button type="submit">Εμφάνιση αναφοράς αυτού του browser</button></form></body></html>`, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  if (!enabled()) return failure(404);
  if (!isSameOrigin(request)) return failure(403);
  try {
    const visitor = readVisitorCookie(request, { env: process.env });
    if (!visitor) return failure(401);
    const identity = await resolveQuotaIdentity(request, { env: process.env, visitor });
    if (identity.tier !== "anonymous" || !/^[a-f0-9]{64}$/.test(identity.subjectKey)) return failure(401);
    return Response.json({ reference: identity.subjectKey }, { headers });
  } catch {
    return failure(503);
  }
}
