"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Sparkles, User, Bot, RotateCcw, Loader2 } from "lucide-react";
import { ModuleHeader, GlassCard, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string; fallback?: boolean };

const SUGGESTED_PROMPTS = [
  "Summarize this customer's profile and suggest a product to pitch.",
  "What's the next best action for this customer?",
  "Which loan product is best suited, and at what rate?",
  "Are there any compliance flags I should be aware of?",
  "Recommend a government scheme for this customer.",
];

export function RmChat() {
  const [customerId, setCustomerId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        customerId: customerId || undefined,
        history: next.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
      }),
    })
      .then(r => r.json())
      .then(d => {
        setMessages(prev => [...prev, { role: "assistant", content: d.reply, fallback: d.fallback }]);
        setLoading(false);
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: "assistant", content: "Connection failed. Please retry.", fallback: true }]);
        setLoading(false);
      });
  }

  function reset() {
    setMessages([]);
    setInput("");
  }

  return (
    <div>
      <ModuleHeader
        title="Relationship Manager Chat"
        desc="LLM copilot with customer context & policy awareness"
        icon={MessageSquare}
      />

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Side panel */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="p-4">
            <CustomerPicker value={customerId} onChange={(id) => { setCustomerId(id); setMessages([]); }} label="Customer Context" />
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Try asking</div>
              <div className="space-y-1.5">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p)}
                    className="block w-full text-left text-[11px] p-2 rounded-lg bg-muted/30 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={reset} className="w-full">
              <RotateCcw className="h-3 w-3 mr-1.5" /> Reset conversation
            </Button>
          )}
        </div>

        {/* Chat window */}
        <GlassCard className="lg:col-span-3 p-0 flex flex-col h-[600px]">
          {!customerId && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageSquare} message="Optional: select a customer for context-aware advice, or just start chatting" />
            </div>
          )}

          {customerId && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={Sparkles} message="Start the conversation — try one of the suggested prompts" />
            </div>
          )}

          {messages.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    m.role === "user" ? "bg-primary/20" : m.fallback ? "bg-amber-500/20" : "bg-primary/15"
                  )}>
                    {m.role === "user"
                      ? <User className="h-4 w-4 text-primary" />
                      : m.fallback
                        ? <Bot className="h-4 w-4 text-amber-600" />
                        : <Bot className="h-4 w-4 text-primary" />}
                  </div>
                  <div className={cn("max-w-[80%] p-3 rounded-xl text-xs leading-relaxed",
                    m.role === "user" ? "bg-primary/15 text-foreground whitespace-pre-wrap" : m.fallback ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/30 border border-border/40"
                  )}>
                    {m.fallback && (
                      <div className="text-[9px] uppercase tracking-wider text-amber-600 mb-1.5">Fallback response (LLM unavailable)</div>
                    )}
                    {m.role === "assistant"
                      ? <Markdown className="text-xs">{m.content}</Markdown>
                      : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/30 border border-border/40 p-3 rounded-xl flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border/60 p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
              className="flex-1 bg-card/60 border border-border/60 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/60"
            />
            <Button size="sm" onClick={() => send()} disabled={loading || !input.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
