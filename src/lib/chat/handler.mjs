/** @typedef {import("./service").ChatInput} ChatInput */
/** @typedef {import("./service").ChatReply} ChatReply */
/** @typedef {import("./service").PreparedChatModelRequest} PreparedChatModelRequest */
/** @typedef {import("./access.mjs").AuthorizedChatContext} AuthorizedChatContext */
/** @typedef {import("./identity.mjs").QuotaIdentity} QuotaIdentity */
/** @typedef {{code: string, status: number, retryAfter?: number}} KnownChatError */
/** @typedef {{
 * env: Record<string, string | undefined>,
 * isSameOrigin: (request: Request) => boolean,
 * readChatBody: (request: Request) => Promise<unknown>,
 * parseChatInput: (value: unknown) => ChatInput,
 * getChatVisitor: (request: Request, rawBody: unknown) => Promise<{visitor: unknown, cookieHeader?: string}>,
 * resolveQuotaIdentity: (request: Request, visitor?: unknown) => Promise<QuotaIdentity>,
 * getPublicChatPrincipal: () => unknown,
 * getChatQuotaReservation: (input: ChatInput, principal: unknown, model?: string) => number,
 * getChatBudgetReservation: (reservedTokens: number, model?: string) => Promise<number>,
 * getPublicChatContext: (principal: unknown, locale: ChatInput["locale"], question: string) => AuthorizedChatContext | Promise<AuthorizedChatContext>,
 * prepareChatModelRequest: (input: ChatInput, context: AuthorizedChatContext, model?: string) => PreparedChatModelRequest,
 * reserveChatQuota: (identity: QuotaIdentity, reservedTokens: number, reservedCostEurMicros: number) => Promise<{release: () => Promise<void>}>,
 * generatePreparedChatReply: (prepared: PreparedChatModelRequest, options: {apiKey: string, signal: AbortSignal}) => Promise<ChatReply>,
 * classifyKnownError: (error: unknown) => KnownChatError | null,
 * }} ChatHandlerDependencies */

/** @param {string} error @param {number} status @param {number} [retryAfter] @param {string} [cookieHeader] */
function failure(error, status, retryAfter, cookieHeader) {
  return Response.json({ error }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
      ...(cookieHeader ? { "Set-Cookie": cookieHeader } : {}),
    },
  });
}

/** Server dependencies are bound by the route module, never supplied by a
 * request. Keeping this flow separate permits admission tests in-process,
 * without a server, provider credentials or external network calls.
 * @param {ChatHandlerDependencies} dependencies
 * @returns {(request: Request) => Promise<Response>}
 */
export function createChatHandler(dependencies) {
  return async function handleChat(request) {
    if (!dependencies.isSameOrigin(request)) return failure("forbidden", 403);
    if (dependencies.env.CHATBOT_ENABLED !== "true") return failure("unavailable", 503);
    let cookieHeader;
    try {
      const rawBody = await dependencies.readChatBody(request);
      const input = dependencies.parseChatInput(rawBody);
      const apiKey = dependencies.env.OPENAI_API_KEY?.trim();
      if (!apiKey) return failure("unavailable", 503);
      // The gateway verifies every submitted token before resolving identity or
      // touching shared quotas. Only its server-owned proof reaches identity.
      const visitorResult = await dependencies.getChatVisitor(request, rawBody);
      cookieHeader = visitorResult.cookieHeader;
      const identity = await dependencies.resolveQuotaIdentity(request, visitorResult.visitor);

      // Quota identity cannot change the public context permission.
      const principal = dependencies.getPublicChatPrincipal();
      const model = dependencies.env.OPENAI_CHAT_MODEL?.trim();
      const reservedTokens = dependencies.getChatQuotaReservation(input, principal, model);
      if (!Number.isInteger(reservedTokens) || reservedTokens < 1 || reservedTokens > 64000) {
        throw new Error("Invalid chat quota reservation");
      }
      const reservedCostEurMicros = await dependencies.getChatBudgetReservation(reservedTokens, model);
      if (!Number.isSafeInteger(reservedCostEurMicros) || reservedCostEurMicros < 1) {
        throw new Error("Invalid chat budget reservation");
      }
      // Shared admission bounds both context retrieval and the provider request.
      const lease = await dependencies.reserveChatQuota(identity, reservedTokens, reservedCostEurMicros);
      try {
        const context = await dependencies.getPublicChatContext(principal, input.locale, input.messages[input.messages.length - 1].content);
        const prepared = dependencies.prepareChatModelRequest(input, context, model);
        if (prepared.reservedTokens > reservedTokens) return failure("request_too_large", 413, undefined, cookieHeader);
        const reply = await dependencies.generatePreparedChatReply(prepared, { apiKey, signal: request.signal });
        return Response.json(reply, { headers: { "Cache-Control": "no-store", ...(cookieHeader ? { "Set-Cookie": cookieHeader } : {}) } });
      } finally {
        // Release concurrency only; the store does not refund abuse budgets.
        // Cleanup failure cannot replace a successful answer or provider error.
        try { await lease.release(); } catch { /* Lease expires in the shared database. */ }
      }
    } catch (error) {
      // Classification returns only stable public codes, never upstream detail.
      const known = dependencies.classifyKnownError(error);
      return known ? failure(known.code, known.status, known.retryAfter, cookieHeader) : failure("upstream", 502, undefined, cookieHeader);
    }
  };
}
