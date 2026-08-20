"use client";

import { AlertCircle, Bot, ChevronRight, Database, LoaderCircle, MessageCircle, RefreshCw, Send, ShieldCheck, ShieldOff, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, startTransition, useEffect, useRef, useState } from "react";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useIsScrolling } from "@/lib/use-is-scrolling";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};

type StoredChatMessage = ChatMessage & {
  id: string;
  delivery: "sent" | "failed";
  errorText?: string;
};

type StoredChatEnvelope = {
  savedAt: number;
  messages: StoredChatMessage[];
};

type ChatContentKind = "recipe" | "guide";

type ChatPanelProps = {
  recipeSlug: string;
  recipeTitle: string;
  kind?: ChatContentKind;
};

type StreamChunk = {
  delta: string;
  model?: string;
};

type CompleteResponse = {
  error?: string;
  signals?: Array<{
    gap_type?: unknown;
  }>;
  trace_persistence?: {
    status?: unknown;
    reason?: unknown;
  };
};

function storageKey(slug: string, kind: ChatContentKind = "recipe") {
  return `danio-cooks-chat:${kind}:${slug}`;
}

function sentUptoKey(slug: string, kind: ChatContentKind = "recipe") {
  return `danio-cooks-chat-sent-upto:${kind}:${slug}`;
}

const consentStorageKey = "danio-cooks-chat-consent-v1";
const shareStorageKey = "danio-cooks-chat-share-v1";
const MAX_COMPLETE_MESSAGES = 40;

// Dopo 10 giorni di inattivita' la cronologia locale e' considerata scaduta (vedi loadStoredHistory).
const CHAT_HISTORY_TTL_MS = 10 * 24 * 60 * 60 * 1000;

function isSharingEnabled() {
  return window.localStorage.getItem(shareStorageKey) !== "opted-out";
}

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isChatMessage(item: unknown): item is ChatMessage {
  return Boolean(item) && typeof item === "object" &&
    ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
    typeof (item as ChatMessage).content === "string" &&
    ((item as ChatMessage).model === undefined || typeof (item as ChatMessage).model === "string");
}

function isStoredChatMessage(item: unknown): item is StoredChatMessage {
  return isChatMessage(item) &&
    typeof (item as StoredChatMessage).id === "string" &&
    ((item as StoredChatMessage).delivery === "sent" || (item as StoredChatMessage).delivery === "failed") &&
    ((item as StoredChatMessage).errorText === undefined || typeof (item as StoredChatMessage).errorText === "string");
}

function normalizeStoredMessage(item: unknown, index: number): StoredChatMessage | null {
  if (!isChatMessage(item)) return null;
  if (isStoredChatMessage(item)) return item;
  return {
    ...item,
    id: `legacy-${index}-${item.role}`,
    delivery: "sent",
  };
}

function parseStoredMessages(raw: unknown): StoredChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    const normalized = normalizeStoredMessage(item, index);
    return normalized ? [normalized] : [];
  });
}

function toRequestMessage(message: StoredChatMessage): ChatMessage {
  return message.model ? { role: message.role, content: message.content, model: message.model } : {
    role: message.role,
    content: message.content,
  };
}

function parseSentUpto(slug: string, kind: ChatContentKind = "recipe") {
  const storedSentUpto = window.localStorage.getItem(sentUptoKey(slug, kind));
  const parsedSentUpto = storedSentUpto ? Number.parseInt(storedSentUpto, 10) : 0;
  return Number.isFinite(parsedSentUpto) && parsedSentUpto > 0 ? parsedSentUpto : 0;
}

// Legge la cronologia salvata per lo slug applicando un TTL di 10 giorni dal salvataggio
// (campo `savedAt` nell'envelope `{ savedAt, messages }`). Se il timestamp manca (formato
// legacy: bare array senza savedAt, salvato prima dell'introduzione del TTL) o se e' passato
// oltre il TTL, la cronologia e' considerata scaduta per sicurezza: viene scartata e vengono
// rimossi sia lo storage della cronologia sia il puntatore n/n+1 associato, perche' un puntatore
// da solo non avrebbe piu' senso su una cronologia azzerata. Centralizzata qui perche' letta sia
// dall'effect di caricamento sia da sendPendingFeedback, per evitare divergenze fra i due punti.
function loadStoredHistory(slug: string, kind: ChatContentKind = "recipe"): StoredChatMessage[] {
  const raw = window.localStorage.getItem(storageKey(slug, kind));
  if (!raw) return [];

  let savedAt: unknown;
  let messages: StoredChatMessage[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      savedAt = undefined;
      messages = parseStoredMessages(parsed);
    } else if (parsed && typeof parsed === "object") {
      const envelope = parsed as Partial<StoredChatEnvelope>;
      savedAt = envelope.savedAt;
      messages = parseStoredMessages(envelope.messages);
    } else {
      savedAt = undefined;
      messages = [];
    }
  } catch {
    savedAt = undefined;
    messages = [];
  }

  const isExpired = typeof savedAt !== "number" || !Number.isFinite(savedAt) || Date.now() - savedAt > CHAT_HISTORY_TTL_MS;
  if (isExpired) {
    window.localStorage.removeItem(storageKey(slug, kind));
    window.localStorage.removeItem(sentUptoKey(slug, kind));
    return [];
  }

  return messages;
}

