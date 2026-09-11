"use client";

import { useState, useRef, useEffect } from "react";
import type { Action } from "@/lib/schema";

interface ChatMessage {
  role: "user" | "copilot";
  text: string;
}

const QUICK_PROMPTS = [
  "What's the biggest risk here?",
  "Suggest immediate actions",
  "Who should I contact first?",
  "What's the severity rationale?",
  "Any related incidents?",
  "Summarize in 1 sentence",
];

export function CoPilotChat({ action }: { action: Action }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "copilot",
      text: `HERALD Co-Pilot online. I can see the "${action.scenario}" incident. Ask me anything about it.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, incident: action }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "copilot", text: data.reply ?? "No response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "copilot", text: "Connection issue — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="copilot-chat">
      <div className="copilot-header">
        <span className="copilot-icon">🤖</span>
        <span>HERALD Co-Pilot</span>
        <span className="copilot-badge">AI</span>
      </div>

      <div className="copilot-messages">
        {messages.map((m, i) => (
          <div className={`cp-msg ${m.role}`} key={i}>
            <div className="cp-bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="cp-msg copilot">
            <div className="cp-bubble cp-typing">
              <span className="dot-anim" />
              <span className="dot-anim" />
              <span className="dot-anim" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="copilot-quick">
        {QUICK_PROMPTS.map((p) => (
          <button key={p} className="quick-prompt" onClick={() => send(p)} disabled={loading}>
            {p}
          </button>
        ))}
      </div>

      <form
        className="copilot-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this incident…"
          disabled={loading}
          maxLength={2000}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          ↑
        </button>
      </form>
    </div>
  );
}
