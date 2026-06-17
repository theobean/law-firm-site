// Sanity webhook receiver — fired when a new article is published.
//
// Flow:
//   Sanity publish → POST here → fetch full article → create Brevo campaign
//   → send to Newsletter Subscribers list.
//
// Required env vars on Vercel:
//   SANITY_WEBHOOK_SECRET    — shared secret from Sanity webhook config
//   BREVO_API_KEY            — already configured
//   BREVO_LIST_ID            — already configured
//   BREVO_SENDER_EMAIL       — e.g. iopapaio@gmail.com (verified in Brevo)
//   BREVO_SENDER_NAME        — e.g. "Δικηγορικό Γραφείο Παπαϊωάννου"
//
// Sanity webhook should be configured with:
//   URL: https://www.ioannispapaioannou.lawyer/api/article-published
//   Filter: _type == "article"
//   Header: sanity-webhook-secret: <same as SANITY_WEBHOOK_SECRET>

import { NextResponse } from "next/server";
import { client } from "@/sanity/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

interface SanityWebhookPayload {
  _id?: string;
  _type?: string;
  slug?: { current?: string };
  title?: string;
}

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  mainImage?: { asset?: { url?: string } };
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(article: Article): string {
  const url = `${SITE}/el/blog/${article.slug.current}?utm_source=newsletter&utm_medium=email&utm_campaign=${esc(article.slug.current)}`;
  const title = esc(article.title);
  const excerpt = article.excerpt ? esc(article.excerpt) : "";
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return `<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:40px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#0f2c3f;padding:30px 40px;text-align:center;">
            <p style="color:#c8922a;font-size:11px;letter-spacing:3px;margin:0 0 8px;font-family:Arial,sans-serif;">ΝΟΜΙΚΗ ΕΝΗΜΕΡΩΣΗ</p>
            <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:bold;letter-spacing:1px;">ΙΩΑΝΝΗΣ ΠΑΠΑΪΩΑΝΝΟΥ</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:10px;margin:4px 0 0;letter-spacing:2px;font-family:Arial,sans-serif;">ΔΙΚΗΓΟΡΙΚΟ ΓΡΑΦΕΙΟ &amp; ΣΥΝΕΡΓΑΤΕΣ</p>
          </td>
        </tr>
        <!-- Article -->
        <tr>
          <td style="padding:40px;">
            ${dateStr ? `<p style="color:#6b7280;font-size:12px;margin:0 0 16px;font-family:Arial,sans-serif;">${dateStr}</p>` : ""}
            <h2 style="color:#0f2c3f;font-size:24px;line-height:1.3;margin:0 0 20px;border-left:4px solid #c8922a;padding-left:16px;">${title}</h2>
            ${excerpt ? `<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 30px;">${excerpt}</p>` : ""}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
              <tr>
                <td style="background:#c8922a;border-radius:2px;">
                  <a href="${url}" style="display:inline-block;color:#0f2c3f;font-weight:bold;text-decoration:none;padding:14px 32px;font-size:14px;letter-spacing:1px;font-family:Arial,sans-serif;">ΔΙΑΒΑΣΤΕ ΤΟ ΑΡΘΡΟ &rarr;</a>
                </td>
              </tr>
            </table>
            <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:30px 0 0;border-top:1px solid #e5e7eb;padding-top:20px;">Λάβατε αυτό το email επειδή εγγραφήκατε στη νομική ενημέρωση του γραφείου μας.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0f2c3f;padding:24px 40px;text-align:center;">
            <p style="color:#ffffff;font-size:14px;margin:0 0 4px;font-weight:bold;">Δικηγορικό Γραφείο Παπαϊωάννου &amp; Συνεργάτες</p>
            <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0 0 12px;font-family:Arial,sans-serif;">Λέοντος Σοφού 12, 546 25 Θεσσαλονίκη</p>
            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0;font-family:Arial,sans-serif;">
              <a href="${SITE}/el" style="color:#c8922a;text-decoration:none;">ioannispapaioannou.lawyer</a> &middot;
              <a href="tel:+302310545261" style="color:rgba(255,255,255,0.7);text-decoration:none;">2310 545 261</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    // 1. Verify webhook secret
    const expectedSecret = process.env.SANITY_WEBHOOK_SECRET;
    const providedSecret = req.headers.get("sanity-webhook-secret");
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // 2. Parse payload to get the article slug
    const payload = (await req.json().catch(() => ({}))) as SanityWebhookPayload;
    if (payload._type !== "article" || !payload.slug?.current) {
      return NextResponse.json({ ok: true, skipped: "not a published article" });
    }

    // 3. Fetch the full published article from Sanity (ignore drafts)
    const article = (await client.fetch<Article | null>(
      `*[_type == "article" && slug.current == $slug && !(_id in path('drafts.**'))][0]{
        _id, title, slug, publishedAt, excerpt, mainImage{asset->{url}}
      }`,
      { slug: payload.slug.current }
    )) as Article | null;

    if (!article || !article.title) {
      return NextResponse.json({ ok: true, skipped: "article not found or unpublished" });
    }

    // 4. Build the email
    const html = buildEmailHtml(article);
    const subject = `Νέο άρθρο: ${article.title}`.slice(0, 200);

    // 5. Create + send Brevo campaign
    const apiKey = (process.env.BREVO_API_KEY ?? "").trim();
    const listId = Number((process.env.BREVO_LIST_ID ?? "").trim());
    const senderEmail = (process.env.BREVO_SENDER_EMAIL ?? "").trim();
    const senderName = (process.env.BREVO_SENDER_NAME ?? "Δικηγορικό Γραφείο Παπαϊωάννου").trim();

    if (!apiKey || !listId || !senderEmail) {
      return NextResponse.json({
        ok: false,
        error: "missing brevo env vars",
        debug: { hasKey: !!apiKey, listId, hasSender: !!senderEmail },
      }, { status: 500 });
    }

    const createRes = await fetch("https://api.brevo.com/v3/emailCampaigns", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        name: `Άρθρο: ${article.title}`.slice(0, 250),
        subject,
        sender: { email: senderEmail, name: senderName },
        recipients: { listIds: [listId] },
        htmlContent: html,
      }),
    });

    if (!createRes.ok) {
      const body = await createRes.json().catch(() => ({}));
      console.error("Brevo create campaign failed", createRes.status, body);
      return NextResponse.json({ ok: false, step: "create", brevo: body }, { status: 502 });
    }

    const created = await createRes.json();
    const campaignId = created?.id;
    if (!campaignId) {
      return NextResponse.json({ ok: false, step: "create", error: "no campaign id" }, { status: 502 });
    }

    const sendRes = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
      method: "POST",
      headers: { "api-key": apiKey, accept: "application/json" },
    });

    if (!sendRes.ok) {
      const body = await sendRes.json().catch(() => ({}));
      console.error("Brevo send campaign failed", sendRes.status, body);
      return NextResponse.json({ ok: false, step: "send", campaignId, brevo: body }, { status: 502 });
    }

    return NextResponse.json({ ok: true, campaignId, article: article.title });
  } catch (err) {
    console.error("article-published error", err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
