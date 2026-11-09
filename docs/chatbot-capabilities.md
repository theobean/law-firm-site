# Chatbot capabilities and least privilege

The assistant answers questions from authorized public context. It has no
executable tools. `service.ts` constructs every Responses API request with
`tools: []` and `tool_choice: "none"`; request fields and conversation text
cannot supply another capability catalog. The model branch makes at most one
request to the fixed `https://api.openai.com/v1/responses` endpoint and rejects
redirects. Recognized deadline/appointment requests can return application-owned
wording before that request. There is no model-driven dispatcher or tool-result
execution loop. See the official
[tool-choice documentation](https://developers.openai.com/api/docs/guides/function-calling#tool-choice).

Provider output accepts only reasoning items and text message items. Unknown
item types, tool/action items and malformed or non-text message content fail with `502`, even
when accompanied by a valid answer. Reasoning text is not displayed or executed.
Reply structure and selected source IDs are checked before the whole grounded
answer is screened for recognized procedural deadlines. A match replaces the
entire answer with fixed refusal/contact wording; no partial answer is displayed.
Quoted, attributed, historical and caveated deadlines have no exemption.
Non-grounded kinds discard model prose. The final answer uses the React text
renderer; source-ID validation alone is not proof that every claim is supported.

| Component | Permitted access | Unavailable through chat |
| --- | --- | --- |
| Model context | Approved office/legal summaries, reviewed original et.gr gazettes and up to two registered public article excerpts | Case files, private CMS/database records, arbitrary URLs or documents |
| Model tools | None | Functions, MCP, browsing, shell, file search and write actions |
| Chat backend | Fixed Turnstile verification, ECB metadata and tokenless published-article reads; at most one bounded model request, or a controlled pre-provider reply | Model-chosen destinations or API credentials in context |
| Quota backend | Two parameterized SQL function calls reserving counters and releasing owned leases | Direct table access, model-selected SQL, private case data or database administration |
| Visitor interface | Text questions, progressively revealed answers, direct-contact links | Sending messages, confirming bookings, accepting cases, payments, filing or deleting records |

Source IDs and URLs remain validated in the backend and response parser; the
visitor interface does not display source lists. A persistent notice states
that answers are general information, not legal advice. Primary gazettes are
identified as original publications; lawyer articles are attributed commentary.
Clicking the contact link opens the existing contact page. `suggestContact` is a
display flag, not authorization or an instruction to submit anything. Existing
site forms and administrative routes are not exposed as chatbot tools. The
server process still has normal network access; this policy is an application
capability boundary, not operating-system or network sandboxing.

## Controlled replies and output limits

The prepared request owns a single-use snapshot of validated input and authorized
sources. It records recognized deadline or appointment intent, with deadline
precedence. Consuming that snapshot can return fixed localized text without an
OpenAI call, while preserving identity/security checks, quota admission, context
authorization and exact size validation. CMS lookup may already have occurred;
the existing accepted reservation is not refunded. Forged or replayed prepared
handles cannot invoke this branch.

Deadline detection uses the current user question and bounded user history.
Appointment detection uses only the explicit current user request, not assistant
claims or a time-only follow-up. Its reply states that bookings, changes,
cancellations and availability checks are unavailable, then gives manual office
contact. Recognizing an intent grants no action capability and does not send a
message or collect appointment details. A model-selected controlled kind uses
the same application wording after source-ID validation.

The deadline request/output guards are bounded lexical rules, not a calculator
or semantic safety proof. They reject common numeric, spelled-out and dated
procedural limits without treating ordinary office hours or statute identifiers
as deadlines. Untested phrasing may escape detection or be conservatively
referred. The prompt separately requests brief, direct answers and shorter
clarifications, without repeated contact/disclaimer paragraphs. Its word targets
are not a backend truncation rule; whole-response validation and the existing
generation/size ceilings remain in place. Local tests and earlier live answers
do not establish that the current live rerun has passed.

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
