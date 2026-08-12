"use client";

import { Bot, ChevronRight, LoaderCircle, MessageCircle, Send, ShieldCheck, ShieldOff, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, startTransition, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  recipeSlug: string;
  recipeTitle: string;
};

function storageKey(slug: string) {
  return `danio-cooks-chat:${slug}`;
}

function sentUptoKey(slug: string) {
  return `danio-cooks-chat-sent-upto:${slug}`;
}

const consentStorageKey = "danio-cooks-chat-consent-v1";
const shareStorageKey = "danio-cooks-chat-share-v1";

function isSharingEnabled() {
  return window.localStorage.getItem(shareStorageKey) !== "opted-out";
}

function parseStoredMessages(raw: string | null): ChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ChatMessage =>
      Boolean(item) && typeof item === "object" &&
      ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
      typeof (item as ChatMessage).content === "string"
    );
  } catch {
    return [];
  }
}

// Modulo puro: legge sempre lo stato piu recente da localStorage al momento della chiamata,
// cosi da funzionare anche da listener registrati una sola volta (es. pagehide) senza
// dipendere da closure React potenzialmente "congelate" su un render precedente.
function sendPendingFeedback(slug: string) {
  if (!isSharingEnabled()) return;

  const messages = parseStoredMessages(window.localStorage.getItem(storageKey(slug)));
  if (messages.length === 0) return;

  const storedSentUpto = window.localStorage.getItem(sentUptoKey(slug));
  const parsedSentUpto = storedSentUpto ? Number.parseInt(storedSentUpto, 10) : 0;
  const lastSentIndex = Number.isFinite(parsedSentUpto) && parsedSentUpto > 0 ? parsedSentUpto : 0;

  const pending = messages.slice(lastSentIndex);
  if (pending.length === 0) return;

  // Ottimistico: avanziamo il puntatore PRIMA di inviare, perche' alla chiusura reale della
  // pagina il codice potrebbe non sopravvivere per farlo dopo una risposta attesa.
  window.localStorage.setItem(sentUptoKey(slug), String(messages.length));

  fetch("/api/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, messages: pending }),
    keepalive: true,
  }).catch(() => {});
}

function getDelta(payload: string) {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.delta === "string") return parsed.delta;
    if (parsed.delta && typeof parsed.delta === "object") {
      const delta = parsed.delta as Record<string, unknown>;
      if (typeof delta.text === "string") return delta.text;
      if (typeof delta.content === "string") return delta.content;
    }
    return "";
  } catch {
    return payload;
  }
}

export function ChatPanel({ recipeSlug, recipeTitle }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChatConsent, setHasChatConsent] = useState(false);
  const [isSharingSessions, setIsSharingSessions] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePageHide = () => sendPendingFeedback(recipeSlug);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      // Copre anche la navigazione SPA verso un'altra ricetta e lo smontaggio del componente.
      sendPendingFeedback(recipeSlug);
    };
  }, [recipeSlug]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(recipeSlug));
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) {
        const savedMessages = parsed.filter((item): item is ChatMessage =>
          Boolean(item) && typeof item === "object" &&
          ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
          typeof (item as ChatMessage).content === "string"
        );
        startTransition(() => setMessages(savedMessages));
      }
    } catch {
      window.localStorage.removeItem(storageKey(recipeSlug));
    }
  }, [recipeSlug]);

  useEffect(() => {
    if (messages.length > 0) window.localStorage.setItem(storageKey(recipeSlug), JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, recipeSlug]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setError(null);
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: recipeSlug, message: userMessage, history: messages }),
      });
      if (!response.ok || !response.body) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Risposta chat non disponibile.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setMessages([...nextMessages, { role: "assistant", content: "" }]);

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
          const delta = getDelta(data);
          if (!delta) continue;
          assistantText += delta;
          setMessages([...nextMessages, { role: "assistant", content: assistantText }]);
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
      setMessages(nextMessages);
      setError(caught instanceof Error ? caught.message : "Errore durante la richiesta.");
    } finally {
      setIsLoading(false);
    }
  }

  function acceptChatConsent() {
    window.localStorage.setItem(consentStorageKey, "accepted");
    setHasChatConsent(true);
  }

  function openChat() {
    setHasChatConsent(window.localStorage.getItem(consentStorageKey) === "accepted");
    setIsSharingSessions(isSharingEnabled());
    setIsOpen(true);
  }

  function closeChat() {
    sendPendingFeedback(recipeSlug);
    setIsOpen(false);
  }

  function toggleSharing() {
    setIsSharingSessions((current) => {
      const next = !current;
      if (next) window.localStorage.removeItem(shareStorageKey);
      else window.localStorage.setItem(shareStorageKey, "opted-out");
      return next;
    });
  }

  return (
    <>
      <button className="recipe-chat-trigger" type="button" onClick={openChat}>
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
                <p className="eyebrow">Assistente ricetta</p>
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
            {hasChatConsent ? (
              <>
                <div className="chat-messages" aria-live="polite">
                  {messages.length === 0 && <div className="chat-empty"><Bot size={25} aria-hidden="true" /><p>Chiedimi qualcosa su ingredienti, tecnica o sicurezza della ricetta.</p></div>}
                  {messages.map((message, index) => (
                    <div className={`chat-message chat-message-${message.role}`} key={`${message.role}-${index}`}>
                      <span>{message.role === "user" ? "Tu" : "Danio"}</span>
                      <p>{message.content || (isLoading ? "Sto preparando la risposta..." : "")}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {error && <p className="chat-error" role="alert">{error}</p>}
                <form className="chat-form" onSubmit={submitMessage}>
                  <label className="sr-only" htmlFor="chat-input">La tua domanda</label>
                  <textarea id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Scrivi una domanda..." rows={2} disabled={isLoading} />
                  <button type="submit" aria-label="Invia domanda" disabled={isLoading || !input.trim()}>
                    {isLoading ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-consent">
                <p>Per rispondere, invieremo il tuo messaggio, parte della conversazione recente e il contenuto della ricetta al gateway AI. La cronologia resta salvata nel browser su questo dispositivo finche non elimini i dati del sito.</p>
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