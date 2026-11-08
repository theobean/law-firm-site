# Chatbot capabilities and least privilege

The assistant answers questions from authorized public context. It has no
executable tools. `service.ts` constructs every Responses API request with
`tools: []` and `tool_choice: "none"`; request fields and conversation text
cannot supply another capability catalog. The server makes one request to the
fixed `https://api.openai.com/v1/responses` endpoint, rejects redirects, and has
no model-driven dispatcher or tool-result execution loop. See the official
[tool-choice documentation](https://developers.openai.com/api/docs/guides/function-calling#tool-choice).

Provider output accepts only reasoning items and text message items. Unknown
item types, tool/action items and malformed or non-text message content fail with `502`, even
when accompanied by a valid answer. Reasoning text is not displayed or executed.
The answer still passes the existing reply/source checks and React text renderer.

| Component | Permitted access | Unavailable through chat |
| --- | --- | --- |
| Model context | Projected fields of 13 approved public sources | Case files, private CMS/database records, arbitrary URLs or documents |
| Model tools | None | Functions, MCP, browsing, shell, file search and write actions |
| Chat backend | One bounded model request; configured public JWKS lookup when OIDC is enabled | Model-chosen destinations or API credentials in context |
| Quota backend | Fixed Lua scripts updating quota counters and concurrency leases | Model-selected commands, keys or arbitrary data queries |
| Visitor interface | Text questions, source links, direct-contact links | Sending messages, confirming bookings, accepting cases, payments, filing or deleting records |

Clicking the contact link opens the existing contact page. `suggestContact` is a
display flag, not authorization or an instruction to submit anything. Existing
site forms and administrative routes are not exposed as chatbot tools. The
server process still has normal network access; this policy is an application
capability boundary, not operating-system or network sandboxing.

## Deployment credentials

Use a dedicated OpenAI project service account with the minimum model-request
role and a restricted key; keep files, vector stores, assistants, batches and
organization administration out of its permissions. Model-request permissions
can cover multiple model endpoints, so this is not a claim of a Responses-only
credential scope. Restrict supported key scopes and allowed models further in
the provider dashboard, and isolate preview/production projects. The application
uses only the fixed endpoint above. Credentials remain server-only, outside
prompts, browser code, logs and source control. See official
[API credentials](https://developers.openai.com/api/docs/guides/api-keys) and
[RBAC permissions](https://developers.openai.com/api/docs/guides/rbac).

Redis needs writes to enforce quotas; a read-only token cannot reserve budgets
or release leases. Provision a dedicated quota database and an ACL REST token
limited to the deployed environment's key prefix and the commands listed in
[quota setup](chatbot-quotas.md#least-privilege-redis-access). A key namespace is
not a credential permission boundary. Do not put office/client data in this
store or use a credential shared with another application. Never provide
Upstash account-management credentials to the application.

Provider permissions must be configured and verified when issuing permanent
credentials. They have not been changed or verified by these code changes.

## Human approval for future actions

Destructive and high-impact actions are unavailable in this release. There is
no action endpoint or approval UI, and a visitor/model field such as
`confirmed: true` grants nothing. Adding an API or write integration requires a
separate implementation and review before it can be enabled.

That implementation must use an explicit server-side operation allowlist and
credentials limited to the required records and operations. For deletion,
external messages, appointments, financial operations, filings or changes to
client matters, it must first show the exact proposed operation, target,
arguments and consequences to an authorized human. The backend must authenticate
the approver, recheck resource/operation permissions, and bind approval to the
exact immutable proposal with a short expiry and single-use execution record.
Changed arguments, expiry, replay, cancellation, missing approval or model text
claiming approval must prevent execution. Use idempotency and an audit record
without sensitive chat content. A model may propose an action; it cannot approve
itself, mint an approval token or bypass that independent execution gate.

Current tests verify the disabled-capability boundary using a mocked provider.
They do not certify future action integrations or cloud credential policies.
