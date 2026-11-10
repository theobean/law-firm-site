# Anonymous chat protection and API budget

ΔικAIsis has no visitor registration or login. Turnstile and a signed first-party
cookie add anonymous browser continuity to the existing network/global limits.
They do not provide hardware identity or an unbreakable per-person allowance.

## Deployment configuration

Set these only for the intended deployment environment/branch, then rebuild:

| Variable | Purpose |
| --- | --- |
| `CHAT_TURNSTILE_ENABLED=true` | Require server-side verification and owned cookie identity |
| `NEXT_PUBLIC_CHAT_TURNSTILE_ENABLED=true` | Enable the browser widget; must match the server flag |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public site key, intentionally present in the browser |
| `CHAT_TURNSTILE_SECRET_KEY` | Private Siteverify key; never expose through NEXT_PUBLIC |
| `CHAT_TURNSTILE_HOSTNAMES` | Comma-separated exact allowed hostnames; no wildcard/URL/port |

Create a Free managed widget with the exact Preview hostname and pre-clearance
disabled. No Cloudflare proxy/DNS migration or `cf_clearance` setup is required.
Use distinct credentials/configuration when enabling another environment.

## Request sequence

Cloudflare script loads only after the visitor starts the optional assistant.
Each question obtains a fresh token, and the backend validates that token with
the fixed Siteverify endpoint, including exact hostname and `lexi_chat` action.
Tokens are single-use and expire after five minutes. Token/secret/provider
errors fail closed; neither the CMS nor OpenAI is called for failed validation.

After successful verification the server validates an existing
`__Host-lexi-visitor` cookie or creates one with a random nonce, signed expiry and
HMAC-SHA256. It is host-only, Secure, HttpOnly, SameSite=Lax and expires after
24 hours without sliding refresh. The raw nonce is not a user account or hardware
ID. Only a process-owned proof can choose the browser quota identity. A VPN
change preserves it; deletion/private browsing/another profile can replace it.
Network and global limits therefore remain necessary.

The server then calculates the bounded token and EUR reservation, and shared
Neon admission happens before live article lookup or a model call. All visitors
still receive public context only. After admission, every outcome releases its
owned concurrency lease. Abuse reservations are never refunded. A new monetary
reservation may settle once from consistent completed provider usage after reply
validation, or to zero for a server-owned no-provider reply; unknown/error usage,
old metadata, expiry and UTC rollover retain the full financial charge. Dashboard
totals never select a refund. See `chatbot-quotas.md` for the exact boundaries.

Abuse policy 2 permits each anonymous browser 6 requests / 400,000 reserved units
per minute, 30 requests / 2,000,000 reserved units per UTC day and one active
request. Shared network limits are 30 requests / 1,000,000 units per minute,
5,000,000 units per UTC day and three active requests. Namespace-wide limits
remain 60 requests / 1,000,000 units per minute, 1,000 requests / 10,000,000 units
per UTC day and eight active requests. During Preview rollout, known abuse policy
1 responses remain accepted with their stricter SQL limits; both versions require
money policy 1 and the same €5 daily financial guard. Unknown versions fail closed.

## Five-euro global daily API-usage reservation

`chat_quota.money_budgets` holds one shared financial allowance per provisioned
namespace/environment, updated in the same SQL transaction as other quotas.
The hard ceiling is 5,000,000 integer EUR millionths per UTC day. The runtime
cannot read/reset the table. Missing/corrupt/future state fails closed, and an
exhausted budget denies new calls until the next UTC day. No in-memory counter,
automatic top-up or new purchase is used.

Only `gpt-5.4-mini-2026-03-17`, at `service_tier: default`, is allowed by the price
card. An explicitly configured `gpt-5.4-mini` alias resolves to that snapshot;
other models fail closed. The reviewed standard rates are $0.75/M input and
$4.50/M output. Reserved input includes the full conservative request envelope;
all 1,800 maximum generated tokens are charged at the output ceiling, and cache
discounts are ignored. The EUR conversion uses the dated ECB USD-per-EUR rate,
rounded upward with a further 10% margin. ECB metadata may be cached for six
hours while no more than seven days old; unavailable/stale/invalid FX blocks calls.

This is a conservative API-usage reservation, not measured spend or a guarantee
of the final tax/card/FX invoice. A completed, validated response can return its
unused monetary reservation once from consistent provider usage. Failed requests
or unknown usage retain the full financial charge; abuse units remain charged
in every case. Actual API spend can therefore be lower than the internal charge.
It covers this proxy's active namespace/environment only. Another active
environment must share an allowance or use an explicitly allocated separate
budget before activation; Preview and production must not silently each promise
the same site-wide ceiling.

**Required price review:** the price card was checked on 9 November 2026 and
expires at 00:00 UTC on 9 December 2026. Confirm the official rates/model/tier
and update the reviewed/expiry dates before then; until reviewed, the expired
card blocks new model calls. No unattended price assumption lasts indefinitely.

## Disclosure and review

Privacy/cookie information describes the 24-hour cookie, Cloudflare security
signals, Neon pseudonymous counters, purposes, deletion limits and provider
links. Terms include the optional AI/security use and legal-advice disclaimer.
The cookie is limited to requested chat security and quota enforcement. Whether
the strict-necessity exemption applies and the GDPR lawful basis, provider
arrangements and any transfer safeguards require the controller's documented
legal assessment. Editing disclosures alone is not a compliance guarantee.
Contacting the office remains available without starting the chat.

## Primary references

- [Cloudflare setup](https://developers.cloudflare.com/turnstile/get-started/)
- [Siteverify validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare privacy addendum](https://www.cloudflare.com/turnstile-privacy-policy/)
- [Hellenic DPA cookies guidance](https://www.dpa.gr/el/cookies/plirofories/whatis_cookies)
- [OpenAI model and price card](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [ECB USD reference rate](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html)
