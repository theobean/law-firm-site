import { useEffect, useRef, useState } from "react";

type VerificationStatus = "idle" | "loading" | "ready" | "checking" | "interactive" | "failed" | "expired" | "unavailable";
type TurnstileOptions = {
  sitekey: string;
  action: string;
  execution: "execute";
  appearance: "interaction-only";
  size: "compact";
  theme: "light";
  language: string;
  retry: "never";
  "refresh-expired": "manual";
  "refresh-timeout": "manual";
  "response-field": false;
  callback: (token: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  "unsupported-callback": () => void;
  "before-interactive-callback": () => void;
};
type Turnstile = {
  ready: (callback: () => void) => void;
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};
type TurnstileWindow = Window & { turnstile?: Turnstile };
type Widget = { api: Turnstile; id: string };
type PendingVerification = { resolve: (token: string) => void; reject: (error: Error) => void };

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "lexi-turnstile-script";
const LOAD_TIMEOUT_MS = 15_000;
const VERIFICATION_TIMEOUT_MS = 120_000;
let scriptPromise: Promise<Turnstile> | null = null;

function abortError() {
  return new DOMException("Security check cancelled", "AbortError");
}

// Called only after the visitor chooses to start the assistant. Share the script
// across mounts; a failed download may be retried without adding duplicate tags.
function loadTurnstile(): Promise<Turnstile> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<Turnstile>((resolve, reject) => {
    let settled = false;
    const existingApi = (window as TurnstileWindow).turnstile;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    const finish = (error?: Error, api?: Turnstile) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      if (error || !api) {
        if (!existingApi) script.remove();
        reject(error ?? new Error("Security check unavailable"));
      } else {
        resolve(api);
      }
    };
    const onLoad = () => {
      const api = (window as TurnstileWindow).turnstile;
      if (!api) {
        finish(new Error("Security check unavailable"));
        return;
      }
      try {
        api.ready(() => finish(undefined, api));
      } catch {
        finish(new Error("Security check unavailable"));
      }
    };
    const onError = () => finish(new Error("Security check unavailable"));
    const timeout = window.setTimeout(onError, LOAD_TIMEOUT_MS);
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    if (existingApi) {
      onLoad();
    } else if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

export default function useChatVerification({ enabled, active, siteKey, locale }: {
  enabled: boolean;
  active: boolean;
  siteKey: string;
  locale: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<Widget | null>(null);
  const pendingRef = useRef<PendingVerification | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<VerificationStatus>(enabled && !siteKey ? "unavailable" : "idle");

  useEffect(() => {
    if (!enabled || !active) return;
    if (!siteKey) {
      setStatus("unavailable");
      return;
    }
    let disposed = false;
    let renderFailed = false;
    let mountedWidget: Widget | null = null;
    setStatus("loading");
    const fail = (nextStatus: "failed" | "expired" | "unavailable") => {
      if (disposed) return;
      renderFailed = true;
      setStatus(nextStatus);
      pendingRef.current?.reject(new Error("Security check incomplete"));
    };
    void loadTurnstile().then((api) => {
      if (disposed || !hostRef.current) return;
      const id = api.render(hostRef.current, {
        sitekey: siteKey,
        action: "lexi_chat",
        execution: "execute",
        appearance: "interaction-only",
        size: "compact",
        theme: "light",
        language: locale,
        retry: "never",
        "refresh-expired": "manual",
        "refresh-timeout": "manual",
        "response-field": false,
        callback: (token) => {
          if (disposed || !pendingRef.current) return;
          if (!token) {
            fail("failed");
            return;
          }
          setStatus("ready");
          pendingRef.current.resolve(token);
        },
        "error-callback": () => { fail("failed"); return true; },
        "expired-callback": () => fail("expired"),
        "timeout-callback": () => fail("expired"),
        "unsupported-callback": () => fail("unavailable"),
        "before-interactive-callback": () => {
          if (!disposed && pendingRef.current) setStatus("interactive");
        },
      });
      if (typeof id !== "string" || !id) throw new Error("Security check unavailable");
      if (disposed) {
        api.remove(id);
        return;
      }
      mountedWidget = { api, id };
      widgetRef.current = mountedWidget;
      if (!renderFailed) setStatus("ready");
    }).catch(() => fail("failed"));

    return () => {
      disposed = true;
      pendingRef.current?.reject(abortError());
      if (widgetRef.current === mountedWidget) widgetRef.current = null;
      if (mountedWidget) {
        try { mountedWidget.api.remove(mountedWidget.id); } catch { /* Already removed. */ }
      }
    };
  }, [enabled, active, siteKey, locale, attempt]);

  async function verify(signal: AbortSignal): Promise<string | undefined> {
    if (!enabled) return undefined;
    const widget = widgetRef.current;
    if (!active || !siteKey || !widget) throw new Error("Security check unavailable");
    if (signal.aborted) throw abortError();
    if (pendingRef.current) throw new Error("Security check already pending");

    return new Promise<string>((resolve, reject) => {
      const finish = (token?: string, error?: Error) => {
        if (pendingRef.current !== pending) return;
        pendingRef.current = null;
        window.clearTimeout(timeout);
        signal.removeEventListener("abort", onAbort);
        if (error) reject(error);
        else resolve(token!);
      };
      const onAbort = () => finish(undefined, abortError());
      const pending: PendingVerification = {
        resolve: (token) => finish(token),
        reject: (error) => finish(undefined, error),
      };
      const timeout = window.setTimeout(() => {
        setStatus("expired");
        finish(undefined, new Error("Security check expired"));
      }, VERIFICATION_TIMEOUT_MS);
      pendingRef.current = pending;
      signal.addEventListener("abort", onAbort, { once: true });
      setStatus("checking");
      try {
        // Never retain a token between requests. Each submission starts a new
        // challenge and sends its one-use token immediately to the server.
        widget.api.reset(widget.id);
        widget.api.execute(widget.id);
      } catch {
        setStatus("failed");
        finish(undefined, new Error("Security check unavailable"));
      }
    });
  }

  function reset() {
    pendingRef.current?.reject(abortError());
    const widget = widgetRef.current;
    if (widget) {
      try {
        widget.api.reset(widget.id);
        setStatus("ready");
      } catch {
        setStatus("failed");
      }
    }
  }

  function retry() {
    pendingRef.current?.reject(abortError());
    setAttempt((value) => value + 1);
  }

  return { hostRef, status, verify, reset, retry };
}
