/** Classify local submission failures without treating deliberate cancellation
 * as a failed security check. No retry or token operation is performed here.
 * @param {{current: boolean, aborted: boolean, requestSent: boolean, verificationEnabled: boolean, error: unknown}} state
 * @returns {"stale" | "cancelled" | "verification" | "upstream"}
 */
export function classifyChatSubmissionFailure(state) {
  if (!state.current) return "stale";
  // Only the owning controller proves deliberate cancellation. An AbortError
  // from widget cleanup can otherwise be an unexpected verification failure.
  if (state.aborted) return "cancelled";
  return state.verificationEnabled && !state.requestSent ? "verification" : "upstream";
}

/** Preserve a more specific existing failure while making a ready/loading
 * widget's rejected verification visible to the visitor.
 * @param {string} status
 * @returns {"failed" | "expired" | "unavailable"}
 */
export function failedChatVerificationStatus(status) {
  return status === "expired" || status === "unavailable" ? status : "failed";
}
