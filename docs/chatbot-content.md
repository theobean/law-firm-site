# Chatbot content scope

`src/lib/chat/knowledge.ts` combines office facts, topic-selected reviewed legal
summaries and relevant excerpts from registered, published articles by the lawyer.
The initial sources were inspected on **8 November 2026**; the Katseli-law
introduction, National Printing Office originals and public article registry
were checked on **9 November 2026**. The assistant does not perform open-web
research at runtime. A dated source is not proof of current consolidated law.
The broader banking and general-practice catalog was inspected on the same date.
It now contains **40 legal excerpts: five original gazettes and 35 official
guidance cards**. The later corrections distinguish the employment definition
from an employer's notification duty, use the Labour Inspectorate's 2025
harassment definition and add a bounded inheritance-renunciation explanation.
Exact URLs, classifications, limitations and question examples are recorded in
[the source review](chatbot-source-review.md).

## Server-enforced access boundary

The chatbot uses a source-controlled public catalog and one bounded, tokenless
read of explicitly registered, published Sanity articles. It performs no
case-file, contact-list or private-document queries. The public endpoint
always receives the server-issued `public` principal, with `chat:read:public`
permission. HTTP headers, request-body roles, conversation roles, IDs and model
instructions cannot create another principal or widen the scope.
Visitors do not have accounts or login. Turnstile and a signed browser cookie
select an anonymous quota identity; they do not replace this public data principal
or enable private case access. Neon Postgres holds quota counters, not legal
context. See [quota configuration](chatbot-quotas.md).
The CMS read is performed by server code, not by an executable model tool; see the
[capability policy and human-approval requirements](chatbot-capabilities.md).

`src/lib/chat/access.mjs` implements default-deny source access before content
readers run. An entry needs a known approved ID, public visibility and published
state. Private, draft and unknown entries have no reader invocation. Reader
results are checked against that authorization and projected to exactly `id`,
`title`, `url`, `content`; extra internal notes, identifiers and metadata are not
sent to the model. The projected snapshot is frozen, and the provider accepts only
an opaque context authorized in that server process. A raw array, copied object
or JSON-shaped context fails with `403` before any model call. The knowledge
module also has a Next.js `server-only` import guard.

`article-catalog.mjs` fixes each allowed article's source ID, Sanity document ID,
slug and author reference. `articles.mjs` checks the server-issued principal
before network access. Its fixed public dataset query enforces those bindings,
article type, published perspective, publication date and draft/version
exclusion before content is returned. No CMS credential is provided. Returned
records are checked again, and only projected plain text is used; notes, images,
HTML and private records are never requested. Request text cannot supply a CMS
query, host, dataset, token, document ID or slug.

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

The Responses API `instructions` field contains the static application template,
the language selected from the validated locale enum and, for a recognized
concrete police call with authorized rights context, a fixed application-owned
contact-qualification instruction. Its
`<assistant_instructions>` wrapper separates scope/grounding and instruction
integrity rules. No reference prose or conversation text is interpolated into
that field; the optional block is selected by policy, not composed from user text.

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
The exact final escaped, serialized provider payload must fit the quota envelope
reserved before live article access; escaping expansion cannot bypass that budget.

