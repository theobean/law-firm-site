import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyChatSubmissionFailure, failedChatVerificationStatus } from "../src/lib/chat/verification-feedback.mjs";

const current = (extra = {}) => ({ current: true, aborted: false, requestSent: false, verificationEnabled: true,
  error: new Error("Security check unavailable"), ...extra });

test("an early verification rejection gets visible failure feedback even when the hook was ready", () => {
  for (const error of [new Error("Security check unavailable"), new Error("Security check already pending"), "Unexpected check failure", undefined]) {
    const feedback = classifyChatSubmissionFailure(current({ error }));
    assert.equal(feedback, "verification");
    assert.equal(failedChatVerificationStatus("ready"), "failed");
  }
});

test("intentional cancellation and stale controllers never request verification or request-error feedback", () => {
  for (const requestSent of [false, true]) {
    assert.equal(classifyChatSubmissionFailure(current({ requestSent, aborted: true })), "cancelled");
    assert.equal(classifyChatSubmissionFailure(current({ requestSent, aborted: true, error: new DOMException("Cancelled", "AbortError") })), "cancelled");
    assert.equal(classifyChatSubmissionFailure(current({ requestSent, current: false })), "stale");
    assert.equal(classifyChatSubmissionFailure(current({ requestSent, current: false, aborted: true })), "stale");
  }
});

test("an unexpected widget AbortError is visible while its owning request is still current and active", () => {
  for (const error of [new DOMException("Widget removed", "AbortError"), { name: "AbortError" }]) {
    assert.equal(classifyChatSubmissionFailure(current({ error })), "verification");
    assert.equal(classifyChatSubmissionFailure(current({ error, requestSent: true })), "upstream");
    assert.equal(classifyChatSubmissionFailure(current({ error, current: false })), "stale");
    assert.equal(classifyChatSubmissionFailure(current({ error, aborted: true })), "cancelled");
  }
});

test("a sent request or disabled verification uses the existing request error instead of a security failure", () => {
  assert.equal(classifyChatSubmissionFailure(current({ requestSent: true })), "upstream");
  assert.equal(classifyChatSubmissionFailure(current({ verificationEnabled: false })), "upstream");
  assert.equal(classifyChatSubmissionFailure(current({ requestSent: true, verificationEnabled: false })), "upstream");
  assert.equal(classifyChatSubmissionFailure(current({ error: { name: "NetworkError" } })), "verification");
});

test("feedback preserves existing expiry and unavailable reasons while failed checks cannot remain ready", () => {
  assert.equal(failedChatVerificationStatus("expired"), "expired");
  assert.equal(failedChatVerificationStatus("unavailable"), "unavailable");
  for (const status of ["idle", "loading", "ready", "checking", "interactive", "failed"]) {
    assert.equal(failedChatVerificationStatus(status), "failed");
  }
});
