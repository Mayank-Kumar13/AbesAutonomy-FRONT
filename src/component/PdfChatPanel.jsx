import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Trash2, Lock } from "lucide-react";
import { aiApi } from "../services/api";
import PremiumUpgradeModal from "./premium/PremiumUpgradeModal";

const GOLD = "#d9a441";
const SUGGESTIONS = [
  "Summarize this PDF",
  "What are the most important topics?",
  "Explain the main concept in simple words",
  "Give me 5 exam questions from this",
];

// ─── tiny, safe markdown renderer (bold, `code`, bullet/numbered lists) ───
const renderInline = (text) =>
  text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="pdfchat-code">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

function RichText({ text }) {
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) blocks.push(list);
    list = null;
  };
  text.split("\n").forEach((line, i) => {
    const m = line.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
    if (m) {
      const ordered = /\d/.test(m[1]);
      if (!list || list.ordered !== ordered) {
        flush();
        list = { type: "list", ordered, items: [], key: `l${i}` };
      }
      list.items.push(m[2]);
    } else if (line.trim()) {
      flush();
      blocks.push({ type: "p", text: line, key: `p${i}` });
    } else {
      flush();
    }
  });
  flush();

  return blocks.map((b) =>
    b.type === "p" ? (
      <p key={b.key} className="pdfchat-p">
        {renderInline(b.text)}
      </p>
    ) : b.ordered ? (
      <ol key={b.key} className="pdfchat-list">
        {b.items.map((it, j) => (
          <li key={j}>{renderInline(it)}</li>
        ))}
      </ol>
    ) : (
      <ul key={b.key} className="pdfchat-list">
        {b.items.map((it, j) => (
          <li key={j}>{renderInline(it)}</li>
        ))}
      </ul>
    )
  );
}

/**
 * AI assistant for the PDF that is currently open. Answers come from that PDF only (enforced
 * server-side). Renders a launcher button; opens a floating chat window.
 */