function restoreSentUpto(slug: string, kind: ChatContentKind, previousSentUpto: number, expectedSentUpto: number) {
  const currentSentUpto = parseSentUpto(slug, kind);
  if (currentSentUpto !== expectedSentUpto) return;

  if (previousSentUpto > 0) {
    window.localStorage.setItem(sentUptoKey(slug, kind), String(previousSentUpto));
    return;
  }

  window.localStorage.removeItem(sentUptoKey(slug, kind));
}

async function ensureCompleteSucceeded(response: Response) {
  const result = await response.json().catch(() => null) as CompleteResponse | null;
  if (!response.ok) {
    throw new Error(result?.error ?? "Invio segnali non riuscito.");
  }

  if (result?.trace_persistence?.status === "failed") {
    const reason = typeof result.trace_persistence.reason === "string" ? result.trace_persistence.reason : null;
    throw new Error(reason ?? "Non e stato possibile salvare i segnali della chat.");
  }

  return result;
}

function getSavedSignalCount(result: CompleteResponse | null) {
  if (result?.trace_persistence?.status !== "persisted") return 0;
  return result.signals?.filter((signal) => signal.gap_type !== "not_a_gap").length ?? 0;
}

const feedbackRequests = new Map<string, Promise<void>>();

async function sendPendingFeedback(
  slug: string,
  kind: ChatContentKind = "recipe",
  options?: { keepalive?: boolean; retries?: number; retryDelayMs?: number },
) {
  if (!isSharingEnabled()) return;
  if (feedbackRequests.has(`${kind}:${slug}`)) {
    await feedbackRequests.get(`${kind}:${slug}`);
    return;
  }

  const requestPromise = (async () => {
    const messages = loadStoredHistory(slug, kind);
    if (messages.length === 0) return;

    const previousSentUpto = parseSentUpto(slug, kind);
    // Il contratto di /api/complete accetta al massimo 40 messaggi. Se una sessione
    // e' piu' lunga, per l'analisi manteniamo il contesto piu' recente e avanziamo
    // comunque il puntatore, cosi' le chiusure successive non ritentano un payload
    // che il backend rifiuterebbe con 400.
    const pending = messages.slice(previousSentUpto).slice(-MAX_COMPLETE_MESSAGES).map(toRequestMessage);
    if (pending.length === 0) return;

    const expectedSentUpto = messages.length;
    window.localStorage.setItem(sentUptoKey(slug, kind), String(expectedSentUpto));

    const retries = options?.retries ?? 0;
    const retryDelayMs = options?.retryDelayMs ?? 15_000;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await fetch("/api/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, kind, messages: pending }),
          keepalive: options?.keepalive ?? false,
        });
        await ensureCompleteSucceeded(response);
        return;
      } catch {
        if (attempt === retries) {
          restoreSentUpto(slug, kind, previousSentUpto, expectedSentUpto);
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, retryDelayMs));
      }
    }
  })();

  feedbackRequests.set(`${kind}:${slug}`, requestPromise);
  try {
    await requestPromise;
  } finally {
    feedbackRequests.delete(`${kind}:${slug}`);
  }
}

const SHARE_TOAST_DURATION_MS = 4500;
const SHARE_TOAST_ENABLED_MESSAGE = "Condivisione attivata: condividiamo un estratto delle sessioni per migliorare le ricette.";
const SHARE_TOAST_DISABLED_MESSAGE = "Condivisione disattivata: le prossime sessioni non verranno piu analizzate per migliorare le ricette.";

