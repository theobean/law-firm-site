# Chat rate limits, identities and quotas

The only production model route, `POST /api/chat`, resolves a server-verified
quota identity, authorizes public context, prepares an immutable model request,
atomically reserves its cost in Neon Postgres, and then sends that exact request.
There is no in-memory admission fallback. Authentication affects quotas only;
the AI context remains public-only.

## Configuration

Set a server-only `CHAT_DATABASE_URL` for the SQL-created runtime role and a
stable private `CHAT_RATE_LIMIT_SECRET` of at least 32 characters. Keep that
secret across instances and redeployments; rotating it changes identity hashes.
Do not store an owner/admin database URL in deployment variables, application browser code, source control
or logs. The connection requires a Neon Postgres hostname and TLS. `VERCEL_ENV`
must match the environment provisioned for that database role.

The quota namespace is provisioned in the database and bound to the login role.
A client-supplied namespace, SQL parameter or request cannot widen it. Use a
separate runtime role and namespace for preview, production and development.
The public context principal and OIDC identity verification remain independent.

### Least-privilege database access

Create a dedicated Neon **Free** project for quotas. Install
`db/chat-quotas.sql` using the import-only provisioning helper
`scripts/setup-chat-neon.mjs` with an administrative connection held only during
setup. SQL-created runtime roles receive connection/schema usage and execution
of `chat_quota.reserve` and `chat_quota.release`. They receive no direct table
read/write, schema creation, temporary-table, role-management or administrative
permissions. Runtime roles are not schema owners and inherit no owner role.

The two functions use a fixed search path, qualified objects and validated
parameters under a separate non-login owner. Public execution is revoked.
`session_user` selects the provisioned namespace; the environment parameter must
match that mapping. The model receives neither a connection string nor any SQL
or database tool. This database stores quota metadata only.

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

## Verified identities

Without Authorization, the anonymous identity uses the Vercel-owned client IP
header. Native IPv6 is grouped by /64; IPv4-mapped IPv6 shares the IPv4 bucket.
Other hosting platforms use a shared conservative network bucket until a trusted
adapter is implemented. User-controlled forwarding, user-ID and role headers are
not identity evidence. Only stable HMAC pseudonyms enter Postgres, not raw IPs or
account subjects.

For authenticated API clients, configure all of `CHAT_AUTH_ISSUER`,
`CHAT_AUTH_AUDIENCE`, `CHAT_AUTH_JWKS_URL`. The server verifies a JWT Bearer token
using the configured JWKS, RS256/ES256 signature, issuer, audience, subject and
expiry. It does not decode unsigned claims to choose a tier. Invalid tokens return
401; incomplete configuration or verifier infrastructure failure returns 503.
An invalid token never falls back to another tier. The identity is based on
verified issuer+subject, so refreshing a token does not reset the user's quota.

The browser widget currently submits anonymous requests. Connecting a real login
provider and sending its access token is a separate client integration; these
settings do not create users, sessions or a sign-in UI. Authenticated requests
still receive only the existing approved public context.

## Default policy

| Budget | Anonymous | Authenticated |
| --- | ---: | ---: |
| Request bucket capacity / refill per minute | 6 | 20 |
| Reserved token-unit capacity / refill per minute | 100,000 | 300,000 |
| Requests per UTC day | 30 | 300 |
| Reserved token units per UTC day | 500,000 | 5,000,000 |
| Active model requests | 1 | 2 |

| Shared budget | Per network | Global |
| --- | ---: | ---: |
| Request bucket capacity / refill per minute | 30 | 60 |
| Reserved token-unit capacity / refill per minute | 500,000 | 1,000,000 |
| Requests per UTC day | No separate daily request cap | 1,000 |
| Reserved token units per UTC day | 5,000,000 | 10,000,000 |
| Active model requests | 3 | 8 |

The policy is source-controlled in `src/lib/chat/quota.mjs`. Token buckets refill
continuously; the minute figures are capacities/refill rates, not fixed-window
resets. All scopes must admit a request. Denial returns 429 and the actual maximum
blocking `Retry-After` in seconds. A SQL function locks the namespace's seeded
guard row and checks subject, network and global budgets before charging any
of them. All three scopes update in the same database transaction. Database
time is read after acquiring the lock, and missing global state is an error,
not a fresh budget. See PostgreSQL's
[row-locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html).

## Token spikes and leases

Before database admission, preparation counts every UTF-8 byte of the full serialized
provider payload, including system instructions, public context, conversation
history and JSON schema. It reserves that count plus 4096 framing units and the
full 1800 generated-token allowance. These conservative units deliberately differ
from exact tokenizer/billing counts. Requests above 64,000 reserved units fail
with 413 before a provider call. Client-supplied costs, models and output limits
do not control this reservation.

The prepared request is frozen, process-local and single-use. After admission,
the provider sends its exact captured body with `max_output_tokens: 1800`.
Reasoning/non-visible generation is included in that output limit. Successful
reservations are not refunded after provider failure, cancellation or lost
responses, preventing error/retry loops from bypassing budgets.

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

`npm run test:chat` uses local signed JWTs and mocked HTTP responses, with no
OpenAI or database credentials required. It validates signature/claims handling,
stable identity grouping, frozen request costs, spike limits, transport failure
handling and parameterized SQL function contracts. Mocks do not prove database
atomicity or privileges.

`npm run test:chat:neon -- --run` separately validates the actual SQL in a designated
test database. Administrative fixture access remains separate from the scoped
runtime credential. The suite uses isolated test roles/namespaces for concurrent
anonymous/authenticated/network/global admission, token spikes, daily limits,
lease ownership, no refunds and permission denials. It never calls an LLM or
reads another application's records. Pipe a credential manager's in-memory JSON
object with `adminUrl`, `runtimeUrl` and `designatedTestDatabase: true` to stdin;
never place credentials in command arguments, files or chat. Input is limited to
20 KiB and 10 seconds. Without `--run`, the command prints usage and makes no
network calls; importing the module also performs no I/O.
