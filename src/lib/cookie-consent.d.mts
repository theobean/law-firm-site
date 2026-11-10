export type CookieConsent = "accepted" | "rejected" | null;
export const COOKIE_CONSENT_KEY: "cookieConsent";
export const GOOGLE_ANALYTICS_ID: "G-TE25ZYG8WM";
export interface CookieConsentStore {
  getCookieConsent(): CookieConsent;
  hasAnalyticsConsent(): boolean;
  setCookieConsent(choice: Exclude<CookieConsent, null>): boolean;
  subscribeCookieConsent(listener: () => void): () => void;
  loadGoogleAnalytics(): void;
  markOptionalServiceStarted(): void;
}
export function createCookieConsentStore(browser: Window): CookieConsentStore;
export function getCookieConsent(): CookieConsent;
export function hasAnalyticsConsent(): boolean;
export function setCookieConsent(choice: Exclude<CookieConsent, null>): boolean;
export function subscribeCookieConsent(listener: () => void): () => void;
export function loadGoogleAnalytics(): void;
export function markOptionalServiceStarted(): void;
