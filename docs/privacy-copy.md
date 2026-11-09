# Reader-facing privacy notice

The public privacy page uses six short sections: controller, contact/newsletter,
ΔικAIsis, cookies/external services, retention, and rights. Recipient names and the
meaningful choices remain visible. Optional provider/reference links are in a
native disclosure below the notice.

Cookie flags/signing, token expiry, SQL/storage design, concurrency leases,
quota algorithms and pruning implementation belong in `chatbot-security.md`
and `chatbot-quotas.md`; they are not needed to explain the visitor's choices.
The notice still distinguishes the 24-hour cookie from security records that
can last longer, and local conversation memory from OpenAI provider retention.

The copy describes the observed deployment, without inventing approved legal
bases, provider contracts, international-transfer safeguards, storage regions
or a guarantee of GDPR compliance. The controller's legal review before public
activation still needs to settle those points and any required additional
information. Shortening this draft does not establish that the notice covers
every Article 13 obligation.

Google Analytics cookies initially load after acceptance. Vercel Analytics is
mounted separately. The existing preference handler does not stop a previously
loaded Google Analytics script immediately; the notice therefore explains that
a reload may be needed for already loaded services. Embedded external content
also includes YouTube/Facebook videos, in addition to Google Maps.

The wording follows the plain-language approach in
[GDPR Article 12](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) and
[EDPB guidance](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en).
