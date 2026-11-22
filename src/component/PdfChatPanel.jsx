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
          position: fixed; right: 16px; bottom: 20px; z-index: 9000;
          display: flex; align-items: center; gap: 8px;
          padding: 11px 18px; border: none; border-radius: 999px; cursor: pointer;
          background: linear-gradient(135deg, #d9a441 0%, #b8860b 100%); color: #0b0d10;
          font-weight: 700; font-size: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 0 18px rgba(217,164,65,0.35);
          transition: transform .15s ease;
        }
        .pdfchat-launcher:hover { transform: translateY(-2px); }
        .pdfchat-panel {
          position: fixed; right: 16px; bottom: 16px; z-index: 9000;
          width: 400px; max-width: calc(100vw - 32px);
          height: min(620px, calc(100vh - 120px));
          display: flex; flex-direction: column; overflow: hidden;
          background: #0d131f; color: #e2e8f0;
          border: 1px solid #263244; border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.75);
        }
        .pdfchat-header {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 12px 14px; background: #11161d; border-bottom: 1px solid #1f2a3a; flex-shrink: 0;
        }
        .pdfchat-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .pdfchat-title-main { font-weight: 700; font-size: 14px; color: #f8fafc; }
        .pdfchat-title-sub {
          font-size: 11px; color: #94a3b8; max-width: 220px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pdfchat-icon-btn {
          background: transparent; border: none; color: #94a3b8; cursor: pointer;
          padding: 6px; border-radius: 8px; display: flex;
        }
        .pdfchat-icon-btn:hover { background: #1a2332; color: #f8fafc; }
        .pdfchat-body {
          flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
          scrollbar-width: thin;
        }
        .pdfchat-note { color: #94a3b8; font-size: 13px; text-align: center; margin: auto; }
        .pdfchat-center {
          margin: auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
          color: #cbd5e1; font-size: 13px; line-height: 1.55; padding: 0 8px;
        }
        .pdfchat-center p { margin: 0; }
        .pdfchat-primary {
          background: linear-gradient(135deg, #d9a441 0%, #b8860b 100%); color: #0b0d10;
          border: none; border-radius: 8px; padding: 9px 18px; font-weight: 700; cursor: pointer;
        }
        .pdfchat-empty { margin: auto 0; }
        .pdfchat-hint { color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 14px; }
        .pdfchat-chips { display: flex; flex-direction: column; gap: 8px; }
        .pdfchat-chip {
          text-align: left; background: #131b29; color: #e2e8f0; border: 1px solid #263244;
          border-radius: 10px; padding: 9px 12px; font-size: 13px; cursor: pointer;
        }
        .pdfchat-chip:hover:not(:disabled) { border-color: #d9a441; }
        .pdfchat-msg {
          max-width: 92%; padding: 9px 12px; border-radius: 12px; font-size: 13.5px; line-height: 1.55;
          word-wrap: break-word; overflow-wrap: anywhere;
        }
        .pdfchat-msg.user { align-self: flex-end; background: #d9a441; color: #0b0d10; white-space: pre-wrap; border-bottom-right-radius: 4px; }
        .pdfchat-msg.ai { align-self: flex-start; background: #161e2d; border: 1px solid #222d3f; border-bottom-left-radius: 4px; }
        .pdfchat-msg.err { border-color: #7f1d1d; background: #1f1215; color: #fecaca; }
        .pdfchat-p { margin: 0 0 6px; }
        .pdfchat-p:last-child { margin-bottom: 0; }
        .pdfchat-list { margin: 4px 0 6px; padding-left: 20px; }
        .pdfchat-list li { margin-bottom: 3px; }
        .pdfchat-code { background: #0a0f18; padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
        .pdfchat-sources { margin-top: 8px; font-size: 11px; color: #94a3b8; }
        .pdfchat-retry {
          margin-top: 8px; background: transparent; color: #fecaca; border: 1px solid #7f1d1d;
          border-radius: 6px; padding: 4px 12px; cursor: pointer; font-size: 12px;
        }
        .pdfchat-footer { padding: 10px 12px 8px; background: #11161d; border-top: 1px solid #1f2a3a; flex-shrink: 0; }
        .pdfchat-inputrow { display: flex; gap: 8px; align-items: flex-end; }
        .pdfchat-inputrow textarea {
          flex: 1; resize: none; max-height: 96px; background: #0a0f18; color: #e2e8f0;
          border: 1px solid #263244; border-radius: 10px; padding: 9px 11px; font-size: 14px; font-family: inherit; outline: none;
        }
        .pdfchat-inputrow textarea:focus { border-color: #d9a441; }
        .pdfchat-send {
          background: #d9a441; color: #0b0d10; border: none; border-radius: 10px;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .pdfchat-send:disabled { opacity: .4; cursor: not-allowed; }
        .pdfchat-disclaimer { margin-top: 6px; font-size: 10.5px; color: #64748b; text-align: center; }
        .pdfchat-dots { display: inline-flex; gap: 4px; padding: 4px 2px; }
        .pdfchat-dots i {
          width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; display: block;
          animation: pdfchat-bounce 1.2s infinite ease-in-out;
        }
        .pdfchat-dots i:nth-child(2) { animation-delay: .15s; }
        .pdfchat-dots i:nth-child(3) { animation-delay: .3s; }
        @keyframes pdfchat-bounce { 0%, 80%, 100% { transform: scale(.6); opacity: .5; } 40% { transform: scale(1); opacity: 1; } }
        @media (max-width: 640px) {
          .pdfchat-launcher { right: 12px; bottom: 14px; padding: 10px 16px; }
          .pdfchat-panel {
            left: 0; right: 0; bottom: 0; width: 100%; max-width: 100%;
            height: 82vh; height: 82dvh; border-radius: 16px 16px 0 0;
          }
          .pdfchat-title-sub { max-width: 52vw; }
          .pdfchat-inputrow textarea { font-size: 16px; } /* prevents iOS zoom-on-focus */
        }
      `}</style>
    </>
  );
}
