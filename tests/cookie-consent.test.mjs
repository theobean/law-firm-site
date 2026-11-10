import assert from "node:assert/strict";
import { test } from "node:test";
import { COOKIE_CONSENT_KEY, GOOGLE_ANALYTICS_ID, createCookieConsentStore } from "../src/lib/cookie-consent.mjs";

function fakeBrowser(initialConsent = null) {
  const browser = new EventTarget();
  const values = new Map(initialConsent === null ? [] : [[COOKIE_CONSENT_KEY, initialConsent]]);
  const failures = { read: false, write: false };
  const scripts = [];
  const cookieWrites = [];
  const cookies = new Map([["_ga", "test"], ["_ga_SAMPLE", "test"], ["_gid", "test"], ["locale-pref", "el"], ["chat-visitor", "security"]]);
  const calls = [];
  browser.localStorage = {
    getItem(key) {
      if (failures.read) throw new Error("storage unavailable");
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failures.write) throw new Error("storage unavailable");
      values.set(key, value);
    },
  };
  browser.location = { hostname: "www.example.lawyer", reload: () => calls.push("reload") };
  browser.va = (name, value) => calls.push([name, value]);
  browser.document = {
    getElementById: (id) => scripts.find((script) => script.id === id) ?? null,
    createElement: (tagName) => ({ tagName }),
    head: { appendChild: (script) => scripts.push(script) },
    get cookie() { return [...cookies].map(([name, value]) => `${name}=${value}`).join("; "); },
    set cookie(value) {
      cookieWrites.push({ value, disabled: browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`] });
      cookies.delete(value.split("=", 1)[0]);
    },
  };
  const fireStorage = (value, key = COOKIE_CONSENT_KEY) => {
    if (key === null) values.clear();
    else if (value === null) values.delete(key);
    else values.set(key, value);
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: key });
    browser.dispatchEvent(event);
  };
  return { browser, values, failures, scripts, cookieWrites, cookies, calls, fireStorage };
}

test("no analytics starts without explicit accepted consent, including invalid saved values", () => {
  for (const value of [null, "rejected", "", "true", "ACCEPTED", "accepted ", "{}"] ) {
    const fixture = fakeBrowser(value);
    const store = createCookieConsentStore(fixture.browser);
    store.subscribeCookieConsent(() => {});
    store.loadGoogleAnalytics();
    assert.equal(store.hasAnalyticsConsent(), false, String(value));
    assert.equal(store.getCookieConsent(), value === "rejected" ? "rejected" : null);
    assert.equal(fixture.scripts.length, 0);
    assert.equal(fixture.browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true);
    assert.equal(fixture.calls.includes("reload"), false);
  }
});

test("acceptance notifies this tab and loads Google Analytics once only after saving the choice", () => {
  const fixture = fakeBrowser();
  const store = createCookieConsentStore(fixture.browser);
  const observed = [];
  store.subscribeCookieConsent(() => observed.push(store.getCookieConsent()));
  assert.equal(store.setCookieConsent("accepted"), true);
  assert.deepEqual(observed, ["accepted"]);
  assert.equal(fixture.values.get(COOKIE_CONSENT_KEY), "accepted");
  store.loadGoogleAnalytics();
  store.loadGoogleAnalytics();
  assert.equal(fixture.scripts.length, 1);
  assert.equal(fixture.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`);
  assert.equal(fixture.browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], false);
  assert.equal(fixture.browser.dataLayer.length, 2);
});

test("withdrawal blocks further analytics immediately, purges only analytics cookies and reloads once", () => {
  const fixture = fakeBrowser("accepted");
  const store = createCookieConsentStore(fixture.browser);
  store.subscribeCookieConsent(() => {});
  store.loadGoogleAnalytics();
  fixture.cookieWrites.length = 0;
  const queueLength = fixture.browser.dataLayer.length;
  assert.equal(store.setCookieConsent("rejected"), true);
  assert.equal(store.hasAnalyticsConsent(), false);
  assert.equal(fixture.browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true);
  assert.equal(fixture.values.get(COOKIE_CONSENT_KEY), "rejected");
  fixture.browser.gtag("event", "after_withdrawal");
  assert.equal(fixture.browser.dataLayer.length, queueLength);
  const beforeSend = fixture.calls.findLast((call) => Array.isArray(call) && call[0] === "beforeSend")[1];
  assert.equal(beforeSend({ type: "pageview" }), null);
  assert.ok(fixture.cookieWrites.length > 0);
  assert.ok(fixture.cookieWrites.every(({ disabled }) => disabled));
  assert.ok(fixture.cookieWrites.some(({ value }) => value.includes("domain=example.lawyer")));
  assert.deepEqual([...fixture.cookies.keys()], ["locale-pref", "chat-visitor"]);
  assert.equal(fixture.calls.filter((call) => call === "reload").length, 1);
  store.setCookieConsent("rejected");
  assert.equal(fixture.calls.filter((call) => call === "reload").length, 1);
  store.loadGoogleAnalytics();
  assert.equal(fixture.scripts.length, 1);
});