function readModelIdentifier(parsed: Record<string, unknown>): string | undefined {
  const directModelKeys = ["model", "assistant_model", "model_name"];
  for (const key of directModelKeys) {
    if (typeof parsed[key] === "string" && parsed[key].trim()) return parsed[key].trim();
  }

  const directObjectKeys = ["delta", "meta", "metadata", "message"];
  for (const key of directObjectKeys) {
    const nested = parsed[key];
    if (nested && typeof nested === "object") {
      const nestedModel = readModelIdentifier(nested as Record<string, unknown>);
      if (nestedModel) return nestedModel;
    }
  }

  return undefined;
}

function getStreamChunk(payload: string): StreamChunk {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (typeof parsed.text === "string") {
      return { delta: parsed.text, model: readModelIdentifier(parsed) };
    }
    if (typeof parsed.delta === "string") {
      return { delta: parsed.delta, model: readModelIdentifier(parsed) };
    }
    if (parsed.delta && typeof parsed.delta === "object") {
      const delta = parsed.delta as Record<string, unknown>;
      if (typeof delta.text === "string") {
        return { delta: delta.text, model: readModelIdentifier(parsed) };
      }
      if (typeof delta.content === "string") {
        return { delta: delta.content, model: readModelIdentifier(parsed) };
      }
    }
    return { delta: "", model: readModelIdentifier(parsed) };
  } catch {
    return { delta: payload };
  }
}

function updateMessageById(messages: StoredChatMessage[], messageId: string, updater: (message: StoredChatMessage) => StoredChatMessage) {
  return messages.map((message) => message.id === messageId ? updater(message) : message);
}

