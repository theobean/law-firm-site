import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { createVisitorCookie, readVerifiedVisitor, readVisitorCookie, VISITOR_COOKIE_NAME, VISITOR_MAX_AGE_SECONDS, VisitorCookieError } from "../src/lib/chat/visitor.mjs";

const now = 1794182400000;
const env = { CHAT_TURNSTILE_ENABLED: "true", CHAT_RATE_LIMIT_SECRET: "test-only-shared-hmac-secret-at-least-32-characters" };
const request = (cookie) => new Request("https://site.example/api/chat", { headers: cookie === undefined ? {} : { cookie } });
const cookiePair = (header) => header.split(";", 1)[0];

test("anonymous cookie uses a random signed ID and host-only persistent security attributes", () => {
  const first = createVisitorCookie({ env, now });
  const second = createVisitorCookie({ env, now });
  assert.match(first.header, /^__Host-lexi-visitor=v1\.[A-Za-z0-9_-]{43}\.\d+\.[A-Za-z0-9_-]{43}; Secure; HttpOnly; SameSite=Lax; Path=\/; Max-Age=86400$/);
  assert.ok(!first.header.toLowerCase().includes("domain="));
  assert.notEqual(first.header, second.header);
  assert.equal(VISITOR_MAX_AGE_SECONDS, 86400);
  assert.equal(VISITOR_COOKIE_NAME, "__Host-lexi-visitor");
  assert.ok(Object.isFrozen(first.visitor));
  assert.deepEqual(first.visitor, { kind: "anonymous-chat-visitor" });
  assert.equal(JSON.stringify(first.visitor).includes(first.header.split(".")[1]), false);
  const reloaded = readVisitorCookie(request(`other=present; ${cookiePair(first.header)}`), { env, now: now + 1000 });
  assert.ok(reloaded);
  assert.notEqual(reloaded, first.visitor);
  assert.equal(readVerifiedVisitor(reloaded, { env, now: now + 1000 }), readVerifiedVisitor(first.visitor, { env, now }));
});

test("persisted cookies retain identity until their original 24-hour expiry and never slide", () => {
  const { header, visitor } = createVisitorCookie({ env, now });
  const browserProfileCookie = cookiePair(header);
  const nextDay = now + VISITOR_MAX_AGE_SECONDS * 1000;
  assert.ok(readVisitorCookie(request(browserProfileCookie), { env, now: nextDay - 1 }));
  assert.equal(readVisitorCookie(request(browserProfileCookie), { env, now: nextDay }), null);
  assert.equal(readVerifiedVisitor(visitor, { env, now: nextDay }), null);
  assert.equal(readVisitorCookie(request(browserProfileCookie), { env, now: now - 1000 }), null, "a future-extended expiry is not valid");
});

test("changed IDs, signatures, versions and expiry values require a fresh challenge", () => {
  const { header } = createVisitorCookie({ env, now });
  const pair = cookiePair(header);
  const [version, nonce, expires, signature] = pair.slice(VISITOR_COOKIE_NAME.length + 1).split(".");
  const changed = (value) => `${VISITOR_COOKIE_NAME}=${value}`;
  const invalid = [
    changed(`v2.${nonce}.${expires}.${signature}`),
    changed(`${version}.${nonce.replace(/^./, nonce[0] === "A" ? "B" : "A")}.${expires}.${signature}`),
    changed(`${version}.${nonce}.${Number(expires) + 1}.${signature}`),
    changed(`${version}.${nonce}.${expires}.${signature.replace(/^./, signature[0] === "A" ? "B" : "A")}`),
    changed(`${version}.${nonce}.0${expires}.${signature}`),
    changed(`${version}.${nonce}.${expires}.${signature}=`),
    changed(encodeURIComponent(`${version}.${nonce}.${expires}.${signature}`) + "%00"),
    `${pair}; ${pair}`,
    `${pair}; ${VISITOR_COOKIE_NAME}=`,
    `${VISITOR_COOKIE_NAME}=; ${pair}`,
    `${pair}; extra=${"a".repeat(16384)}`,
  ];
  for (const cookie of invalid) assert.equal(readVisitorCookie(request(cookie), { env, now }), null);
  assert.equal(readVisitorCookie(request(pair), { env: { ...env, CHAT_RATE_LIMIT_SECRET: "different-test-only-secret-at-least-32-characters" }, now }), null);
  assert.equal(readVisitorCookie(request(), { env, now }), null);
  assert.equal(readVisitorCookie(request("another-cookie=hello"), { env, now }), null);
});

test("even a correctly signed future-extended expiry is rejected", () => {
  const { header } = createVisitorCookie({ env, now });
  const [, nonce] = cookiePair(header).slice(VISITOR_COOKIE_NAME.length + 1).split(".");
  const expires = now / 1000 + VISITOR_MAX_AGE_SECONDS + 1;
  const signature = createHmac("sha256", env.CHAT_RATE_LIMIT_SECRET)
    .update(JSON.stringify(["lexi-anonymous-visitor-cookie-v1", nonce, expires])).digest("base64url");
  assert.equal(readVisitorCookie(request(`${VISITOR_COOKIE_NAME}=v1.${nonce}.${expires}.${signature}`), { env, now }), null);
});

test("JSON, clones and proof from a different secret cannot select a visitor identity", () => {
  const { visitor } = createVisitorCookie({ env, now });
  for (const forged of [undefined, null, "visitor", {}, { ...visitor }, JSON.parse(JSON.stringify(visitor)), Object.create(visitor)]) {
    assert.equal(readVerifiedVisitor(forged, { env, now }), null);
  }
  assert.equal(readVerifiedVisitor(visitor, { env: { ...env, CHAT_RATE_LIMIT_SECRET: "different-test-only-secret-at-least-32-characters" }, now }), null);
});

test("feature must be explicitly enabled and signing configuration must be valid", () => {
  for (const enabled of [undefined, "false", "1", "TRUE"]) {
    const disabledEnv = { ...env, CHAT_TURNSTILE_ENABLED: enabled };
    assert.equal(readVisitorCookie(request(), { env: disabledEnv, now }), null);
    assert.throws(() => createVisitorCookie({ env: disabledEnv, now }), VisitorCookieError);
  }
  for (const secret of [undefined, "short", ` ${env.CHAT_RATE_LIMIT_SECRET}`, "x".repeat(1025)]) {
    const badEnv = { ...env, CHAT_RATE_LIMIT_SECRET: secret };
    assert.throws(() => createVisitorCookie({ env: badEnv, now }), VisitorCookieError);
    assert.throws(() => readVisitorCookie(request(), { env: badEnv, now }), VisitorCookieError);
  }
  for (const invalidNow of [-1, NaN, Infinity, 1.5]) assert.throws(() => createVisitorCookie({ env, now: invalidNow }), VisitorCookieError);
});
