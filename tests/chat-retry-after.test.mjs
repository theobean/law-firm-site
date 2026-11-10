import assert from "node:assert/strict";
import { test } from "node:test";
import { chatRetryDeadline, isChatCoolingDown } from "../src/lib/chat/retry-after.mjs";

test("chat cooldown uses the actual numeric Retry-After and releases exactly at its deadline", () => {
  const now = Date.UTC(2026, 10, 9, 16);
  const deadline = chatRetryDeadline("61", now);
  assert.equal(deadline, now + 61000);
  assert.equal(isChatCoolingDown(deadline, now), true);
  assert.equal(isChatCoolingDown(deadline, deadline - 1), true);
  assert.equal(isChatCoolingDown(deadline, deadline), false);
  assert.equal(isChatCoolingDown(deadline, deadline + 1), false);
  assert.equal(chatRetryDeadline("86400", now), now + 86400000);
});

test("missing, malformed, overflow and unbounded retry guidance never invent a waiting time", () => {
  for (const header of [null, undefined, "", "0", "-1", "1.5", " 60", "60 ", "1e3", "01", "Infinity", "86401", "99999999999999999", "Wed, 10 Nov 2026 00:00:00 GMT", "<script>", 60]) {
    assert.equal(chatRetryDeadline(header, 1000), null, String(header));
  }
  for (const now of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER]) {
    assert.equal(chatRetryDeadline("60", now), null);
  }
  assert.equal(isChatCoolingDown(null, 1000), false);
  assert.equal(isChatCoolingDown(Infinity, 1000), false);
});
