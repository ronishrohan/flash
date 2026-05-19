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
  const titleGenerated = useRef(false);
  const isOptimistic = searchParams.get("optimistic") === "1";

  // Resolve the real conv ID (may start as temp_xxx until DB responds)
  const realConvId = useRef<string>(id);
  useEffect(() => {
    // Once the temp entry is swapped to a real UUID in context, update our ref
    const conv = conversations.find(c => c.id === id);
    if (!conv && !id.startsWith("temp_")) {
      realConvId.current = id;
    } else if (conv) {
      realConvId.current = conv.id;
    }
  }, [conversations, id]);

  // Wait for temp ID to resolve to real UUID
  function waitForRealId(): Promise<string> {
    return new Promise(resolve => {
      if (!realConvId.current.startsWith("temp_")) { resolve(realConvId.current); return; }
      const interval = setInterval(() => {
        if (!realConvId.current.startsWith("temp_")) {
          clearInterval(interval);
          resolve(realConvId.current);
        }
      }, 100);
    });
  }

  // Load messages or kick off first message
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const firstMsg = searchParams.get("first");
    const conv = conversations.find(c => c.id === id);

    if (firstMsg) {
      sendMessage(firstMsg, []);
    } else if (conv && conv.messages.length > 0) {
      setMessages(conv.messages);
    } else if (!id.startsWith("temp_")) {
      fetch(`/api/conversations/${id}/messages`)
        .then(r => r.ok ? r.json() : [])
        .then((msgs: Array<{ role: string; content: string }>) => {
          setMessages(msgs.map((m, i) => ({ id: i, role: m.role as "user" | "assistant", text: m.content })));
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Discard conversation if user leaves before title is generated
  useEffect(() => {
    if (!isOptimistic) return;
    return () => {
      if (!titleGenerated.current) {
        setConversations(prev => prev.filter(c => c.id !== realConvId.current && c.id !== id));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // For follow-up messages, save user message (first msg already saved by new chat page)
    const isFirstMessage = history !== undefined;
    if (!isFirstMessage) {
      waitForRealId().then(cid => {
        fetch(`/api/conversations/${cid}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role: "user", content: trimmed }),
        });
      });
    }

    // Stream response
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
    setConversations(prev => prev.map(c =>
      (c.id === id || c.id === realConvId.current) ? { ...c, messages: finalMessages } : c
    ));

    // Save assistant message
    waitForRealId().then(cid => {
      fetch(`/api/conversations/${cid}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "assistant", content: finalText }),
      });
    });

    // Generate title on first exchange
    if (isFirstMessage) {
      waitForRealId().then(cid => {
        fetch(`/api/conversations/${cid}/title`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userMessage: trimmed, assistantMessage: finalText }),
        }).then(r => r.json()).then(({ title }) => {
          if (title) {
            titleGenerated.current = true;
            setConversations(prev => prev.map(c =>
              (c.id === cid || c.id === id) ? { ...c, title, loadingTitle: false } : c
            ));
          }
        });
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
