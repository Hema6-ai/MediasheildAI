"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronDown } from "lucide-react";
import { queryRAG } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  snippets?: string[];
  sources?: number;
}

const SUGGESTED = [
  "Which platform has the most violations?",
  "What is the total estimated revenue loss?",
  "How many high-risk detections are there?",
  "Summarize the most recent detections.",
];

export function InsightChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm MediaShield AI. Ask me anything about your detection data — platforms, revenue loss, risk levels, or specific media IDs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await queryRAG(question);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.answer,
          snippets: res.context_snippets,
          sources: res.sources,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Error contacting backend. Is it running?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              m.role === "assistant" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
            }`}>
              {m.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "assistant"
                  ? "glass border border-white/8 text-slate-200"
                  : "bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 text-white"
              }`}>
                {m.content}
              </div>
              {m.snippets && m.snippets.length > 0 && (
                <details className="text-xs text-slate-500 cursor-pointer">
                  <summary className="hover:text-slate-400 transition-colors">
                    {m.sources} context snippets retrieved
                  </summary>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {m.snippets.map((s, si) => (
                      <p key={si} className="text-slate-600 bg-white/3 rounded px-2 py-1 font-mono text-xs">{s}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/20 text-cyan-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass border border-white/8 px-4 py-3 rounded-2xl">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-4 pb-2 flex flex-wrap gap-2">
        {SUGGESTED.map((q) => (
          <button key={q} onClick={() => send(q)}
            className="text-xs px-3 py-1 rounded-full border border-white/8 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about violations, platforms, revenue loss..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
