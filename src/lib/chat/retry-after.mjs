const MAX_RETRY_SECONDS = 86400;

/** The chat route sends numeric seconds. Invalid/missing values must not turn
 * into an invented waiting time or an unbounded browser timer.
 * @param {string | null} value
 * @param {number} now
 * @returns {number | null}
 */
export function chatRetryDeadline(value, now) {
  if (typeof value !== "string" || !/^[1-9]\d{0,4}$/.test(value) ||
      !Number.isSafeInteger(now) || now < 0) return null;
  const seconds = Number(value);
  const deadline = now + seconds * 1000;
  return seconds <= MAX_RETRY_SECONDS && Number.isSafeInteger(deadline) ? deadline : null;
}

/** UI guidance only; server quotas remain authoritative.
 * @param {number | null} deadline
 * @param {number} now
 */
export function isChatCoolingDown(deadline, now) {
  return typeof deadline === "number" && Number.isSafeInteger(deadline) &&
    Number.isSafeInteger(now) && deadline > now;
}
