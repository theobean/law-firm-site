# Production cutover with one €5 UTC-day allowance

The prepared cutover retires database admission for **all** existing Preview
deployments and enables a separate least-privilege Production role. It carries
Preview's final charge for the current UTC day into Production before activation.
The 5,000,000 EUR-micro ceiling, abuse policy 2, settlement rules, OpenAI model,
Neon Free plan and absence of automatic top-ups remain unchanged.

These files are operator-run SQL, not automatic deployment migrations. Preparing
them does not execute SQL, create credentials, enable billing or activate chat.
Use the existing dedicated quota database, not an application/customer database.

## Review and preparation

Production needs its own narrowly scoped OpenAI service-account key, a Free
Managed Turnstile widget with pre-clearance disabled, and a SQL-created
`chat_quota_production` credential. Keep owner/admin credentials outside Vercel.
The Production widget and `CHAT_TURNSTILE_HOSTNAMES` must allow the exact serving
hostname `www.ioannispapaioannou.lawyer`; add `ioannispapaioannou.lawyer` only if it
serves the assistant instead of redirecting. No wildcard, URL, port or Preview
hostname belongs in the Production backend allowlist. The widget action is
`lexi_chat`. Preview widget/service-account credentials remain distinct.

Required Production Vercel variable names:

```text
CHATBOT_ENABLED
OPENAI_API_KEY
CHAT_DATABASE_URL
CHAT_RATE_LIMIT_SECRET
CHAT_TURNSTILE_ENABLED
NEXT_PUBLIC_CHAT_TURNSTILE_ENABLED
NEXT_PUBLIC_TURNSTILE_SITE_KEY
CHAT_TURNSTILE_SECRET_KEY
CHAT_TURNSTILE_HOSTNAMES
```

Keep `CHATBOT_ENABLED=false` during preparation. For the final build, all three
enabling flags must be `true`. Use a new private stable 32+ character rate-limit
secret. `OPENAI_CHAT_MODEL` is optional; the approved snapshot/default and alias
remain enforced in code. `VERCEL_ENV=production` is supplied by Vercel; do not
override it to reuse the Preview database role. Public variables and the UI
enabling flag require a new build. Existing non-chat Production variables remain
in place.

Run `npm run test:chat` and `npm run build` locally. The SQL rollback fixture below
also needs execution against the actual PostgreSQL installation before cutover.
Keep Production database admission disabled until browser/cookie, secret, provider
permission and deployment checks are ready.

## Exact operator sequence

1. In the authenticated Neon SQL editor for the dedicated quota database, run
   [`20261110_03_admission_control.sql`](../db/migrations/20261110_03_admission_control.sql)
   using the trusted provisioning administrator, which is a member of the
   non-login `chat_quota_owner`. This adds owner-controlled admission state and
   installs its guard under the existing namespace row lock. Existing policies,
   balances, counters, leases, function identities, ownership and ACLs are checked
   for preservation. It is safe to repeat. Do not reinstall legacy migration 01
   afterward: that historical file predates the admission switch.
2. Run [`production-cutover-rollback.sql`](../db/tests/production-cutover-rollback.sql)
   as the same administrator. It temporarily locks namespace admission and uses
   an isolated namespace, transient roles and a private fixture clock. All
   fixture changes, credentials and function replacements roll back before
   success. It verifies frozen stale callers, settlement/release during drain,
   unchanged Preview abuse counters, an exact same-day carry, rejection beyond
   the remaining €5 allowance, a next-day zero carry, freeze retry behavior and
   rejection of active/nonzero/previously used Production targets. It verifies
   the original rows, functions, roles, memberships and database ACL afterward.
   Queued-call safety follows from the guard being checked after the same row
   lock used to freeze; local contract tests verify that ordering. The fixture
   itself is single-session and does not exercise a concurrent lock waiter.
   For the separate designated-test-database integration run,
   `npm run test:chat:neon -- --run` now also uses independent PostgreSQL sessions
   to prove a runtime reservation is queued on the namespace lock before the
   owner commits a freeze; that waiting caller must then reject without charging.
   This opt-in test uses generated isolated fixtures and cleans them up. Supply
   its administrative/runtime credentials only through the documented in-memory
   stdin channel; do not run it against Production or paste credentials in args.
3. Run [`20261110_04_freeze_preview_admission.sql`](../db/migrations/20261110_04_freeze_preview_admission.sql).
   It freezes only `law-firm-site-chat` / `preview`, records the database clock
   after acquiring the admission guard, and preserves that timestamp on retries.
   Every old immutable Preview deployment now fails closed before admission.
   Existing requests may finish and settle; no Preview balance or abuse counter
   is reset. Removing a widget or deploying a disabled Preview build alone would
   leave older deployments callable, so the database freeze is required.
