import { ChatFailure, generateChatReply, parseChatInput } from "@/lib/chat/service";
import { getPublicChatContext } from "@/lib/chat/knowledge";
import { ChatAccessError, getPublicChatPrincipal } from "@/lib/chat/access.mjs";
import { chatRetryAfter, isSameOrigin, readChatBody } from "@/lib/chat/security";

export const runtime = "nodejs";
export const maxDuration = 40;

function failure(error: string, status: number, retryAfter?: number) {
  return Response.json({ error }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return failure("forbidden", 403);
  if (process.env.CHATBOT_ENABLED !== "true") return failure("unavailable", 503);
  try {
    const input = parseChatInput(await readChatBody(request));
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return failure("unavailable", 503);
    const retryAfter = chatRetryAfter(request);
    if (retryAfter) return failure("rate_limit", 429, retryAfter);

    // Public visitor permissions come only from server policy, never the body,
    // headers, conversation roles or instructions supplied to the model.
    const principal = getPublicChatPrincipal();
    const context = getPublicChatContext(principal, input.locale);
    const reply = await generateChatReply(input, context, {
      apiKey,
      model: process.env.OPENAI_CHAT_MODEL?.trim(),
      signal: request.signal,
    });
    return Response.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Deliberately do not log prompts, conversations, provider bodies, or keys.
    if (error instanceof ChatAccessError) return failure("forbidden", 403);
    if (error instanceof ChatFailure) return failure(error.code, error.status);
    if (error instanceof Error && error.message === "request_too_large") {
      return failure("request_too_large", 413);
    }
    if (error instanceof Error && error.message === "invalid_request") {
      return failure("invalid_request", 400);
    }
    return failure("upstream", 502);
  }
}