export function ChatPanel({ recipeSlug, recipeTitle, kind = "recipe" }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChatConsent, setHasChatConsent] = useState(false);
  const [isSharingSessions, setIsSharingSessions] = useState(true);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingFirstToken, setIsAwaitingFirstToken] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSignalsStatus, setSaveSignalsStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [savedSignalCount, setSavedSignalCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shareToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSignalsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Each openChat() call increments this counter. handleSaveSignals captures the value at the
  // start of each invocation and checks it before applying post-await state/timer mutations, so
  // that a stale in-flight save cannot overwrite the "idle" state set by a later openChat().
  const saveSignalsGenRef = useRef(0);
  const isScrolling = useIsScrolling();

  function clearShareToastTimeout() {
    if (shareToastTimeoutRef.current !== null) {
      clearTimeout(shareToastTimeoutRef.current);
      shareToastTimeoutRef.current = null;
    }
  }

  function clearSaveSignalsTimer() {
    if (saveSignalsTimerRef.current !== null) {
      clearTimeout(saveSignalsTimerRef.current);
      saveSignalsTimerRef.current = null;
    }
  }

  useEffect(() => clearShareToastTimeout, []);
  useEffect(() => clearSaveSignalsTimer, []);

  useEffect(() => {
    const handlePageHide = () => {
      void sendPendingFeedback(recipeSlug, kind, { keepalive: true });
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      // Copre anche la navigazione SPA verso un'altra ricetta e lo smontaggio del componente.
      void sendPendingFeedback(recipeSlug, kind, { retries: 3, retryDelayMs: 15_000 });
    };
  }, [kind, recipeSlug]);

  useEffect(() => {
    startTransition(() => setMessages(loadStoredHistory(recipeSlug, kind)));
  }, [kind, recipeSlug]);

  useEffect(() => {
    if (messages.length > 0) {
      window.localStorage.setItem(storageKey(recipeSlug, kind), JSON.stringify({ savedAt: Date.now(), messages }));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [kind, messages, recipeSlug]);

  function insertOrUpdateAssistantMessage(userMessageId: string, assistantMessageId: string, assistantText: string, assistantModel?: string) {
    setMessages((current) => {
      const nextAssistantMessage: StoredChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: assistantText,
        delivery: "sent",
        model: assistantModel,
      };
      const existingAssistantIndex = current.findIndex((message) => message.id === assistantMessageId);
      if (existingAssistantIndex >= 0) {
        return current.map((message) => message.id === assistantMessageId ? nextAssistantMessage : message);
      }

      const userMessageIndex = current.findIndex((message) => message.id === userMessageId);
      if (userMessageIndex < 0) return [...current, nextAssistantMessage];

      return [
        ...current.slice(0, userMessageIndex + 1),
        nextAssistantMessage,
        ...current.slice(userMessageIndex + 1),
      ];
    });
  }

  function markMessageFailed(messageId: string, errorMessage: string) {
    setMessages((current) => updateMessageById(current, messageId, (message) => ({
      ...message,
      delivery: "failed",
      errorText: errorMessage,
    })));
  }

  function markMessageSent(messageId: string) {
    setMessages((current) => updateMessageById(current, messageId, (message) => {
      if (message.delivery === "sent" && !message.errorText) return message;
      return {
        ...message,
        delivery: "sent",
        errorText: undefined,
      };
    }));
  }

  async function sendChatRequest(userMessage: StoredChatMessage, history: StoredChatMessage[]) {
    setError(null);
    setIsLoading(true);
    setIsAwaitingFirstToken(true);

    const assistantMessageId = createMessageId();
    let buffer = "";
    let assistantText = "";
    let assistantModel = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: recipeSlug,
          kind,
          message: userMessage.content,
          history: history.map(toRequestMessage),
        }),
      });
      if (!response.ok || !response.body) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Risposta chat non disponibile.");
      }

      assistantModel = response.headers.get("x-danio-chat-model")?.trim() ?? "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const appendEvents = (chunk: string, flush = false) => {
        buffer += chunk;
        const events = buffer.split(/\r?\n\r?\n/);
        const remainder = events.pop() ?? "";
        buffer = flush ? "" : remainder;
        if (flush && remainder) events.push(remainder);

        for (const event of events) {
          const data = event.split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n");
          if (!data || data === "[DONE]") continue;
          const chunkData = getStreamChunk(data);
          if (chunkData.model) assistantModel = chunkData.model;
          if (!chunkData.delta) continue;
          if (!assistantText) {
            setIsAwaitingFirstToken(false);
            markMessageSent(userMessage.id);
          }
          assistantText += chunkData.delta;
          insertOrUpdateAssistantMessage(
            userMessage.id,
            assistantMessageId,
            assistantText,
            assistantModel || undefined,
          );
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendEvents(decoder.decode(value, { stream: true }));
      }
      appendEvents(decoder.decode(), true);
      if (!assistantText) throw new Error("La chat ha restituito una risposta vuota.");
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : "Errore durante la richiesta.";
      setIsAwaitingFirstToken(false);
      setError(errorMessage);

      if (!assistantText) {
        markMessageFailed(userMessage.id, errorMessage);
        setMessages((current) => current.filter((message) => message.id !== assistantMessageId));
      }
    } finally {
      setRetryingMessageId(null);
      setIsLoading(false);
    }
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    const history = messages;
    const nextUserMessage: StoredChatMessage = {
      id: createMessageId(),
      role: "user",
      content: userMessage,
      delivery: "sent",
    };
    setMessages((current) => [...current, nextUserMessage]);
    await sendChatRequest(nextUserMessage, history);
  }

  async function retryMessage(messageId: string) {
    if (isLoading) return;
    const messageIndex = messages.findIndex((message) => message.id === messageId);
    const targetMessage = messages[messageIndex];
    if (!targetMessage || targetMessage.role !== "user") return;

    setRetryingMessageId(messageId);
    await sendChatRequest(targetMessage, messages.slice(0, messageIndex));
  }

  function acceptChatConsent() {
    window.localStorage.setItem(consentStorageKey, "accepted");
    setHasChatConsent(true);
  }

  function openChat() {
    // Bump the generation so any in-flight handleSaveSignals invocation sees a stale gen and
    // skips its post-await state/timer mutations (issue: reopening during in-flight manual save).
    saveSignalsGenRef.current += 1;
    setHasChatConsent(window.localStorage.getItem(consentStorageKey) === "accepted");
    setIsSharingSessions(isSharingEnabled());
    clearSaveSignalsTimer();
    setSaveSignalsStatus("idle");
    setIsOpen(true);
  }

  function closeChat() {
    void sendPendingFeedback(recipeSlug, kind, { retries: 3, retryDelayMs: 15_000 });
    clearShareToastTimeout();
    setShareToast(null);
    setIsOpen(false);
  }

  function toggleSharing() {
    setIsSharingSessions((current) => {
      const next = !current;
      if (next) window.localStorage.removeItem(shareStorageKey);
      else window.localStorage.setItem(shareStorageKey, "opted-out");

      clearShareToastTimeout();
      setShareToast(next ? SHARE_TOAST_ENABLED_MESSAGE : SHARE_TOAST_DISABLED_MESSAGE);
      shareToastTimeoutRef.current = setTimeout(() => setShareToast(null), SHARE_TOAST_DURATION_MS);

      return next;
    });
  }

  // Invia manualmente i messaggi correnti (fino a 40) a POST /api/complete,
  // indipendentemente dal puntatore sentUpto usato dalla logica di chiusura automatica.
  // Disponibile solo quando la condivisione è attiva.
  async function handleSaveSignals() {
    if (!isSharingSessions || saveSignalsStatus === "loading" || messages.length === 0) return;

    clearSaveSignalsTimer();
    setSaveSignalsStatus("loading");

    // Capture generation so that if openChat() is called while this fetch is in-flight, the
    // post-await state/timer mutations below are skipped (stale gen guard — issue #2).
    const gen = saveSignalsGenRef.current;

    // Prende al massimo gli ultimi 40 messaggi, come previsto dal contratto backend.
    const messagesToSend = messages.slice(-MAX_COMPLETE_MESSAGES).map(toRequestMessage);

    // Aggiorna sentUpto PRIMA del fetch (stesso pattern di sendPendingFeedback) così che
    // chiudere/pagehide durante un salvataggio manuale in volo non duplichi i messaggi
    // passando per sendPendingFeedback, che legge sentUpto per calcolare i pending (issue #1).
    const previousSentUpto = parseSentUpto(recipeSlug, kind);
    const expectedSentUpto = messages.length;
    window.localStorage.setItem(sentUptoKey(recipeSlug, kind), String(expectedSentUpto));

    try {
      const response = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: recipeSlug, kind, messages: messagesToSend }),
      });
      const result = await ensureCompleteSucceeded(response);
      // Guard: openChat() bumped the generation while this fetch was in-flight — skip.
      if (saveSignalsGenRef.current !== gen) return;
      setSavedSignalCount(getSavedSignalCount(result));
      setSaveSignalsStatus("done");
      saveSignalsTimerRef.current = setTimeout(() => setSaveSignalsStatus("idle"), 2000);
    } catch {
      // Always restore sentUpto on failure so sendPendingFeedback can retry the pending messages.
      restoreSentUpto(recipeSlug, kind, previousSentUpto, expectedSentUpto);
      // Guard: openChat() bumped the generation while this fetch was in-flight — skip.
      if (saveSignalsGenRef.current !== gen) return;
      setSaveSignalsStatus("error");
      saveSignalsTimerRef.current = setTimeout(() => setSaveSignalsStatus("idle"), 2500);
    }
  }

  return (
    <>
      <button
        className={`recipe-chat-trigger${isScrolling ? " is-scrolling" : ""}`}
        type="button"
        onClick={openChat}
      >
        🤖
        <MessageCircle size={18} aria-hidden="true" />
        <ChevronRight size={17} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="chat-overlay" role="presentation">
          <button className="chat-backdrop" type="button" aria-label="Chiudi chat" onClick={closeChat} />
          <section className="chat-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-title">
            <header className="chat-heading">
              <div>
                <p className="eyebrow">{kind === "guide" ? "Assistente guida" : "Assistente ricetta"}</p>
                <h2 id="chat-title">Parliamo di {recipeTitle}</h2>
              </div>
              <div className="chat-heading-actions">
                <button
                  className={`chat-share-toggle ${isSharingSessions ? "chat-share-toggle-on" : "chat-share-toggle-off"}`}
                  type="button"
                  aria-pressed={isSharingSessions}
                  aria-label={
                    isSharingSessions
                      ? "Condivisione delle sessioni attiva per migliorare le ricette. Clicca per disattivarla."
                      : "Condivisione delle sessioni disattivata. Clicca per attivarla."
                  }
                  title={isSharingSessions ? "Condivisione sessioni: attiva" : "Condivisione sessioni: disattivata"}
                  onClick={toggleSharing}
                >
                  {isSharingSessions ? <ShieldCheck size={18} aria-hidden="true" /> : <ShieldOff size={18} aria-hidden="true" />}
                </button>
                <button className="dialog-close" type="button" aria-label="Chiudi chat" onClick={closeChat}>
                  <X size={19} aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className={`chat-share-toast${shareToast ? " is-visible" : ""}`} role="status" aria-live="polite">
              {shareToast}
            </div>
            {hasChatConsent ? (
              <>
                <div className="chat-messages" aria-live="polite">
                  {messages.length === 0 && <div className="chat-empty"><Bot size={25} aria-hidden="true" /><p>Chiedimi qualcosa su ingredienti, tecnica o sicurezza della ricetta.</p></div>}
                  {messages.map((message) => (
                    <div
                      className={`chat-message chat-message-${message.role}${message.delivery === "failed" ? " chat-message-failed" : ""}`}
                      key={message.id}
                    >
                      <span>{message.role === "user" ? "Tu" : "Danio"}</span>
                      <div className="chat-message-body">
                        {message.role === "assistant"
                          ? (
                            <div className="chat-message-markdown">
                              <MarkdownRenderer content={message.content} variant="chat" />
                            </div>
                          )
                          : <p>{message.content}</p>}
                        {message.role === "user" && message.delivery === "failed" && (
                          <div className="chat-message-failure">
                            <small>{message.errorText ?? "Invio non riuscito."}</small>
                            <button
                              className="chat-message-retry"
                              type="button"
                              onClick={() => void retryMessage(message.id)}
                              disabled={isLoading}
                              aria-label="Ritenta invio messaggio"
                              title="Ritenta invio messaggio"
                            >
                              {retryingMessageId === message.id
                                ? <LoaderCircle className="spin" size={14} aria-hidden="true" />
                                : <RefreshCw size={14} aria-hidden="true" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAwaitingFirstToken && (
                    <div className="chat-message chat-message-assistant">
                      <span>Danio</span>
                      <p className="chat-response-loading">
                        <LoaderCircle className="spin" size={16} aria-hidden="true" />
                        <span>Sto preparando la risposta...</span>
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {error && <p className="chat-error" role="alert">{error}</p>}
                {saveSignalsStatus === "error" && (
                  <p className="chat-error" role="alert">
                    Non è stato possibile salvare la sessione per l&apos;analisi. Riprova.
                  </p>
                )}
                <form className="chat-form" onSubmit={submitMessage}>
                  <label className="sr-only" htmlFor="chat-input">La tua domanda</label>
                  <textarea id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Scrivi una domanda..." rows={2} disabled={isLoading} />
                  <div className="chat-form-actions">
                    {isSharingSessions && (
                      <>
                        <button
                          type="button"
                          className="chat-save-trigger"
                          data-save-status={saveSignalsStatus}
                          onClick={() => void handleSaveSignals()}
                          disabled={saveSignalsStatus === "loading" || messages.length === 0}
                          aria-label={
                            saveSignalsStatus === "loading"
                              ? "Salvataggio della sessione per l'analisi in corso"
                              : saveSignalsStatus === "done"
                                ? `${savedSignalCount} ${savedSignalCount === 1 ? "segnale salvato" : "segnali salvati"} per l'analisi`
                                : saveSignalsStatus === "error"
                                  ? "Invio della sessione non riuscito. Riprova."
                                  : "Salva sessione per l'analisi"
                          }
                          title={
                            saveSignalsStatus === "error"
                              ? "Invio non riuscito. Riprova."
                              : "Salva sessione per l'analisi"
                          }
                        >
                          {saveSignalsStatus === "loading"
                            ? <LoaderCircle className="spin" size={18} aria-hidden="true" />
                            : saveSignalsStatus === "done"
                              ? <span aria-hidden="true">{savedSignalCount}</span>
                              : saveSignalsStatus === "error"
                                ? <AlertCircle size={18} aria-hidden="true" />
                                : <Database size={18} aria-hidden="true" />}
                        </button>
                        {saveSignalsStatus === "done" && (
                          <span className="sr-only" role="status">
                            {savedSignalCount} {savedSignalCount === 1 ? "segnale salvato" : "segnali salvati"} per l&apos;analisi
                          </span>
                        )}
                      </>
                    )}
                    <button type="submit" aria-label="Invia domanda" disabled={isLoading || !input.trim()}>
                      {isLoading ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="chat-consent">
                <p>Per rispondere, invieremo il tuo messaggio, parte della conversazione recente e il contenuto della ricetta al gateway AI. La cronologia resta salvata nel browser su questo dispositivo finche non trascorrono 10 giorni di inattivita, oppure fino a quando elimini prima i dati del sito.</p>
                <p>Per impostazione predefinita condividiamo anche un estratto delle sessioni chat per individuare le domande a cui le ricette non rispondono ancora e migliorarle. Puoi disattivare questa condivisione in qualsiasi momento dall&apos;icona nell&apos;intestazione della chat.</p>
                <p>Non inserire dati personali, sanitari o riservati. Leggi l&apos;<Link href="/privacy">informativa privacy</Link> prima di continuare.</p>
                <div className="chat-consent-actions">
                  <button className="chat-consent-cancel" type="button" onClick={() => setIsOpen(false)}>Continua senza chat</button>
                  <button className="chat-consent-accept" type="button" onClick={acceptChatConsent}>Accetto e apro la chat</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}