4. Wait at least **65 seconds** after the committed freeze and confirm no Preview
   lease is still live. This exceeds the 60-second lease and 30-second provider
   deadline; late expired settlements cannot refund the final carried balance.
   The following stages independently enforce this drain.
5. Provision the Production role/namespace while admission stays disabled.
   For the SQL-editor path, use
   [`20261110_05_provision_production.template.sql`](../db/migrations/20261110_05_provision_production.template.sql).
   Replace its single password assignment placeholder only inside the private
   editor with a cryptographically random 43–128 character base64url value from
   a secure generator. The untouched placeholder intentionally fails. Never
   save the edited query or credential in source, local files, logs or chat.
   The template creates a fresh SQL role with no memberships/administrative
   flags, connection/schema usage, only the three quota-function grants and no
   table access or database/schema creation/TEMP privileges. Existing roles or
   Production namespaces cause rollback without resets. Alternatively import
   `provisionChatQuota` from `scripts/setup-chat-neon.mjs`, pass the admin URL
   only in memory with `environment: "production"`, `policyVersion: 2`,
   `namespace: "law-firm-site-chat"`, `roleName: "chat_quota_production"` and
   `dedicatedDatabase: true`. New Production namespaces always start disabled;
   transfer its secret-bearing `runtimeUrl` directly into the secret manager.
6. Privately assemble the runtime URL using the existing Neon database endpoint,
   the new SQL role/password and TLS (`sslmode=require` or `verify-full`, with
   optional `channel_binding=require`). Put only that scoped URL in Production
   `CHAT_DATABASE_URL`. Configure the other Production variables and the final
   build with `CHATBOT_ENABLED=true`; database admission is still frozen. Check
   PR/build status, cookie/privacy behavior, rendered UI, production hostnames,
   secret isolation, provider permissions and Vercel Ready/domain assignment.
   A chat submission during this gate must fail closed, not call OpenAI.
7. When all gates are ready, run
   [`20261110_06_activate_production_carry_budget.sql`](../db/migrations/20261110_06_activate_production_carry_budget.sql).
   One transaction locks both namespaces, validates Preview is frozen/drained,
   requires the correct runtime bindings and a virgin disabled Production
   namespace, copies Preview's final current-day reserved EUR amount, then
   enables Production policy 2. Yesterday's amount carries zero. Preview stays
   frozen with all its original state intact. If Preview has already charged
   €5 today, Production correctly remains budget-exhausted until UTC midnight.
   An already-active or used/nonzero Production target is rejected before writes;
   do not clear it to make a retry pass. There is no second fresh same-day €5.
8. Verify one bounded Production response with a real fresh Turnstile token,
   signed-cookie flags and same-origin enforcement, then confirm the database
   has only Production enabled for this namespace and Preview stays frozen.
   Retire the Preview OpenAI key and set the branch Preview UI flag false after
   verification. Leave the database freeze in place regardless of old URLs.

Read-only operator status (no secrets, messages, subject/network hashes or lease
UUIDs):

```sql
SELECT n.environment, n.policy_version, n.admission_enabled,
       n.admission_frozen_at, m.day, m.reserved_eur_micros,
       (SELECT count(*) FROM chat_quota.leases AS l
        WHERE l.namespace = n.namespace AND l.environment = n.environment
          AND l.expires_at > pg_catalog.clock_timestamp()) AS active_leases
FROM chat_quota.namespaces AS n
JOIN chat_quota.money_budgets AS m USING (namespace, environment)
WHERE n.namespace = 'law-firm-site-chat'
ORDER BY n.environment;
```

## Stop and rollback

Any failed stage leaves that SQL statement rolled back. Before activation,
Production stays disabled; Preview remains frozen after stage 04. Resolve a
failed gate without resetting budgets. To stop Production after activation, an
owner can freeze its admission under the same guard:

```sql
UPDATE chat_quota.namespaces
SET admission_enabled = false, admission_frozen_at = pg_catalog.clock_timestamp()
WHERE namespace = 'law-firm-site-chat' AND environment = 'production'
  AND admission_enabled;
```

Also disable the UI with a new build when appropriate. Keep both environments
frozen if rolling back deployment code. Do not reactivate Preview or rerun a
fresh Production seed to regain availability: after Production spending, that
would require a reviewed reverse balance carry or waiting for the next UTC day.
No rollback step clears counters, restores an old monetary snapshot, changes the
€5 constant or upgrades the Neon Free plan.
