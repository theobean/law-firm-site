export const COOKIE_CONSENT_KEY = "cookieConsent";
export const GOOGLE_ANALYTICS_ID = "G-TE25ZYG8WM";
const GA_SCRIPT_ID = "ga-script-src";

/** Browser dependencies are injected so consent and withdrawal can be tested
 * without loading analytics or contacting any external service. */
export function createCookieConsentStore(browser) {
  const listeners = new Set();
  let storageBlocked = false;
  let optionalServiceStarted = false;
  let reloadPending = false;

  function getCookieConsent() {
    if (storageBlocked) return null;
    if (reloadPending) return "rejected";
    try {
      const value = browser.localStorage.getItem(COOKIE_CONSENT_KEY);
      return value === "accepted" || value === "rejected" ? value : null;
    } catch {
      storageBlocked = true;
      return null;
    }
  }

  function hasAnalyticsConsent() {
    return getCookieConsent() === "accepted";
  }

  function purgeAnalyticsCookies() {
    const document = browser.document;
    const host = browser.location.hostname;
    const domains = host.split(".").map((_, index, parts) => parts.slice(index).join("."));
    try {
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=", 1)[0].trim();
        if (!/^_(?:ga(?:_|$)|gid$|gat(?:_|$)|gac_)/u.test(name)) continue;
        const expired = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = expired;
        for (const domain of domains) {
          document.cookie = `${expired}; domain=${domain}`;
          document.cookie = `${expired}; domain=.${domain}`;
        }
      }
    } catch {
      // Browser restrictions must never enable analytics or break withdrawal.
    }
  }

  function disableAnalytics() {
    // Deleting cookies or removing a script does not unload its running code.
    browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = true;
    browser.va?.("beforeSend", () => null);
    purgeAnalyticsCookies();
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function stopOptionalServices() {
    disableAnalytics();
    const shouldReload = optionalServiceStarted && !reloadPending && !storageBlocked;
    if (shouldReload) reloadPending = true;
    emit();
    // A failed storage write must not reload an older saved "accepted" value.
    // Collection stays blocked in this tab until a choice can be saved.
    if (shouldReload) browser.location.reload();
  }

  function onStorage(event) {
    if (event.key !== null && event.key !== COOKIE_CONSENT_KEY) return;
    if (!hasAnalyticsConsent()) stopOptionalServices();
    else emit();
  }

  function subscribeCookieConsent(listener) {
    if (listeners.size === 0) browser.addEventListener("storage", onStorage);
    listeners.add(listener);
    // In particular, a new denied session starts with Google's disable flag.
    if (!hasAnalyticsConsent()) disableAnalytics();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) browser.removeEventListener("storage", onStorage);
    };
  }

  function setCookieConsent(choice) {
    if (choice !== "accepted" && choice !== "rejected") return false;
    let saved = false;
    try {
      browser.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
      storageBlocked = false;
      saved = true;
    } catch {
      storageBlocked = true;
    }
    if (!saved || choice === "rejected") stopOptionalServices();
    else emit();
    return saved;
  }

  function markOptionalServiceStarted() {
    if (hasAnalyticsConsent()) optionalServiceStarted = true;
  }

  function loadGoogleAnalytics() {
    if (!hasAnalyticsConsent()) return;
    browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = false;
    if (browser.document.getElementById(GA_SCRIPT_ID)) {
      optionalServiceStarted = true;
      return;
    }
    browser.dataLayer = browser.dataLayer || [];
    browser.gtag = function gtag() {
      if (hasAnalyticsConsent()) browser.dataLayer.push(arguments);
    };
    browser.gtag("js", new Date());
    browser.gtag("config", GOOGLE_ANALYTICS_ID);
    const script = browser.document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    optionalServiceStarted = true;
    browser.document.head.appendChild(script);
  }

  return { getCookieConsent, hasAnalyticsConsent, setCookieConsent, subscribeCookieConsent, loadGoogleAnalytics, markOptionalServiceStarted };
}

let browserStore;
function getBrowserStore() {
  if (typeof window === "undefined") return null;
  return browserStore ??= createCookieConsentStore(window);
}

export function getCookieConsent() { return getBrowserStore()?.getCookieConsent() ?? null; }
export function hasAnalyticsConsent() { return getBrowserStore()?.hasAnalyticsConsent() ?? false; }
export function setCookieConsent(choice) { return getBrowserStore()?.setCookieConsent(choice) ?? false; }
export function subscribeCookieConsent(listener) { return getBrowserStore()?.subscribeCookieConsent(listener) ?? (() => {}); }
export function loadGoogleAnalytics() { getBrowserStore()?.loadGoogleAnalytics(); }
export function markOptionalServiceStarted() { getBrowserStore()?.markOptionalServiceStarted(); }
