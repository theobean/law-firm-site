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
 * resolveQuotaIdentity: (request: Request) => Promise<QuotaIdentity>,
 * getPublicChatPrincipal: () => unknown,
 * getPublicChatContext: (principal: unknown, locale: ChatInput["locale"]) => AuthorizedChatContext,
 * prepareChatModelRequest: (input: ChatInput, context: AuthorizedChatContext, model?: string) => PreparedChatModelRequest,
 * reserveChatQuota: (identity: QuotaIdentity, reservedTokens: number) => Promise<{release: () => Promise<void>}>,
 * generatePreparedChatReply: (prepared: PreparedChatModelRequest, options: {apiKey: string, signal: AbortSignal}) => Promise<ChatReply>,
 * classifyKnownError: (error: unknown) => KnownChatError | null,
 * }} ChatHandlerDependencies */

/** @param {string} error @param {number} status @param {number} [retryAfter] */
function failure(error, status, retryAfter) {
  return Response.json({ error }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
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
    try {
      const input = dependencies.parseChatInput(await dependencies.readChatBody(request));
      const apiKey = dependencies.env.OPENAI_API_KEY?.trim();
      if (!apiKey) return failure("unavailable", 503);
      const identity = await dependencies.resolveQuotaIdentity(request);

      // Quota identity cannot change the public context permission.
      const principal = dependencies.getPublicChatPrincipal();
      const context = dependencies.getPublicChatContext(principal, input.locale);
      const prepared = dependencies.prepareChatModelRequest(input, context, dependencies.env.OPENAI_CHAT_MODEL?.trim());
      // Atomic shared admission must authorize this exact snapshot and cost.
      const lease = await dependencies.reserveChatQuota(identity, prepared.reservedTokens);
      try {
        const reply = await dependencies.generatePreparedChatReply(prepared, { apiKey, signal: request.signal });
        return Response.json(reply, { headers: { "Cache-Control": "no-store" } });
      } finally {
        // Release concurrency only; the store does not refund abuse budgets.
        // Cleanup failure cannot replace a successful answer or provider error.
        try { await lease.release(); } catch { /* Lease expires in shared Redis. */ }
      }
    } catch (error) {
      // Classification returns only stable public codes, never upstream detail.
      const known = dependencies.classifyKnownError(error);
      return known ? failure(known.code, known.status, known.retryAfter) : failure("upstream", 502);
    }
  };
}
