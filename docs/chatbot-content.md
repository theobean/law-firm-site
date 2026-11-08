# Chatbot content scope

`src/lib/chat/knowledge.ts` supplies a small, curated snapshot to the assistant.
Sources were inspected on **8 November 2026**. The assistant does not browse the
web at runtime, and a citation is not evidence of real-time legal verification.

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
