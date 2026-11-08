import { createHash, randomBytes } from "node:crypto";

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
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new Error("invalid_request");
  }
  const limit = 64 * 1024;
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > limit)) {
    throw new Error("request_too_large");
  }
  if (!request.body) throw new Error("invalid_request");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("request_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("invalid_request");
  }
}

// Best-effort per-instance protection. Configure a shared Vercel Firewall rate
// limit before enabling a paid public endpoint; serverless instances don't share memory.
export function createChatLimiter(limit = 10, windowMs = 5 * 60 * 1000, maxKeys = 2000) {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return (key: string, now = Date.now()): number => {
    for (const [id, window] of windows) {
      if (window.resetAt <= now) windows.delete(id);
    }
    const existing = windows.get(key);
    if (existing) {
      if (existing.count >= limit) return Math.ceil((existing.resetAt - now) / 1000);
      existing.count += 1;
      return 0;
    }
    // Fail closed at capacity rather than let churn evict active rate limits.
    if (windows.size >= maxKeys) return Math.ceil(windowMs / 1000);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  };
}

const salt = randomBytes(32);
const perVisitor = createChatLimiter();
const perInstance = createChatLimiter(120, 60 * 60 * 1000, 1);

export function chatRetryAfter(request: Request): number {
  // Only trust the platform-owned forwarding header on Vercel. Other hosts use
  // a shared bucket rather than accepting an attacker-supplied forwarded IP.
  const address = process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "local";
  const key = createHash("sha256").update(salt).update(address).digest("hex");
  const visitorDelay = perVisitor(key);
  return visitorDelay || perInstance("all");
}