export default function PdfChatPanel({ noteId, title }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | no_text | premium | unavailable | error
  const [statusMsg, setStatusMsg] = useState("");
  const [messages, setMessages] = useState([]); // {role, content, pages?, error?, retryText?}
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const activeNote = useRef(noteId);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // New document → fresh conversation
  useEffect(() => {
    activeNote.current = noteId;
    setMessages([]);
    setStatus("idle");
    setStatusMsg("");
    setRemaining(null);
  }, [noteId]);

  const applyApiError = useCallback((err) => {
    const code = err?.data?.code;
    if (code === "NO_TEXT_LAYER") return ["no_text", err.message];
    if (err?.status === 403) return ["premium", err.message];
    if (code === "AI_NOT_CONFIGURED" || err?.status === 413 || err?.status === 422)
      return ["unavailable", err.message];
    return ["error", err?.message || "Something went wrong."];
  }, []);

  const loadStatus = useCallback(async () => {
    const forNote = noteId;
    setStatus("loading");
    try {
      await aiApi.pdfChatStatus(forNote);
      if (activeNote.current !== forNote) return;
      setStatus("ready");
    } catch (err) {
      if (activeNote.current !== forNote) return;
      const [s, msg] = applyApiError(err);
      setStatus(s);
      setStatusMsg(msg);
    }
  }, [noteId, applyApiError]);

  // First time the panel is opened for this document: warm the server-side text cache
  useEffect(() => {
    if (open && status === "idle") loadStatus();
  }, [open, status, loadStatus]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    if (open && status === "ready") inputRef.current?.focus();
  }, [open, status]);

  const send = useCallback(
    async (rawText, { retry = false } = {}) => {
      const text = (rawText ?? input).trim();
      if (!text || sending || status !== "ready") return;

      const forNote = noteId;
      // Drop old error bubbles; when retrying, also drop the failed question so it isn't duplicated.
      let base = messages.filter((m) => !m.error);
      if (retry && base.length && base[base.length - 1].role === "user") base = base.slice(0, -1);
      const history = base.slice(-6).map((m) => ({ role: m.role, content: m.content }));

      setMessages([...base, { role: "user", content: text }]);
      setInput("");
      setSending(true);

      try {
        const res = await aiApi.pdfChat({ noteId: forNote, message: text, history });
        if (activeNote.current !== forNote) return;
        const d = res?.data || {};
        setMessages((prev) => [...prev, { role: "assistant", content: d.reply || "", pages: d.pages || [] }]);
        if (typeof d.remainingToday === "number") setRemaining(d.remainingToday);
      } catch (err) {
        if (activeNote.current !== forNote) return;
        const [s, msg] = applyApiError(err);
        if (s === "premium" || s === "no_text" || s === "unavailable") {
          setStatus(s);
          setStatusMsg(msg);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", error: true, content: msg, retryText: text }]);
        }
      } finally {
        if (activeNote.current === forNote) setSending(false);
      }
    },
    [input, sending, status, noteId, messages, applyApiError]
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {!open && (
        <button className="pdfchat-launcher" onClick={() => setOpen(true)} aria-label="Ask AI about this PDF">
          <Sparkles size={18} />
          <span>Ask AI</span>
        </button>
      )}

      {open && (
        <div className="pdfchat-panel" role="dialog" aria-label="AI assistant for this PDF">
          <div className="pdfchat-header">
            <div className="pdfchat-title">
              <Sparkles size={16} color={GOLD} />
              <div style={{ minWidth: 0 }}>
                <div className="pdfchat-title-main">Ask this PDF</div>
                <div className="pdfchat-title-sub" title={title}>
                  {title || "Current document"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {messages.length > 0 && (
                <button className="pdfchat-icon-btn" onClick={() => setMessages([])} title="Clear chat" aria-label="Clear chat">
                  <Trash2 size={16} />
                </button>
              )}
              <button className="pdfchat-icon-btn" onClick={() => setOpen(false)} title="Close" aria-label="Close chat">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="pdfchat-body">
            {status === "loading" && <div className="pdfchat-note">📖 Reading the document…</div>}

            {status === "premium" && (
              <div className="pdfchat-center">
                <Lock size={30} color={GOLD} />
                <p>{statusMsg || "AI chat is a Premium feature."}</p>
                <button className="pdfchat-primary" onClick={() => setShowUpgrade(true)}>
                  Upgrade to Premium
                </button>
              </div>
            )}

            {status === "no_text" && (
              <div className="pdfchat-center">
                <div style={{ fontSize: 30 }}>🖼️</div>
                <p>{statusMsg}</p>
              </div>
            )}

            {status === "unavailable" && (
              <div className="pdfchat-center">
                <div style={{ fontSize: 30 }}>🛠️</div>
                <p>{statusMsg || "The AI assistant is not available right now."}</p>
              </div>
            )}

            {status === "error" && (
              <div className="pdfchat-center">
                <p>{statusMsg}</p>
                <button className="pdfchat-primary" onClick={loadStatus}>
                  Try again
                </button>
              </div>
            )}

            {status === "ready" && messages.length === 0 && (
              <div className="pdfchat-empty">
                <p className="pdfchat-hint">
                  I answer using only this PDF. Ask me about anything in it.
                </p>
                <div className="pdfchat-chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="pdfchat-chip" onClick={() => send(s)} disabled={sending}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`pdfchat-msg ${m.role === "user" ? "user" : "ai"}${m.error ? " err" : ""}`}>
                {m.role === "user" ? (
                  m.content
                ) : (
                  <>
                    <RichText text={m.content} />
                    {m.pages?.length > 0 && (
                      <div className="pdfchat-sources">Pages: {m.pages.join(", ")}</div>
                    )}
                    {m.error && m.retryText && (
                      <button className="pdfchat-retry" onClick={() => send(m.retryText, { retry: true })} disabled={sending}>
                        Retry
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}

            {sending && (
              <div className="pdfchat-msg ai">
                <span className="pdfchat-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {status === "ready" && (
            <div className="pdfchat-footer">
              <div className="pdfchat-inputrow">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask a question about this PDF…"
                  rows={1}
                  maxLength={1000}
                  disabled={sending}
                />
                <button
                  className="pdfchat-send"
                  onClick={() => send()}
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="pdfchat-disclaimer">
                AI can make mistakes — check important points in the PDF.
                {remaining !== null && ` ${remaining} question${remaining === 1 ? "" : "s"} left today.`}
              </div>
            </div>
          )}
        </div>
      )}

      <PremiumUpgradeModal
        isOpen={showUpgrade}
        message="Upgrade to Premium to chat with your PDFs using AI."
        onClose={() => setShowUpgrade(false)}
        onSuccess={() => {
          setShowUpgrade(false);
          window.location.reload();
        }}
      />

      <style>{`
        .pdfchat-launcher {
          position: fixed; right: 28px; bottom: 100px; z-index: 9000;
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px; cursor: pointer;
          background: rgba(14, 16, 22, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          color: #F5F5F7;
          font-family: var(--font-family-sans, -apple-system, sans-serif);
          font-weight: 600; font-size: 13.5px;
          box-shadow: 0 12px 30px -4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: all 0.2s var(--ease-apple, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .pdfchat-launcher:hover { 
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.28);
          background: rgba(22, 25, 34, 0.92);
          box-shadow: 0 16px 36px -4px rgba(0,0,0,0.8), 0 0 20px rgba(197, 172, 134, 0.2);
        }
        .pdfchat-panel {
          position: fixed; right: 20px; bottom: 20px; z-index: 10001;
          width: 410px; max-width: calc(100vw - 32px);
          height: min(620px, calc(100vh - 120px));
          display: flex; flex-direction: column; overflow: hidden;
          background: rgba(14, 17, 24, 0.92);
          backdrop-filter: blur(36px) saturate(180%);
          -webkit-backdrop-filter: blur(36px) saturate(180%);
          color: #F5F5F7;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 22px;
          box-shadow: 0 28px 65px -10px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.18);
          font-family: var(--font-family-sans, -apple-system, sans-serif);
        }
        .pdfchat-header {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 14px 18px; background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0;
        }
        .pdfchat-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .pdfchat-title-main { font-weight: 650; font-size: 14.5px; color: #FFFFFF; }
        .pdfchat-title-sub {
          font-size: 11.5px; color: #86868B; max-width: 220px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pdfchat-icon-btn {
          background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06);
          color: #86868B; cursor: pointer; padding: 6px; border-radius: 8px; display: flex;
          transition: all 0.15s ease;
        }
        .pdfchat-icon-btn:hover { background: rgba(255, 255, 255, 0.10); color: #FFFFFF; }
        .pdfchat-body {
          flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin;
        }
        .pdfchat-note { color: #86868B; font-size: 13px; text-align: center; margin: auto; }
        .pdfchat-center {
          margin: auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
          color: #A1A1A6; font-size: 13.5px; line-height: 1.55; padding: 0 12px;
        }
        .pdfchat-center p { margin: 0; }
        .pdfchat-primary {
          background: #F5F5F7; color: #0A0C10;
          border: 1px solid rgba(255, 255, 255, 0.85); border-radius: 9999px;
          padding: 8px 20px; font-weight: 600; cursor: pointer; font-size: 13.5px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
        }
        .pdfchat-primary:hover { transform: translateY(-1px); background: #FFFFFF; }
        .pdfchat-empty { margin: auto 0; }
        .pdfchat-hint { color: #86868B; font-size: 13px; text-align: center; margin: 0 0 16px; }
        .pdfchat-chips { display: flex; flex-direction: column; gap: 8px; }
        .pdfchat-chip {
          text-align: left; background: rgba(255, 255, 255, 0.03); color: #F5F5F7;
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;
          padding: 10px 14px; font-size: 13px; cursor: pointer;
          transition: all 0.15s ease;
        }
        .pdfchat-chip:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }
        .pdfchat-msg {
          max-width: 90%; padding: 11px 14px; border-radius: 16px; font-size: 13.5px; line-height: 1.55;
          word-wrap: break-word; overflow-wrap: anywhere;
        }
        .pdfchat-msg.user {
          align-self: flex-end; background: #F5F5F7; color: #0A0C10;
          white-space: pre-wrap; border-bottom-right-radius: 4px; font-weight: 500;
        }
        .pdfchat-msg.ai {
          align-self: flex-start; background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08); border-bottom-left-radius: 4px;
        }
        .pdfchat-msg.err { border-color: rgba(255, 69, 58, 0.4); background: rgba(255, 69, 58, 0.08); color: #FF453A; }
        .pdfchat-p { margin: 0 0 6px; }
        .pdfchat-p:last-child { margin-bottom: 0; }
        .pdfchat-list { margin: 4px 0 6px; padding-left: 20px; }
        .pdfchat-list li { margin-bottom: 3px; }
        .pdfchat-code { background: rgba(0, 0, 0, 0.4); padding: 1px 5px; border-radius: 4px; font-size: 12.5px; font-family: var(--font-family-mono); }
        .pdfchat-sources { margin-top: 8px; font-size: 11px; color: #86868B; }
        .pdfchat-retry {
          margin-top: 8px; background: transparent; color: #FF453A; border: 1px solid rgba(255, 69, 58, 0.3);
          border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 12px;
        }
        .pdfchat-footer {
          padding: 12px 14px 10px; background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0;
        }
        .pdfchat-inputrow { display: flex; gap: 8px; align-items: flex-end; }
        .pdfchat-inputrow textarea {
          flex: 1; resize: none; max-height: 96px; background: rgba(255, 255, 255, 0.04); color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; padding: 10px 12px;
          font-size: 13.5px; font-family: inherit; outline: none; transition: border-color 0.15s ease;
        }
        .pdfchat-inputrow textarea:focus { border-color: rgba(255, 255, 255, 0.28); }
        .pdfchat-send {
          background: #F5F5F7; color: #0A0C10; border: none; border-radius: 12px;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
          transition: transform 0.15s ease;
        }
        .pdfchat-send:hover:not(:disabled) { transform: scale(1.04); background: #FFFFFF; }
        .pdfchat-send:disabled { opacity: .35; cursor: not-allowed; }
        .pdfchat-disclaimer { margin-top: 8px; font-size: 11px; color: #6E6E73; text-align: center; }
        .pdfchat-dots { display: inline-flex; gap: 4px; padding: 4px 2px; }
        .pdfchat-dots i {
          width: 6px; height: 6px; border-radius: 50%; background: #86868B; display: block;
          animation: pdfchat-bounce 1.2s infinite ease-in-out;
        }
        .pdfchat-dots i:nth-child(2) { animation-delay: .15s; }
        .pdfchat-dots i:nth-child(3) { animation-delay: .3s; }
        @keyframes pdfchat-bounce { 0%, 80%, 100% { transform: scale(.6); opacity: .5; } 40% { transform: scale(1); opacity: 1; } }
        @media (max-width: 640px) {
          .pdfchat-launcher { right: 16px; bottom: 84px; padding: 9px 14px; font-size: 13px; }
          .pdfchat-panel {
            left: 0; right: 0; bottom: 0; width: 100%; max-width: 100%;
            height: 82vh; height: 82dvh; border-radius: 20px 20px 0 0;
          }
          .pdfchat-title-sub { max-width: 50vw; }
          .pdfchat-inputrow textarea { font-size: 16px; }
        }
      `}</style>
    </>
  );
}