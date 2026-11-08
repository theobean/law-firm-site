# Chat rate limits, identities and quotas

The only production model route, `POST /api/chat`, resolves a server-verified
quota identity, authorizes public context, prepares an immutable model request,
atomically reserves its cost in shared Redis, and then sends that exact request.
There is no in-memory admission fallback. Authentication affects quotas only;
the AI context remains public-only.

## Configuration

Set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and a stable private
`CHAT_RATE_LIMIT_SECRET` of at least 32 characters. Use the same secret and
`CHAT_QUOTA_NAMESPACE` across instances and redeployments. The namespace defaults
to `law-firm-site-chat`; development, preview and production have separate keys.
Changing the namespace or HMAC secret resets some counters, so do not rotate them
per request/deployment. No `NEXT_PUBLIC_*` variable may contain these credentials.

Use a permanent Redis database for deployed traffic. Scratch/expiring test
databases are not deployment configuration. Disable Redis key eviction so budget
keys cannot disappear early. The REST token must allow EVAL and the hash/sorted
set/expiry operations used by the scripts. Keep administrative access to quota
keys separate from visitor access. See the official
[REST API](https://upstash.com/docs/redis/features/restapi),
[eviction](https://upstash.com/docs/redis/features/eviction) and
[consistency](https://upstash.com/docs/redis/features/consistency) documentation.

Redis failures, malformed responses and missing configuration fail closed with
503. This is a shared abuse budget, not an exact dollar billing cap: counter loss
through administrative deletion, eviction or datastore failover can affect
enforcement. Keep edge/WAF controls for HTTP floods and invalid-token traffic,
which is rejected before model admission.

## Verified identities

Without Authorization, the anonymous identity uses the Vercel-owned client IP
header. Native IPv6 is grouped by /64; IPv4-mapped IPv6 shares the IPv4 bucket.
Other hosting platforms use a shared conservative network bucket until a trusted
adapter is implemented. User-controlled forwarding, user-ID and role headers are
not identity evidence. Only stable HMAC pseudonyms enter Redis, not raw IPs or
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
blocking `Retry-After` in seconds. A single atomic Lua EVAL uses Redis TIME, checks
all scopes before charging, and reserves every scope together. All keys are
declared and share a Redis Cluster hash slot. See Redis's
[atomic scripting documentation](https://redis.io/docs/latest/develop/programmability/eval-intro/).

## Token spikes and leases

Before Redis admission, preparation counts every UTF-8 byte of the full serialized
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

Each admitted call owns a UUID lease in subject/network/global sorted sets for
60 seconds, longer than the 30-second provider deadline. `finally` removes only
that UUID. If cleanup fails or a server crashes, expiry prevents permanent lockout;
retrying cleanup cannot remove another request's lease or refund counters.

Quota hashes expire at the next UTC midnight plus 24 hours (24–48 hours after the
latest update). Lease keys expire after two minutes without admission. They store
only pseudonymous IDs, numeric counters/timestamps and lease UUIDs, never messages
or raw JWTs.

## Validation

`npm run test:chat` uses local signed JWTs and mocked HTTP responses, with no
OpenAI or Redis credentials required. It validates signature/claims handling,
stable identity grouping, frozen request costs, spike limits, transport failure
handling and Redis command contracts. HTTP mocks do not prove Lua atomicity.

`npm run test:chat:redis` separately executes the actual Lua against a disposable
Redis database with `CHAT_REDIS_TEST_DATABASE=true`. It checks concurrent
anonymous/authenticated/network/global admission, token spikes, daily limits,
crash/lease handling and immutable charges. It uses random test namespaces and
deletes only exact keys it created; it never flushes a database or calls an LLM.