test("saved consent restores analytics permission but server rendering has no browser side effects", async () => {
  const fixture = fakeBrowser("accepted");
  const store = createCookieConsentStore(fixture.browser);
  assert.equal(store.getCookieConsent(), "accepted");
  assert.equal(store.hasAnalyticsConsent(), true);
  assert.equal(fixture.scripts.length, 0);
  const module = await import("../src/lib/cookie-consent.mjs");
  assert.equal(module.getCookieConsent(), null);
  assert.equal(module.hasAnalyticsConsent(), false);
  module.loadGoogleAnalytics();
});

test("other tabs synchronize acceptance and revoke on rejected, removed, cleared or invalid consent", () => {
  for (const change of [{ value: "rejected" }, { value: null }, { value: null, key: null }, { value: "unexpected" }]) {
    const fixture = fakeBrowser();
    const store = createCookieConsentStore(fixture.browser);
    const observed = [];
    const unsubscribe = store.subscribeCookieConsent(() => observed.push(store.getCookieConsent()));
    fixture.fireStorage("accepted");
    assert.equal(store.hasAnalyticsConsent(), true);
    assert.equal(observed.at(-1), "accepted");
    store.loadGoogleAnalytics();
    fixture.fireStorage(change.value, change.key === null ? null : COOKIE_CONSENT_KEY);
    assert.equal(store.hasAnalyticsConsent(), false);
    assert.equal(fixture.browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true);
    assert.equal(fixture.calls.includes("reload"), true);
    unsubscribe();
  }
});

test("unrelated storage changes do not alter the visitor's choice", () => {
  const fixture = fakeBrowser("accepted");
  const store = createCookieConsentStore(fixture.browser);
  const observed = [];
  const unsubscribe = store.subscribeCookieConsent(() => observed.push(store.getCookieConsent()));
  fixture.fireStorage("rejected", "unrelated-key");
  assert.equal(store.hasAnalyticsConsent(), true);
  assert.deepEqual(observed, []);
  unsubscribe();
  fixture.fireStorage("rejected");
  assert.deepEqual(observed, []);
});

test("storage failures fail closed and cannot reload stale approval after failed withdrawal", () => {
  const fixture = fakeBrowser("accepted");
  const store = createCookieConsentStore(fixture.browser);
  store.subscribeCookieConsent(() => {});
  store.loadGoogleAnalytics();
  fixture.failures.write = true;
  assert.equal(store.setCookieConsent("rejected"), false);
  assert.equal(fixture.values.get(COOKIE_CONSENT_KEY), "accepted");
  assert.equal(store.getCookieConsent(), null);
  assert.equal(store.hasAnalyticsConsent(), false);
  assert.equal(fixture.browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true);
  assert.equal(fixture.calls.includes("reload"), false);
  fixture.failures.write = false;
  assert.equal(store.setCookieConsent("rejected"), true);
  assert.equal(fixture.values.get(COOKIE_CONSENT_KEY), "rejected");
  assert.equal(fixture.calls.includes("reload"), true);

  const deniedFixture = fakeBrowser("accepted");
  deniedFixture.failures.read = true;
  deniedFixture.failures.write = true;
  const deniedStore = createCookieConsentStore(deniedFixture.browser);
  assert.equal(deniedStore.getCookieConsent(), null);
  assert.equal(deniedStore.setCookieConsent("accepted"), false);
  deniedStore.loadGoogleAnalytics();
  assert.equal(deniedFixture.scripts.length, 0);
});

test("optional services also trigger cleanup reload without requiring Google Analytics", () => {
  const fixture = fakeBrowser("accepted");
  const store = createCookieConsentStore(fixture.browser);
  store.markOptionalServiceStarted();
  store.setCookieConsent("rejected");
  assert.equal(fixture.scripts.length, 0);
  assert.equal(fixture.calls.includes("reload"), true);
});
