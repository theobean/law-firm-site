import { ChatFailure, generatePreparedChatReply, MAX_CHAT_RESERVED_TOKENS, parseChatInput, prepareChatModelRequest } from "@/lib/chat/service";
import { getPublicChatContext, getStaticPublicChatContext } from "@/lib/chat/knowledge";
import { ChatAccessError, getPublicChatPrincipal } from "@/lib/chat/access.mjs";
import { isSameOrigin, readChatBody } from "@/lib/chat/security";
import { QuotaIdentityError, resolveQuotaIdentity } from "@/lib/chat/identity.mjs";
import { QuotaError, reserveChatQuota } from "@/lib/chat/quota.mjs";
import { createChatHandler } from "@/lib/chat/handler.mjs";
import { createVisitorCookie, readVisitorCookie, VisitorCookieError } from "@/lib/chat/visitor.mjs";
import { TurnstileError, verifyTurnstileToken } from "@/lib/chat/turnstile.mjs";
import { MonetaryBudgetError, reserveCostEurMicros } from "@/lib/chat/money.mjs";

export const runtime = "nodejs";
// Includes bounded Turnstile/ECB checks, quota admission, public-article lookup,
// the 30s provider deadline and lease cleanup, with Neon Free wake-up headroom.
export const maxDuration = 60;

export const POST = createChatHandler({
  env: process.env,
  isSameOrigin,
  readChatBody,
  parseChatInput,
  async getChatVisitor(request, rawBody) {
    if (process.env.NEXT_PUBLIC_CHAT_TURNSTILE_ENABLED === "true" && process.env.CHAT_TURNSTILE_ENABLED !== "true") throw new TurnstileError("unavailable");
    if (process.env.CHAT_TURNSTILE_ENABLED !== "true") return { visitor: null };
    const token = rawBody && typeof rawBody === "object" && "turnstileToken" in rawBody ? rawBody.turnstileToken : undefined;
    await verifyTurnstileToken(token, { env: process.env });
    const visitor = readVisitorCookie(request, { env: process.env });
    if (visitor) return { visitor };
    const created = createVisitorCookie({ env: process.env });
    return { visitor: created.visitor, cookieHeader: created.header };
  },
  resolveQuotaIdentity: (request, visitor) => resolveQuotaIdentity(request, { visitor }),
  getPublicChatPrincipal,
  getChatQuotaReservation(input, principal, model) {
    // Reserve once, before live CMS access, using the exact static request plus
    // bounded article headroom. The final serialized request must fit this
    // reservation or fail with 413 before any model request. No refunds/retries.
    const baseline = prepareChatModelRequest(input, getStaticPublicChatContext(principal, input.locale), model);
    return Math.min(MAX_CHAT_RESERVED_TOKENS, baseline.reservedTokens + 12000);
  },
  getPublicChatContext,
  getChatBudgetReservation: (tokens, model) => reserveCostEurMicros(tokens, model),
  prepareChatModelRequest,
  reserveChatQuota: (identity, tokens, cost) => reserveChatQuota(identity, tokens, { reservedCostEurMicros: cost }),
  generatePreparedChatReply,
  classifyKnownError(error: unknown) {
    // Never log or return prompts, provider bodies, keys or internal details.
    if (error instanceof ChatAccessError) return { code: "forbidden", status: 403 };
    if (error instanceof QuotaIdentityError) return { code: error.code, status: error.status };
    if (error instanceof TurnstileError || error instanceof VisitorCookieError || error instanceof MonetaryBudgetError) return { code: error.code, status: error.status };
    if (error instanceof QuotaError) return { code: error.code, status: error.status, retryAfter: error.retryAfter };
    if (error instanceof ChatFailure) return { code: error.code, status: error.status };
    if (error instanceof Error && error.message === "request_too_large") {
      return { code: "request_too_large", status: 413 };
    }
    if (error instanceof Error && error.message === "invalid_request") {
      return { code: "invalid_request", status: 400 };
    }
    return null;
  },
});
