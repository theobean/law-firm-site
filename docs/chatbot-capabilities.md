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
| Quota backend | Two parameterized SQL function calls reserving counters and releasing owned leases | Direct table access, model-selected SQL, private case data or database administration |
| Visitor interface | Text questions, source links, direct-contact links | Sending messages, confirming bookings, accepting cases, payments, filing or deleting records |

Clicking the contact link opens the existing contact page. `suggestContact` is a
display flag, not authorization or an instruction to submit anything. Existing
site forms and administrative routes are not exposed as chatbot tools. The
server process still has normal network access; this policy is an application
capability boundary, not operating-system or network sandboxing.

## Deployment credentials

Use a service account and restrict its key to Responses creation, keeping files,
vector stores, other model endpoints and administration out of its effective
permissions. The current dashboard's Responses Write selection may bundle
Responses Read; that does not justify enabling other API resources. Prefer a
matching narrow role where the account supports its assignment, and verify the
key's actual endpoint permissions. The application uses only the fixed endpoint
above. Isolate preview/production credentials. Credentials remain server-only, outside
prompts, browser code, logs and source control. See official
[API credentials](https://developers.openai.com/api/docs/guides/api-keys) and
[RBAC permissions](https://developers.openai.com/api/docs/guides/rbac).

Neon Postgres needs controlled writes to reserve budgets and release leases.
Provision a dedicated Free quota database. Deploy only a SQL-created runtime
role with connection/schema usage and execution of the two quota functions,
with no table read/write, schema creation, temporary-table or administration
rights. The database binds its login role to one namespace/environment. The
non-login function owner and setup administrator are separate from the
application credential. See
[quota setup](chatbot-quotas.md#least-privilege-database-access).
No office/client records belong in this store. Its credentials are never model
context or tools, and owner/admin database credentials never belong in the
deployed application's environment. Marketplace resource administration is a
separate trusted control plane; its automatic owner-URL project injection is skipped.

Provider permissions must be configured and tested when issuing credentials;
code and mocked transport tests alone do not prove the grants on a deployed
database or API key. Keep the Neon Free plan; the setup does not authorize a
paid upgrade or billing activation.

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
