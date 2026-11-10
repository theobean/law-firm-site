# Chat rate limits, identities and quotas

The only production model route, `POST /api/chat`, verifies a fresh Turnstile
token for every question and resolves a signed anonymous browser identity.
It authorizes static public context and reserves conservative token units and
EUR cost together in Neon Postgres before live article retrieval. It then
prepares an immutable final request, checks that its exact token-unit cost fits
the reservation, and sends that captured request. ΔικAIsis has no visitor accounts,
registration or login. The AI context remains public-only, and there is no
in-memory admission fallback.

## Configuration

Set a server-only `CHAT_DATABASE_URL` for the SQL-created runtime role and a
stable private `CHAT_RATE_LIMIT_SECRET` of at least 32 characters. Keep that
secret across instances and redeployments; rotating it invalidates signed
visitor cookies and changes identity hashes.
Do not store an owner/admin database URL in deployment variables, application browser code, source control
or logs. The connection requires a Neon Postgres hostname and TLS. `VERCEL_ENV`
must match the environment provisioned for that database role.

The quota namespace is provisioned in the database and bound to the login role.
A client-supplied namespace, SQL parameter or request cannot widen it. Use a
separate runtime role and namespace for preview, production and development.
Enable both `CHAT_TURNSTILE_ENABLED=true` and
`NEXT_PUBLIC_CHAT_TURNSTILE_ENABLED=true`, with the public site key, private
Siteverify secret and exact allowed hostnames described in
[chatbot-security.md](chatbot-security.md). Public variables require a rebuild.
The public context principal remains independent of the quota identity.

### Least-privilege database access

Create a dedicated Neon **Free** project for quotas. Install
`db/chat-quotas.sql` using the import-only provisioning helper
`scripts/setup-chat-neon.mjs` with an administrative connection held only during
setup. SQL-created runtime roles receive connection/schema usage and execution
of `chat_quota.reserve` and `chat_quota.release`. They receive no direct table
read/write, schema creation, temporary-table, role-management or administrative
permissions. Runtime roles are not schema owners and inherit no owner role.

The three permitted call signatures use a fixed search path, qualified objects and validated
parameters under a separate non-login owner. Public execution is revoked.
`session_user` selects the provisioned namespace; the environment parameter must
match that mapping. The model receives neither a connection string nor any SQL
or database tool. This database stores quota metadata only.

The only admission signature is the seven-argument
`chat_quota.reserve(environment, tier, subject_hmac, network_hmac,
reserved_token_units, lease_uuid, reserved_eur_micros)`. The monetary argument
is mandatory, positive and calculated on the server before database admission.
The installation removes the old six-argument overload, so an older caller
cannot bypass the financial guard. Runtime roles cannot directly read, alter or
reset `chat_quota.money_budgets`.

The two-argument `release(environment, lease_uuid)` retains the full financial
charge when usage is unknown. The three-argument overload additionally accepts
only a server-calculated settled cost bounded by that new lease's original
reservation. It can return unused money once, for an unexpired lease in the
same UTC day. Legacy NULL metadata, expiry and cross-day completion never
refund money. Neither overload refunds subject, network or global abuse units.

