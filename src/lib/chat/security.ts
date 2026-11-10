import { readBoundedJson } from "./protocol.mjs";

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readChatBody(request: Request): Promise<unknown> {
  return readBoundedJson(request);
}