These boundaries help distinguish instructions from data. They do not guarantee
that a model will resist semantic prompt injection or answer correctly. Server
authorization before readers, database admission, the allowed source-ID schema,
reply validation and React text rendering remain independently enforced. Tests
inspect outbound request structure with a mocked provider; live adversarial
model evaluation remains necessary before public activation. See the
[OpenAI prompt formatting guidance](https://developers.openai.com/api/docs/guides/prompt-engineering#message-formatting-with-markdown-and-xml).

Grounded provider output also contains internal evidence: one entry for each
selected source ID. Generation uses a nested `anyOf`: each branch pairs one
authorized source ID with a finite enum of that source's literal passages.
Choices are 20–300 characters, prefer sentence/word boundaries and overlap a
short final tail. They cover the complete excerpt without rewriting it; the
full original source also remains in the reference data. The model chooses a
passage rather than composing, merging or re-encoding a quote. There are at most
12 sources, 64 choices per source and 90,000 evidence-enum characters; unsuitable
or oversized sources fail closed rather than losing facts. The schema uses
required fields and closed objects within the documented
[Structured Outputs subset](https://developers.openai.com/api/docs/guides/structured-outputs).

The independent parser retains its 20–400-character quote boundary. After
normalizing text, it requires an exact substring of that selected source,
either literally or after interpreting one layer of the prompt's `&amp;`,
`&lt;` and `&gt;` transport entities. It does not decode arbitrary HTML entities,
recursively decode, fold whitespace or approximate punctuation; a decoded match
must still contain 20–400 characters. This is transport-format handling, not
HTML sanitization. The parser rejects unknown/repeated evidence IDs and requires
every selected ID to be represented. Missing, invented or mismatched evidence
fails before rendering. The full serialized schema, including all quote enums,
counts toward admission and the unchanged final 64K request ceiling; bounded
article headroom does not exempt the final request-size check.
The model is instructed to choose passages supporting every factual sentence,
including qualifications, and not a provenance label alone. The backend check
establishes quote provenance; it does **not** prove that the quote entails the
paraphrase, that all claims are supported or that the law is current. Evidence
and source lists stay internal and are not visitor-facing citations.

## Office information

Six entries cover the firm's identity, published contact information, requests
for appointments, published practice areas, nationwide coverage and a selected
FAQ summary about case duration and office follow-up channels. Localized
fields are selected explicitly from `messages/el.json`, `messages/en.json` and
`messages/de.json`. Canonical office URLs use
`https://ioannispapaioannou.lawyer/{locale}/…`.

The full FAQ and marketing copy are deliberately not ingested. Office FAQ facts
have priority only for office information, not over legal-source or privacy
boundaries. In particular,
the chatbot does not inherit the FAQ's 24-hour response promise or blanket
confidentiality statement. It has no booking calendar, matter-management access,
case-status access or authority to accept an engagement. Fees and free initial
consultations are not specified in the curated data.

## General information and selection

The reviewed catalog in `legal-catalog.mjs`, `legal-banking-sources.mjs` and
`legal-general-sources.mjs` includes official explanations of banking/debt tools,
enforcement, consumer disputes, property, inheritance, family, employment,
companies, tax, criminal rights, access to public documents and data protection.
Each entry fixes its exact source URL, review date, source type and multilingual
retrieval keywords. Excerpts are paraphrases, not complete copied webpages.

`legal-retrieval.mjs` checks the server-issued public principal and the independent
ID allowlist before ranking metadata or loading content. It selects at most four
whole legal excerpts within 10,000 UTF-8 bytes of serialized/escaped reference and
source-ID data. Greek accent/inflection and English/German vocabulary are covered
by explicit terms; topic diversity and matching original Gazette references are
preferred. Selection does not treat a matching keyword as evidence of an answer.
Unrelated or empty queries supply no legal excerpts, and missing material still
requires a handoff. The six office entries remain available.
Compound phrases tolerate bounded grammatical words, while complete authority
acronyms and the salary/tenancy senses of Greek `μισθ…` are distinguished to
avoid the observed unrelated tax/employment matches. Scoped aliases cover
ordinary company, consumer-product and personal-data wording; a bare company
or complaint word does not establish the corresponding topic.

`retrieval-query.mjs` computes one bounded query from the current question and
approved topic metadata matched against the validated user history. Generic
clarifications, role questions and dependent questions about process actors,
effects, partial access or language needs can preserve a recent topic. Partial
compound-keyword hints can use a prior user anchor only when approved topic
metadata is compatible; a hint alone does not supply legal facts. Explicit topic
changes replace the anchor, while discourse resets and unrelated substantive
turns block older anchors. It never uses assistant text as retrieval evidence. It retains the complete
latest question and at most 800 UTF-16 units of history within a 2,000-unit bound.
Conversation history is untrusted search data, not a source of legal facts or
authorization. Everyday aliases help locate reviewed summaries; a company name
can select general servicer information but cannot establish that company's status
or the validity of any specific letter.

The route computes its exact static reservation using that same query
and selection as the final context. Only after shared quota/monetary admission
does the existing bounded office-article reader run. The final serialized request
must still fit the reservation. Expanding the source catalog does not send the
entire legal library in every question, introduce a vector database or enable an
open-web/model-selected reader.

## Definition and coverage corrections

The [Ministry of Labour's employment page](https://ypergasias.gov.gr/ergasiakes-scheseis/atomikes-ergasiakes-sxeseis/symvasi-exartimenis-ergasias/)
separately describes personal paid work under lawful directions, supervision
and control, and the employer's duty to communicate essential terms. The card
now preserves that distinction. Recording or notifying terms is not supplied
as the definition, and the assistant does not classify an individual arrangement.

The [Labour Inspectorate's 2025 report](https://www.hli.gov.gr/wp-content/uploads/2026/03/ΕΤΗΣΙΑ-ΕΚΘΕΣΗ-ΑΥΤΟΤΕΛΟΥΣ-2025.pdf)
supplies the harassment card's dignity/environment elements. Its scope includes
work-related communications and travel, without equating every pressure or
disagreement with a legal finding. It remains dated guidance; no incident,
remedy, compensation or procedural time limit is determined.

The new `legal-inheritance-renunciation` card uses the
[Court of First Instance of Achaia's official guidance](https://www.protodikeio-achaias.gov.gr/apopoiisi-apodoxi-klironomias)
for the basic formal non-acceptance/declaration concept. Court-local appointment
and document instructions are excluded. It does not choose acceptance or
renunciation, decide inherited-debt liability or earlier acceptance, identify
the competent court for a visitor, or provide a time limit. Adding this card
does not make every inheritance question answerable.

The Katseli-law entry covers only the purpose of Law 3869/2010 and conditional
debt discharge. The common name was checked against the
[government's 2019 announcement](https://www.government.gov.gr/to-ipourgio-ikonomikon-energopii-tin-ilektroniki-platforma-gia-ta-iperchreomena-nikokiria/)
and the general subject against [AADE circular E.2041/2025](https://aade.gr/egkyklioi-kai-apofaseis/e-2041-08-07-2025).
These sources do not authorize this summary to decide present-day admission,
new applications, residence protection, payment terms or an individual case.

Five primary references use National Printing Office originals:

- [Ν. 3869/2010, ΦΕΚ Α΄ 130/03.08.2010](https://api.et.gr/apiLAW/1/2010/3869/pdf).
- [Ν. 4738/2020, ΦΕΚ Α΄ 207/27.10.2020](https://api.et.gr/apiLAW/1/2020/4738/pdf).
- [Ν. 5072/2023, ΦΕΚ Α΄ 198/04.12.2023](https://api.et.gr/apiLAW/1/2023/5072/pdf).
- [Ν. 4619/2019, ΦΕΚ Α΄ 95/11.06.2019](https://api.et.gr/apiLAW/1/2019/4619/pdf).
- [Ν. 4354/2015, ΦΕΚ Α΄ 176/16.12.2015](https://api.et.gr/apiFEK/1/2015/176/pdf).

These are initial gazette publications, not consolidated texts including later
amendments. They support the statute's identity and general subject. The prompt
prioritizes these primary references for those facts and distinguishes official
guidance from dated author commentary. An article's legal interpretation must
be attributed to its author; it cannot establish an independently verified
court ruling or current statutory effect.

## Published office articles

The registry contains the 13 public articles attributed to Ioannis Papaioannou
at review time. Greek source text can support answers in any of the three chat
languages. Canonical article links use `/el/blog/{registered-slug}`.
The server reads only the registered public article text, then selects relevant
bounded passages across each article rather than always taking its beginning.
At most two article excerpts enter one prompt, within the pre-reserved request
envelope and the exact final serialized-request size check. Lookup failure contributes no article context; it
does not enable answers from model memory. The model receives dated excerpts
labelled as office commentary, never a claim that all current law was searched.

The dialogue displays a permanent notice stating that ΔικAIsis's answers are general
information and do not constitute legal advice. Source checks remain internal;
the visitor interface does not show a source list.

Sources include the Ministry of Economy and Finance, Bank of Greece and its
Central Credit Register, European Commission/e-Justice, Mitos, Ministry of
Justice, Ministry of Labour, Hellenic Labour Inspectorate, Hellenic Cadastre,
AADE, GEMI, Consumer Ombudsman, Hellenic Data Protection Authority and the
Court of First Instance of Achaia. Dated
procedural pages support stable definitions only; old court names, implementation
dates, monetary thresholds and procedural deadlines are not imported as current
law. A consultation draft is not treated as enacted legislation.

No entry calculates personal statutory deadlines, monetary eligibility tests,
specific remedies, predictions or guarantees. The assistant does not ask about
instalments or documents served, collect case details or propose repayment
plans. It provides basic explanations and office contact. Questions beyond these limited
explanations need clarification or referral to the office. A user mentioning
served documents or a pending auction should be directed promptly to the firm
without computing a deadline in chat. Different languages do not change the
jurisdiction to a different country.

A citation does not authorize a procedural deadline: the response policy also
blocks repeating numeric, spelled-out or dated limits from an office article,
including attributed or historical quotations with caveats. Recognized deadline
questions receive application-owned manual-contact wording before a model call;
a separate bounded lexical check replaces matching provider prose in full after
schema/source validation. These checks are conservative safeguards, not exhaustive
semantic verification. See the behavior document for their limits.

See [assistant behavior](chatbot-behavior.md) for the ΔικAIsis persona,
basic information-only flow and the boundaries around
court decisions and case studies.

## Maintaining the snapshot

Review the excerpts with a lawyer before enabling public AI answers and whenever
the underlying subject or an office detail changes. Verify each source, update
the wording and record the new review date. Avoid importing complete webpages:
they may include outdated rules, unrelated material or unsupported promises.
Keep user case facts, uploaded documents and conversation logs out of this file.
New source IDs must be explicitly approved in the access policy as well as the
catalog. A new office article additionally needs an exact document/slug/author
registry binding; publishing/editing CMS data alone does not expand access. The public
classifications are trusted, reviewed application configuration; the policy is
not a classifier that can discover confidential prose mislabeled as public by a
developer.

Updating a source requires reviewing the underlying body and its date, preserving
the distinction between an original Gazette, official guidance and author
commentary, and running the retrieval/source tests. Updating only `reviewedAt`
does not refresh or verify the legal substance. No scheduled legal update or
runtime guarantee of current law is configured.
