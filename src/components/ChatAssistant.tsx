"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ExternalLink, LoaderCircle, MessageCircle, Phone, RotateCcw, Send, ShieldCheck, X } from "lucide-react";
import { Link } from "@/navigation";
import styles from "./ChatAssistant.module.css";

type ChatSource = { title: string; url: string };
type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  suggestContact?: boolean;
};
type ChatError = "unavailable" | "rate_limit" | "invalid_request" | "request_too_large" | "forbidden" | "upstream";
const MAX_MESSAGE_LENGTH = 1200;
const ERROR_CODES = new Set<ChatError>(["unavailable", "rate_limit", "invalid_request", "request_too_large", "forbidden", "upstream"]);

function safeSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) return [];
  return value.filter((source): source is ChatSource => {
    if (!source || typeof source.title !== "string" || typeof source.url !== "string") return false;
    try {
      const url = new URL(source.url);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }).slice(0, 5);
}

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
  const [error, setError] = useState<ChatError | null>(null);
  const [failedQuestion, setFailedQuestion] = useState("");
  const [bottomOffset, setBottomOffset] = useState(20);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestPendingRef = useRef(false);
  const sequenceRef = useRef(0);

  useEffect(() => {
    const overlays = document.getElementById("site-bottom-overlays");
    if (!overlays) return;
    const update = () => setBottomOffset(Math.ceil(overlays.getBoundingClientRect().height) + 20);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(overlays);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestPendingRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    if (activated && !loading) inputRef.current?.focus();
    else panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, activated, loading]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "instant" });
  }, [messages, loading, error, open]);

  function closePanel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function resetConversation() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    requestPendingRef.current = false;
    setMessages([]);
    setDraft("");
    setError(null);
    setFailedQuestion("");
    setLoading(false);
    inputRef.current?.focus();
  }

  async function sendQuestion(question: string) {
    const content = question.trim();
    if (!activated || requestPendingRef.current || !content || content.length > MAX_MESSAGE_LENGTH) return;
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          consent: true,
          messages: requestMessages,
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (controllerRef.current !== controller) return;
      if (!response.ok || !data || typeof data.answer !== "string" || !data.answer.trim()) {
        const code: ChatError = ERROR_CODES.has(data?.error) ? data.error : "upstream";
        setMessages(history.slice(0, -1));
        setDraft(content);
        setFailedQuestion(content);
        setError(code);
        return;
      }
      setMessages([...history, {
        id: ++sequenceRef.current,
        role: "assistant",
        content: data.answer,
        sources: safeSources(data.sources),
        suggestContact: data.suggestContact === true,
      }]);
    } catch {
      if (controller.signal.aborted || controllerRef.current !== controller) return;
      setMessages(history.slice(0, -1));
      setDraft(content);
      setFailedQuestion(content);
      setError("upstream");
    } finally {
      if (controllerRef.current === controller) {
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
        <section ref={panelRef} tabIndex={-1} id={panelId} role="dialog" aria-label={t("title")} className={styles.panel}>
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
              <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-relevant="additions text" aria-label={t("conversation")} aria-busy={loading}>
                <div className={styles.assistantMessage}>
                  <span className={styles.speaker}>{t("assistantLabel")}</span>
                  <p className={styles.messageText}>{t("welcome")}</p>
                </div>
                {messages.length === 0 && (
                  <div className={styles.starters}>
                    {["starterOffice", "starterLegal", "starterAppointment"].map((key) => (
                      <button key={key} type="button" onClick={() => void sendQuestion(t(key))} disabled={loading}>
                        {t(key)} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={message.role === "user" ? styles.userMessage : styles.assistantMessage}>
                    <span className={styles.speaker}>{t(message.role === "user" ? "youLabel" : "assistantLabel")}</span>
                    <p className={styles.messageText}>{message.content}</p>
                    {!!message.sources?.length && (
                      <div className={styles.sources}>
                        <p>{t("sources")}</p>
                        {message.sources.map((source) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.title} <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    )}
                    {message.suggestContact && <Link href="/contact" className={styles.messageContact}>{t("contactOffice")} <ArrowRight size={13} aria-hidden="true" /></Link>}
                  </div>
                ))}
                {loading && <p className={styles.loading}><LoaderCircle size={15} className={styles.spinner} aria-hidden="true" />{t("thinking")}</p>}
                {error && (
                  <div className={styles.error} role="alert">
                    <p>{t(`errors.${error}`)}</p>
                    <div>
                      <button type="button" onClick={() => void sendQuestion(failedQuestion)}>{t("retry")}</button>
                      <Link href="/contact">{t("contactOffice")}</Link>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={onSubmit} className={styles.composer}>
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
                    rows={2}
                    disabled={loading}
                    autoComplete="off"
                    aria-describedby={`${inputId}-hint`}
                  />
                  <button type="submit" disabled={loading || !draft.trim()} aria-label={t("send")} title={t("send")}>
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

      <button ref={triggerRef} type="button" onClick={() => open ? closePanel() : setOpen(true)} className={styles.trigger} aria-expanded={open} aria-controls={panelId} aria-label={open ? t("close") : t("open")}>
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
        <span>{t("title")}</span>
      </button>
    </aside>
  );
}