Use the helper's generated scoped runtime URL as the Vercel Secret
`CHAT_DATABASE_URL`, limited to the intended environment/branch. An automatically
generated Neon owner connection is not the deployment credential. Skip the
Marketplace's automatic owner-URL injection into project environments; its
administrative resource connection remains outside application runtime access. In particular,
roles created in the Neon console/API normally have elevated membership; create
this role with SQL and explicit grants. See
[Neon role permissions](https://neon.com/docs/manage/roles).

Keep the project on Free without a paid upgrade or billing activation. Free
compute/storage limits still apply: exhaustion can make admission unavailable,
and the chat must return 503 rather than send an unmetered model request.
See [Neon plans and limits](https://neon.com/docs/introduction/plans).

Database failures, malformed responses, missing configuration and unprovisioned
namespaces fail closed with 503. No memory or Redis fallback exists. These
shared abuse budgets are not exact OpenAI billing counts; datastore restoration
or administrative counter changes can affect enforcement. Keep edge/WAF
controls for HTTP floods and invalid-token traffic.

## Verified anonymous identities

Cloudflare's script loads only after the visitor starts the optional assistant.
Every question obtains a fresh single-use token. The server checks it with the
fixed Siteverify endpoint, exact hostname allowlist and `lexi_chat` action before
identity resolution, pricing, database admission or live context/provider work.
A valid browser cookie or Bearer header never bypasses this check. Invalid
tokens return 401; verifier/configuration failures return 503.

After successful verification, the server validates an existing
`__Host-lexi-visitor` cookie or creates one using a random 32-byte nonce and
HMAC-SHA256 signature over its nonce and expiry. The cookie is host-only,
`Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, and expires after 24 hours without
sliding refresh. It contains no account or hardware ID. Only a process-owned
proof derived from that validated cookie selects the anonymous subject HMAC;
request-supplied visitor IDs and copied JSON objects cannot choose it. A new
cookie is attached even if a later quota or provider step rejects the request.

Changing VPN/IP preserves the browser's subject quota while the cookie remains
valid. Deleting it, using private browsing/another profile, or waiting for its
expiry can create a new subject after a fresh challenge. This is anonymous
browser continuity, not an unbreakable per-person allowance.

Network limits still use the Vercel-owned client IP header independently of the
cookie subject. Native IPv6 is grouped by /64; IPv4-mapped IPv6 shares the IPv4
bucket. Other hosting platforms use a shared conservative network bucket until
a trusted adapter is implemented. User-controlled forwarding, user-ID and role
headers are not identity evidence. Only stable HMAC pseudonyms enter Postgres,
not raw IPs, cookie nonces, Turnstile tokens or messages.

The older JWT/OIDC identity code and authenticated quota policy remain dormant
for compatibility and isolated tests. The active Turnstile path always selects
the anonymous tier; that unused code does not create users, enable login or
grant private-context access.

## Default policy

| Budget | Anonymous browser |
| --- | ---: |
| Request bucket capacity / refill per minute | 6 |
| Reserved token-unit capacity / refill per minute | 400,000 |
| Requests per UTC day | 30 |
| Reserved token units per UTC day | 2,000,000 |
| Active chatbot requests (article lookup and model work) | 1 |

| Shared abuse budget | Per network | Global within namespace/environment |
| --- | ---: | ---: |
| Request bucket capacity / refill per minute | 30 | 60 |
| Reserved token-unit capacity / refill per minute | 1,000,000 | 1,000,000 |
| Requests per UTC day | No separate daily request cap | 1,000 |
| Reserved token units per UTC day | 5,000,000 | 10,000,000 |
| Active chatbot requests (article lookup and model work) | 3 | 8 |

These are abuse policy 2 limits, source-controlled in `src/lib/chat/quota.mjs`
and enforced by SQL. Thirty maximum-size 64,000-unit requests reserve 1,920,000
units, within the anonymous daily unit allowance. The separate thirty-request
daily cap, shared limits and €5 financial allowance still apply.

During the Preview rollout, the adapter accepts the known abuse policy versions
1 and 2 only, and requires money policy 1 for both. A database still on policy 1
continues to enforce its stricter anonymous 100,000-unit minute / 500,000-unit
daily and network 500,000-unit minute limits until the SQL migration is applied.
Unknown abuse versions and missing/mismatched money versions fail closed with
503. Neither compatibility path bypasses the mandatory EUR reservation.

Token buckets refill
continuously; the minute figures are capacities/refill rates, not fixed-window
resets. All scopes must admit a request. Denial returns 429 and the actual maximum
blocking `Retry-After` in seconds. A SQL function locks the namespace's seeded
guard row and checks subject, network, global and monetary budgets before
charging any of them. All scopes update in the same database transaction.
Database time is read after acquiring the locks, and missing global or monetary
state is an error, not a fresh budget. See PostgreSQL's
[row-locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html).

## Five-euro daily financial reservation

`chat_quota.money_budgets` enforces a ceiling of **5,000,000 integer EUR
millionths (€5) per UTC day for each provisioned namespace/environment**. Every
accepted operation charges its full server-calculated reservation in the same
transaction as the abuse counters and concurrency lease. Exhaustion returns
429 with a `Retry-After` that includes the time to the next UTC day. A cookie
reset, new browser, changed network or different application instance cannot
reset this shared allowance. Missing, corrupt or future-dated monetary state
fails closed with 503; runtime requests never seed or repair it.

The price card allows only `gpt-5.4-mini-2026-03-17` on `service_tier: default`;
the explicitly configured `gpt-5.4-mini` alias resolves to that snapshot. Other
models fail closed. The reviewed standard prices are $0.75 per million input
tokens and $4.50 per million output tokens. The calculation reserves the full
conservative input envelope and all 1,800 maximum generated tokens, ignores
cached-input discounts, converts using the dated ECB USD-per-EUR reference
rate, rounds upward and adds a further 10% margin. ECB metadata may be cached
for six hours while no more than seven days old. Invalid, unavailable or stale
FX prevents database admission and provider calls.

The price card was reviewed on **9 November 2026** and expires at **00:00 UTC
on 9 December 2026**. The expired card blocks new model calls until the official
model, tier, prices and review dates are checked and updated. See
[chatbot-security.md](chatbot-security.md) for the pinned price/FX policy and
primary references.

These are conservative API-usage estimates, not a guarantee of the final
tax/card/FX invoice. A completed, validated reply with consistent usage from the
pinned default-tier model may settle its new reservation using the reported
input and entire output counts, the same prices/ECB method and 10% margin.
Only an application-owned no-provider snapshot reports zero usage. Unknown or
invalid usage, context/provider/validation failure, cancellation and lost
responses retain the full charge. Older reservations are not reconstructed or
reduced from dashboard totals. Lease cleanup and any eligible financial delta
commit atomically once; an ambiguous cleanup timeout is never retried.
There is no automatic top-up or paid
upgrade. The cap covers this proxy's active namespace/environment; another
active environment needs a shared allowance or an explicitly allocated separate
budget before activation, rather than silently duplicating a site-wide promise.

## Token spikes and leases

Before database admission, preparation counts every UTF-8 byte of the serialized
static provider payload, including instructions, authorized static context,
history and schema, plus 4096 framing units and 1800 generated-token allowance.
The route adds 24,000 units of bounded article headroom for both reference text
and literal evidence choices, capped at 64,000 total units, and reserves
once before any live CMS read. Exhausted visitors cannot trigger that reader.
After retrieval, the exact serialized final request cost must fit the reserved
envelope and the 64,000-unit ceiling, or fail with 413 before a provider call.
These conservative abuse units include retained headroom and deliberately
differ from tokenizer/billing counts. Client-supplied costs, models and output
limits do not control the reservation.

The prepared request is frozen, process-local and single-use. After admission,
the provider sends its exact captured body with `max_output_tokens: 1800`.
Reasoning/non-visible generation is included in that output limit. Successful
abuse reservations are not refunded after context/preparation/provider failure, cancellation or lost
responses, preventing error/retry loops from bypassing token or EUR budgets.

Each admitted call owns a UUID lease counted across its subject, network and
global scope for 60 seconds, longer than the 30-second provider deadline.
`finally` removes only that UUID in the role's namespace. If cleanup fails or a
server crashes, expiry prevents permanent lockout;
retrying cleanup cannot remove another request's lease or refund counters.

Old subject/network rows are eligible for bounded pruning after the next UTC
midnight plus 24 hours. Expired leases no longer count toward concurrency and
are pruned. New identity rows are created only after all scopes admit the
request, so denials cannot create unbounded identity state. Stored fields are
pseudonymous IDs, numeric counters/timestamps and lease UUIDs, never messages
or raw JWTs.

## Validation

`npm run test:chat` uses mocked HTTP responses and local signing fixtures, with
no OpenAI or database credentials required. It validates Turnstile failure and
replay handling, signed-cookie ownership/expiry, stable anonymous and network
grouping, frozen request costs, conservative EUR/FX calculations, expired price
cards, spike limits, cookie-bearing error responses and the mandatory
seven-argument SQL contract. Local JWT tests cover the dormant identity path;
they do not imply a visitor login feature. Mocks do not prove database atomicity
or privileges.

`npm run test:chat:neon -- --run` separately validates the actual SQL in a designated
test database. Administrative fixture access remains separate from the scoped
runtime credential. The suite uses isolated test roles/namespaces for concurrent
subject/network/global admission, token spikes, daily token and EUR limits,
UTC monetary rollover, lease ownership, bounded monetary settlement, unknown-cost
forfeiture, unchanged abuse counters and permission denials.
Authenticated identities appear only as dormant-policy fixtures. It never calls an LLM or
reads another application's records. Pipe a credential manager's in-memory JSON
object with `adminUrl`, `runtimeUrl` and `designatedTestDatabase: true` to stdin;
never place credentials in command arguments, files or chat. Input is limited to
20 KiB and 10 seconds. Without `--run`, the command prints usage and makes no
network calls; importing the module also performs no I/O.
