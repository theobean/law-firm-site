"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, LoaderCircle, MessageCircle, Phone, RotateCcw, Send, ShieldCheck, X } from "lucide-react";
import { Link } from "@/navigation";
import { parseChatResponse, readBoundedJson } from "@/lib/chat/protocol.mjs";
import { chatRetryDeadline, isChatCoolingDown } from "@/lib/chat/retry-after.mjs";
import { classifyChatSubmissionFailure } from "@/lib/chat/verification-feedback.mjs";
import ChatText from "./ChatText";
import useChatVerification from "./useChatVerification";
import styles from "./ChatAssistant.module.css";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  suggestContact?: boolean;
};
type ChatError = "unavailable" | "unauthorized" | "rate_limit" | "invalid_request" | "request_too_large" | "forbidden" | "upstream";
const MAX_MESSAGE_LENGTH = 1200;
const ERROR_CODES = new Set<ChatError>(["unavailable", "unauthorized", "rate_limit", "invalid_request", "request_too_large", "forbidden", "upstream"]);
const VERIFICATION_ENABLED = process.env.NEXT_PUBLIC_CHAT_TURNSTILE_ENABLED === "true";
const VERIFICATION_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export default function ChatAssistant() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const panelId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingReply, setTypingReply] = useState<{ id: number; text: string } | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const [failedQuestion, setFailedQuestion] = useState("");
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [bottomOffset, setBottomOffset] = useState(20);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestPendingRef = useRef(false);
  const sequenceRef = useRef(0);
  const typingFrameRef = useRef<number | null>(null);
  const followReplyRef = useRef(true);
  const verification = useChatVerification({
    enabled: VERIFICATION_ENABLED,
    active: activated && open,
    siteKey: VERIFICATION_SITE_KEY,
    locale,
  });
  const verificationBlocked = VERIFICATION_ENABLED && verification.status !== "ready";
  const coolingDown = isChatCoolingDown(retryAt, Date.now());
  const draftTooLong = draft.length > MAX_MESSAGE_LENGTH;
  const retryTime = retryAt === null ? "" : new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(retryAt);
  const verificationMessage = verification.status === "loading" || verification.status === "checking" || verification.status === "interactive"
    || verification.status === "failed" || verification.status === "expired" || verification.status === "unavailable"
    ? verification.status : null;

  useEffect(() => {
    const overlays = document.getElementById("site-bottom-overlays");
    if (!overlays) return;
    const update = () => setBottomOffset(Math.ceil(overlays.getBoundingClientRect().height) + 20);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(overlays);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (retryAt === null) return;
    // This only re-enables manual submission. Nothing is sent automatically.
    const timer = window.setTimeout(() => setRetryAt(null), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [retryAt]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestPendingRef.current = false;
    if (typingFrameRef.current !== null) cancelAnimationFrame(typingFrameRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (activated && !loading && !verificationBlocked) inputRef.current?.focus({ preventScroll: true });
    else panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, activated, loading, verificationBlocked]);

  useEffect(() => {
    const log = logRef.current;
    followReplyRef.current = true;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "instant" });
  }, [messages, loading, error, open]);

  useEffect(() => {
    const log = logRef.current;
    // Keep following the reply unless the visitor has scrolled up to read.
    if (log && followReplyRef.current) {
      log.scrollTo({ top: log.scrollHeight, behavior: "instant" });
    }
  }, [typingReply]);

  function finishTyping() {
    if (typingFrameRef.current !== null) cancelAnimationFrame(typingFrameRef.current);
    typingFrameRef.current = null;
    setTypingReply(null);
  }

  function animateReply(id: number, text: string) {
    finishTyping();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    // Reveal complete graphemes so accents and joined emoji stay intact.
    const characters = typeof Intl.Segmenter === "function"
      ? Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text), ({ segment }) => segment)
      : Array.from(text);
    const duration = Math.min(6000, Math.max(500, characters.length * 14));
    const started = performance.now();
    let previousCount = 0;
    setTypingReply({ id, text: "" });
    const reveal = (now: number) => {
      const count = Math.min(characters.length, Math.floor((now - started) / duration * characters.length));
      if (reducedMotion.matches || count >= characters.length) {
        typingFrameRef.current = null;
        setTypingReply(null);
        return;
      }
      if (count !== previousCount) {
        previousCount = count;
        setTypingReply({ id, text: characters.slice(0, count).join("") });
      }
      typingFrameRef.current = requestAnimationFrame(reveal);
    };
    typingFrameRef.current = requestAnimationFrame(reveal);
  }

  function closePanel() {
    if (VERIFICATION_ENABLED) controllerRef.current?.abort();
    setOpen(false);
    // The launcher is hidden while the panel is open; restore focus after it
    // becomes visible in the next render.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function resetConversation() {
    finishTyping();
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestPendingRef.current = false;
    setMessages([]);
    setDraft("");
    setError(null);
    setFailedQuestion("");
    setLoading(false);
    if (VERIFICATION_ENABLED) verification.reset();
    inputRef.current?.focus({ preventScroll: true });
  }

  async function sendQuestion(question: string) {
    const content = question.trim();
    if (!activated || requestPendingRef.current || verificationBlocked ||
        isChatCoolingDown(retryAt, Date.now()) || !content || question.length > MAX_MESSAGE_LENGTH) return;
    finishTyping();
    requestPendingRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    const userMessage: ChatMessage = { id: ++sequenceRef.current, role: "user", content };
    const history = [...messages, userMessage];
    const requestMessages = history.slice(-9).map(({ role, content: text }) => ({
      role,
      content: text.slice(0, role === "user" ? MAX_MESSAGE_LENGTH : 4000),
    }));
    while (requestMessages.length > 1 && requestMessages.reduce((length, message) => length + message.content.length, 0) > 20_000) {
      requestMessages.splice(0, 2);
    }
    setMessages(history);
    setDraft("");
    setLoading(true);
    setError(null);
    setFailedQuestion("");

    let tokenObtained = false;
    let requestSent = false;
    try {
      const turnstileToken = await verification.verify(controller.signal);
      tokenObtained = VERIFICATION_ENABLED;
      if (controller.signal.aborted || controllerRef.current !== controller) return;
      requestSent = true;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          consent: true,
          messages: requestMessages,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
        signal: controller.signal,
      });
      const data = await readBoundedJson(response).catch(() => null);
      if (controllerRef.current !== controller) return;
      if (controller.signal.aborted) throw new DOMException("Chat request cancelled", "AbortError");
      const reply = parseChatResponse(data);
      if (!response.ok || !reply) {
        const receivedError = data && typeof data === "object" && "error" in data ? data.error : null;
        const code: ChatError = typeof receivedError === "string" && ERROR_CODES.has(receivedError as ChatError)
          ? receivedError as ChatError : "upstream";
        setMessages(history.slice(0, -1));
        setDraft(content);
        setFailedQuestion(content);
        setError(code);
        if (response.status === 429 && code === "rate_limit") {
          setRetryAt(chatRetryDeadline(response.headers.get("Retry-After"), Date.now()));
        }
        return;
      }
      const replyId = ++sequenceRef.current;
      setMessages([...history, {
        id: replyId,
        role: "assistant",
        content: reply.answer,
        suggestContact: reply.suggestContact,
      }]);
      animateReply(replyId, reply.answer);
    } catch (failure) {
      const feedback = classifyChatSubmissionFailure({ current: controllerRef.current === controller,
        aborted: controller.signal.aborted, requestSent, verificationEnabled: VERIFICATION_ENABLED, error: failure });
      if (feedback === "stale") return;
      setMessages(history.slice(0, -1));
      setDraft(content);
      if (feedback === "cancelled") return;
      setFailedQuestion(content);
      // Even an early verification rejection must expose its accessible notice
      // and manual retry control; the hook may still have reported "ready".
      if (feedback === "verification") verification.reportFailure();
      else setError("upstream");
    } finally {
      if (controllerRef.current === controller) {
        if (tokenObtained) verification.reset();
        controllerRef.current = null;
        requestPendingRef.current = false;
        setLoading(false);
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  const containerStyle = { "--chat-bottom": `${bottomOffset}px` } as CSSProperties;

  return (
    <aside className={styles.container} style={containerStyle} aria-label={t("regionLabel")}>
      {open && (
        <section ref={panelRef} tabIndex={-1} id={panelId} role="dialog" aria-label={t("title")} aria-describedby={`${panelId}-disclaimer`} className={styles.panel}>
          <header className={styles.header}>
            <span className={styles.brandIcon} aria-hidden="true"><MessageCircle size={22} /></span>
            <div className={styles.heading}>
              <h2>{t("title")}</h2>
              <p>{t("subtitle")}</p>
            </div>
            {activated && (
              <button type="button" onClick={resetConversation} className={styles.iconButton} aria-label={t("reset")} title={t("reset")}>
                <RotateCcw size={17} />
              </button>
            )}
            <button type="button" onClick={closePanel} className={styles.iconButton} aria-label={t("close")}>
              <X size={20} />
            </button>
          </header>

          <p id={`${panelId}-disclaimer`} className={styles.disclaimer}>{t("legalDisclaimer")}</p>

          {!activated ? (
            <div className={styles.intro}>
              <span className={styles.eyebrow}>{t("officeName")}</span>
              <h3>{t("introTitle")}</h3>
              <p className={styles.introDescription}>{t("introDescription")}</p>
              <div className={styles.notice}>
                <ShieldCheck size={19} aria-hidden="true" />
                <p>{t("privacyNotice")}</p>
              </div>
              <p className={styles.processingNotice}>{t("processingNotice")} <Link href="/privacy">{t("privacyLink")}</Link></p>
              <button type="button" onClick={() => setActivated(true)} className={styles.startButton}>
                {t("start")} <ArrowRight size={17} aria-hidden="true" />
              </button>
              <Link href="/contact" className={styles.alternativeLink}>{t("contactInstead")}</Link>
            </div>
          ) : (
            <>
              <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-relevant="additions text" aria-label={t("conversation")} aria-busy={loading || typingReply !== null}
                onScroll={(event) => {
                  const log = event.currentTarget;
                  followReplyRef.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
                }}>
                <div className={styles.assistantMessage}>
                  <span className={styles.speaker}>{t("assistantLabel")}</span>
                  <p className={styles.messageText}>{t("welcome")}</p>
                </div>
                {messages.length === 0 && (
                  <div className={styles.starters}>
                    {["starterOffice", "starterLegal", "starterAppointment"].map((key) => (
                      <button key={key} type="button" onClick={() => void sendQuestion(t(key))} disabled={loading || verificationBlocked || coolingDown}>
                        {t(key)} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={message.role === "user" ? styles.userMessage : styles.assistantMessage}>
                    <span className={styles.speaker}>{t(message.role === "user" ? "youLabel" : "assistantLabel")}</span>
                    {typingReply?.id === message.id ? (
                      <>
                        <div className={styles.typingText} aria-hidden="true">
                          <ChatText className={styles.messageText} text={typingReply.text} />
                        </div>
                        <ChatText className={styles.srOnly} text={message.content} />
                      </>
                    ) : <ChatText className={styles.messageText} text={message.content} />}
                    {typingReply?.id !== message.id && message.suggestContact && <Link href="/contact" className={styles.messageContact}>{t("contactOffice")} <ArrowRight size={13} aria-hidden="true" /></Link>}
                  </div>
                ))}
                {loading && (!VERIFICATION_ENABLED || (verification.status !== "checking" && verification.status !== "interactive")) && <p className={styles.loading}><LoaderCircle size={15} className={styles.spinner} aria-hidden="true" />{t("thinking")}</p>}
                {error && (
                  <div className={styles.error} role="alert">
                    <p>{t(VERIFICATION_ENABLED && error === "unauthorized" ? "verification.failed" : `errors.${error}`)}</p>
                    <div>
                      <button type="button" onClick={() => void sendQuestion(failedQuestion)} disabled={loading || verificationBlocked || coolingDown}>{t("retry")}</button>
                      <Link href="/contact">{t("contactOffice")}</Link>
                    </div>
                  </div>
                )}
              </div>

              {VERIFICATION_ENABLED && (
                <div className={`${styles.verification} ${verificationMessage ? "" : styles.verificationIdle}`} role="group" aria-label={t("verification.label")}>
                  {verificationMessage && (
                    <p id={`${inputId}-verification`} className={styles.verificationStatus} role="status" aria-live="polite">
                      {(verification.status === "loading" || verification.status === "checking") && <LoaderCircle size={14} className={styles.spinner} aria-hidden="true" />}
                      {t(`verification.${verificationMessage}`)}
                    </p>
                  )}
                  <div ref={verification.hostRef} className={styles.verificationWidget} />
                  {(verification.status === "failed" || verification.status === "expired" || verification.status === "unavailable") && (
                    <div className={styles.verificationActions}>
                      {VERIFICATION_SITE_KEY && verification.status !== "unavailable" && <button type="button" onClick={() => { setError(null); verification.retry(); }} disabled={loading}>{t("verification.retry")}</button>}
                      <Link href="/contact">{t("contactOffice")}</Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={onSubmit} className={styles.composer}>
                {coolingDown && <p id={`${inputId}-cooldown`} className={styles.cooldown} role="status">{t("retryAt", { time: retryTime })}</p>}
                {draftTooLong && <p id={`${inputId}-length`} className={styles.lengthError} role="alert">{t("inputTooLong", { limit: MAX_MESSAGE_LENGTH })}</p>}
                <label className={styles.srOnly} htmlFor={inputId}>{t("inputLabel")}</label>
                <div className={styles.inputRow}>
                  <textarea
                    ref={inputRef}
                    id={inputId}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        void sendQuestion(draft);
                      }
                    }}
                    placeholder={t("placeholder")}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={1}
                    disabled={loading || (VERIFICATION_ENABLED && verification.status === "unavailable")}
                    autoComplete="off"
                    aria-invalid={draftTooLong || undefined}
                    aria-describedby={`${inputId}-hint${VERIFICATION_ENABLED && verificationMessage ? ` ${inputId}-verification` : ""}${coolingDown ? ` ${inputId}-cooldown` : ""}${draftTooLong ? ` ${inputId}-length` : ""}`}
                  />
                  <button type="submit" disabled={loading || verificationBlocked || coolingDown || draftTooLong || !draft.trim()} aria-label={t("send")} title={t("send")}>
                    {loading ? <LoaderCircle size={18} className={styles.spinner} /> : <Send size={18} />}
                  </button>
                </div>
                <div className={styles.inputHint} id={`${inputId}-hint`}>
                  <span>{t("inputHint")}</span>
                  <span>{draft.length}/{MAX_MESSAGE_LENGTH}</span>
                </div>
              </form>
            </>
          )}

          <footer className={styles.footer}>
            <a href="tel:+302310545261"><Phone size={12} aria-hidden="true" />2310 545 261</a>
            <span>{t("footerNotice")}</span>
          </footer>
        </section>
      )}

      <button ref={triggerRef} hidden={open} type="button" onClick={() => setOpen(true)} className={styles.trigger} aria-expanded={open} aria-controls={panelId} aria-label={t("open")}>
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
        <span className={styles.triggerCopy}>
          <span className={styles.triggerName}>{t("title")}</span>
          <span className={styles.triggerTagline}>{t("triggerTagline")}</span>
        </span>
      </button>
    </aside>
  );
}
