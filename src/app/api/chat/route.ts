import { ChatFailure, generatePreparedChatReply, parseChatInput, prepareChatModelRequest } from "@/lib/chat/service";
import { getPublicChatContext } from "@/lib/chat/knowledge";
import { ChatAccessError, getPublicChatPrincipal } from "@/lib/chat/access.mjs";
import { isSameOrigin, readChatBody } from "@/lib/chat/security";
import { QuotaIdentityError, resolveQuotaIdentity } from "@/lib/chat/identity.mjs";
import { QuotaError, reserveChatQuota } from "@/lib/chat/quota.mjs";
import { createChatHandler } from "@/lib/chat/handler.mjs";

export const runtime = "nodejs";
export const maxDuration = 40;

export const POST = createChatHandler({
  env: process.env,
  isSameOrigin,
  readChatBody,
  parseChatInput,
  resolveQuotaIdentity,
  getPublicChatPrincipal,
  getPublicChatContext,
  prepareChatModelRequest,
  reserveChatQuota,
  generatePreparedChatReply,
  classifyKnownError(error: unknown) {
    // Never log or return prompts, provider bodies, keys or internal details.
    if (error instanceof ChatAccessError) return { code: "forbidden", status: 403 };
    if (error instanceof QuotaIdentityError) return { code: error.code, status: error.status };
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
