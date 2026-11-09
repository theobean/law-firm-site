import { parseChatSourceLink, prepareChatText } from "./protocol.mjs";
import { APPROVED_OFFICE_ARTICLES } from "./article-catalog.mjs";

/** @typedef {Readonly<{id: string, title: string, url: string, content: string}>} AuthorizedChatSource */
/** @typedef {Readonly<{kind: "public-chat-context"}>} AuthorizedChatContext */

// No authenticated/private chat integration exists. The public endpoint has
// exactly this server-issued principal, regardless of request headers or JSON.
const PUBLIC_PRINCIPAL = Object.freeze({
  role: "public",
  permissions: Object.freeze(["chat:read:public"]),
});

// Explicit approval is required when adding a source; marking an arbitrary
// record "public" alone cannot expand the model's context.
const APPROVED_PUBLIC_SOURCE_IDS = new Set([
  "office-identity", "office-contact", "office-appointments", "office-services", "office-nationwide",
  "legal-katseli-law", "legal-debt-settlement", "legal-banking-code", "legal-credit-servicers", "legal-payment-order",
  "legal-mediation", "legal-labor-disputes", "legal-land-registry", "legal-inheritance-tax",
  "legislation-3869-2010", "legislation-4738-2020",
  "legislation-5072-2023", "legislation-4619-2019", "legal-enforcement-concepts",
  "legal-bilateral-settlement", "legal-banking-code-process", "legal-bank-transparency",
  "legal-credit-report", "legal-bank-complaints", "legal-debt-certificate", "legal-early-warning",
  "legal-debt-support", "legal-consumer-complaints",
  "legal-consensual-divorce", "legal-company-formation", "legal-rental-declarations",
  "legal-property-transfer", "legal-cadastral-corrections", "legal-consumer-ombudsman",
  "legal-tax-administrative-appeal", "legal-criminal-defence-rights", "legal-legal-aid",
  "legal-data-access", "legal-public-documents", "legal-cross-border-inheritance",
  "legal-employment-terms", "legal-workplace-harassment", "legal-electronic-auctions",
  ...APPROVED_OFFICE_ARTICLES.map(({ sourceId }) => sourceId),
]);

/** Metadata membership only. Callers must still verify the public principal
 * before selecting content; catalog membership alone never grants access.
 * @param {unknown} id
 * @returns {boolean}
 */
export function isApprovedPublicChatSourceId(id) {
  return typeof id === "string" && APPROVED_PUBLIC_SOURCE_IDS.has(id);
}

/** @type {WeakMap<object, readonly AuthorizedChatSource[]>} */
const authorizedContexts = new WeakMap();

export class ChatAccessError extends Error {
  code = "forbidden";
  status = 403;
  constructor() {
    super("forbidden");
    this.name = "ChatAccessError";
  }
}

export function getPublicChatPrincipal() {
  return PUBLIC_PRINCIPAL;
}

/** @param {unknown} principal @param {unknown} scope */
export function assertPublicChatAccess(principal, scope) {
  if (principal !== PUBLIC_PRINCIPAL || scope !== "public") throw new ChatAccessError();
}

/**
 * Authorize metadata BEFORE calling any data reader. This public catalog is not
 * a database adapter; private database access would need verified identity and
 * query/row-level permissions before any fetch, in a separate integration.
 * @param {unknown} principal
 * @param {unknown} scope
 * @param {unknown} descriptors
 * @returns {AuthorizedChatContext}
 */
export function createAuthorizedChatContext(principal, scope, descriptors) {
  assertPublicChatAccess(principal, scope);
  if (!Array.isArray(descriptors)) throw new ChatAccessError();
  const eligible = descriptors.filter((descriptor) =>
    descriptor && typeof descriptor === "object" &&
    typeof descriptor.id === "string" && APPROVED_PUBLIC_SOURCE_IDS.has(descriptor.id) &&
    descriptor.visibility === "public" && descriptor.publication === "published",
  );
  if (!eligible.length || new Set(eligible.map(({ id }) => id)).size !== eligible.length ||
      eligible.some((descriptor) => typeof descriptor.load !== "function")) throw new ChatAccessError();

  const records = eligible.map((descriptor) => {
    const record = descriptor.load();
    if (!record || typeof record !== "object" || record.id !== descriptor.id ||
        record.visibility !== "public" || record.publication !== "published") throw new ChatAccessError();
    const link = parseChatSourceLink(record);
    const content = prepareChatText(record.content, 6000);
    if (!link || !content) throw new ChatAccessError();
    // Field-level projection: internal notes, identifiers, access metadata and
    // any future extra fields are excluded before the provider receives data.
    return Object.freeze({ id: descriptor.id, title: link.title, url: link.url, content });
  });
  /** @type {AuthorizedChatContext} */
  const context = Object.freeze({ kind: "public-chat-context" });
  authorizedContexts.set(context, Object.freeze(records));
  return context;
}

/** Runtime identity check: JSON, cloned objects and raw source arrays cannot
 * impersonate the context authorized by this server process.
 * @param {unknown} context
 * @returns {readonly AuthorizedChatSource[]}
 */
export function readAuthorizedChatSources(context) {
  const sources = context && typeof context === "object" ? authorizedContexts.get(context) : undefined;
  if (!sources) throw new ChatAccessError();
  return sources;
}
