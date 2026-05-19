"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChatInput } from "@/components/dashboard/chat-input";
import { MessageList } from "@/components/dashboard/message-list";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import type { Message } from "@/components/dashboard/shared";
import type { ModelId, Effort } from "@/lib/agent";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { conversations, setConversations } = useDashboard();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [model, setModel] = useState<ModelId>((searchParams.get("model") as ModelId) ?? "deepseek-v4-flash");
  const [effort, setEffort] = useState<Effort>((searchParams.get("effort") as Effort) ?? "medium");
  const initialized = useRef(false);

  // Load messages from context or kick off first message from URL param
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const firstMsg = searchParams.get("first");
    const conv = conversations.find(c => c.id === id);

    if (firstMsg) {
      // Coming from new chat page — send first message
      sendMessage(firstMsg, []);
    } else if (conv && conv.messages.length > 0) {
      setMessages(conv.messages);
    } else {
      // Load from API
      fetch(`/api/conversations/${id}/messages`).then(r => r.ok ? r.json() : []).then((msgs: Array<{ role: string; content: string }>) => {
        setMessages(msgs.map((m, i) => ({ id: i, role: m.role as "user" | "assistant", text: m.content })));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, conversations]);

  async function sendMessage(text: string, history?: Message[]) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const baseHistory = history ?? messages;
    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    const assistantId = Date.now() + 1;
    const nextHistory = [...baseHistory, userMsg];

    setMessages([...nextHistory, { id: assistantId, role: "assistant", text: "" }]);
    setInput("");
    setThinking(true);

    // Save user message (skip if this is the first message, already saved by new chat page)
    if (history === undefined) {
      fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "user", content: trimmed }),
      });
    }

    let finalText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, text: m.text })),
          model,
          effort,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`chat http ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let first = true;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (first && acc.length > 0) { setThinking(false); first = false; }
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: acc } : m));
      }
      finalText = acc;
      setThinking(false);
    } catch (err) {
      console.error(err);
      finalText = "Sorry, something went wrong.";
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: finalText } : m));
      setThinking(false);
    }

    const finalMessages = [...nextHistory, { id: assistantId, role: "assistant" as const, text: finalText }];

    // Save assistant message
    fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "assistant", content: finalText }),
    });

    // Update conversations in context
    setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: finalMessages } : c));

    // Generate title on first exchange (when coming from new chat)
    if (history !== undefined) {
      fetch(`/api/conversations/${id}/title`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userMessage: trimmed, assistantMessage: finalText }),
      }).then(r => r.json()).then(({ title }) => {
        if (title) setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
      });
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList messages={messages} thinking={thinking} />
      </div>
      <div className="shrink-0 relative">
        <div className="absolute bottom-full left-0 right-0 h-16 pointer-events-none" style={{ background: "linear-gradient(to top, white, transparent)" }} />
        <div className="px-4 pb-3 pt-2">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={sendMessage}
              toolbar={<ChatControls model={model} effort={effort} onModelChange={setModel} onEffortChange={setEffort} upward={true} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
