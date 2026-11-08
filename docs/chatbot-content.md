# Chatbot content scope

`src/lib/chat/knowledge.ts` supplies a small, curated snapshot to the assistant.
Sources were inspected on **8 November 2026**. The assistant does not browse the
web at runtime, and a citation is not evidence of real-time legal verification.

## Server-enforced access boundary

The chatbot uses a source-controlled public snapshot. It performs no database,
Sanity, case-file, contact-list or private-document queries to fetch AI context. The public endpoint
always receives the server-issued `public` principal, with `chat:read:public`
permission. HTTP headers, request-body roles, conversation roles, IDs and model
instructions cannot create another principal or widen the scope.
Optional OIDC verification selects a request/token quota tier only; it does not
replace this public data principal or enable private case access. Redis holds
quota counters, not legal context. See [quota configuration](chatbot-quotas.md).

`src/lib/chat/access.mjs` implements default-deny source access before content
readers run. An entry needs a known approved ID, public visibility and published
state. Private, draft and unknown entries have no reader invocation. Reader
results are checked against that authorization and projected to exactly `id`,
`title`, `url`, `content`; extra internal notes, identifiers and metadata are not
sent to the model. The projected snapshot is frozen, and the provider accepts only
an opaque context authorized in that server process. A raw array, copied object
or JSON-shaped context fails with `403` before any model call. The knowledge
module also has a Next.js `server-only` import guard.

| Principal / resource | Access |
| --- | --- |
| Server-issued public principal + approved published public snapshot | Read the projected fields |
| Private, unpublished or unknown source | Denied before reader invocation |
| Forged, missing or unsupported principal / scope | Denied before reader invocation |
| Client-supplied role, permissions, record IDs or context | Cannot grant access |

This is public-only authorization, not database RBAC for a nonexistent private
integration. Do not add privileged database/CMS readers behind these public
factories. A future authenticated data integration must verify identity on the
server, enforce tenant/case membership and field permissions in its query or
database row-level policy before fetching any context, and use credentials with
the corresponding least privilege. Filtering a fully fetched private dataset or
telling the model to hide it is not an authorization boundary. See the
[OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Prompt data boundaries

The Responses API `instructions` field contains only the static application
template and the language selected from the validated locale enum. Its
`<assistant_instructions>` wrapper separates scope/grounding and instruction
integrity rules. No reference prose or conversation text is interpolated into
that field.

The lower-priority API input contains one user message with three fixed blocks:
`<reference_material format="json">`, `<conversation_history format="json">`
and `<user_input>`. The first contains only authorized source IDs, titles and
content. The second contains up to eight normalized preceding messages; the
third contains the final normalized user question. Browser-supplied assistant
history is serialized as data, never sent as native assistant messages or
trusted evidence. URLs still come from the authorized snapshot when the server
validates the selected source IDs.

Reference/history JSON is serialized before XML text escaping. Every dynamic
text value escapes `&`, `<` and `>` in that order, so visitor-supplied closing
tags cannot structurally close a block and pre-encoded entities remain literal
after one decoding pass. Tag names and attributes are fixed application text.
Quota reservation includes the final escaped, serialized provider payload;
escaping expansion cannot bypass the request budget.

These boundaries help distinguish instructions from data. They do not guarantee
that a model will resist semantic prompt injection or answer correctly. Server
authorization before readers, Redis admission, the allowed source-ID schema,
reply validation and React text rendering remain independently enforced. Tests
inspect outbound request structure with a mocked provider; live adversarial
model evaluation remains necessary before public activation. See the
[OpenAI prompt formatting guidance](https://developers.openai.com/api/docs/guides/prompt-engineering#message-formatting-with-markdown-and-xml).

## Office information

Five entries cover the firm's identity, published contact information, requests
for appointments, published practice areas and nationwide coverage. Localized
fields are selected explicitly from `messages/el.json`, `messages/en.json` and
`messages/de.json`. Canonical office URLs use
`https://ioannispapaioannou.lawyer/{locale}/…`.

The full FAQ and marketing copy are deliberately not ingested. In particular,
the chatbot does not inherit the FAQ's 24-hour response promise or blanket
confidentiality statement. It has no booking calendar, matter-management access,
case-status access or authority to accept an engagement. Fees and free initial
consultations are not specified in the curated data.

## General information

Eight entries provide brief, paraphrased explanations of debt settlement, the
banking Code of Conduct, credit servicers, the Greek national payment-order
procedure, mediation, labor disputes, land-registry records and inheritance-tax
declarations. Each entry carries its exact supporting primary-source URL.

Sources are the Ministry of Economy and Finance, Bank of Greece, European
e-Justice Portal / European Judicial Network, Ministry of Justice, Hellenic Labour
Inspectorate, Hellenic Cadastre and AADE. The payment-order entry uses only the
general nature of the national procedure described on e-Justice; procedural
details on that page may be older and are not incorporated.

No entry supplies statutory deadlines, monetary thresholds, eligibility tests,
specific remedies, predictions or guarantees. Questions beyond these limited
explanations need clarification or referral to the office. A user mentioning
served documents or a pending auction should be directed promptly to the firm
without computing a deadline in chat. Different languages do not change the
jurisdiction to a different country.

## Maintaining the snapshot

Review the excerpts with a lawyer before enabling public AI answers and whenever
the underlying subject or an office detail changes. Verify each source, update
the wording and record the new review date. Avoid importing complete webpages:
they may include outdated rules, unrelated material or unsupported promises.
Keep user case facts, uploaded documents and conversation logs out of this file.
New source IDs must be explicitly approved in the access policy as well as the
catalog. Publishing/editing data alone does not expand the allowlist. The public
classifications are trusted, reviewed application configuration; the policy is
not a classifier that can discover confidential prose mislabeled as public by a
developer.
