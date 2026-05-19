"use client";

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChatInput } from "@/components/dashboard/chat-input";
import { MessageList } from "@/components/dashboard/message-list";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import type { Message } from "@/components/dashboard/shared";
import type { ModelId, Effort } from "@/lib/agent";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { conversations, setConversations } = useDashboard();

  // Initialise synchronously from context cache to avoid skeleton flash
  const cachedConv = conversations.find(c => c.id === id);
  const cachedMessages = cachedConv?.messages ?? [];
  const hasFirst = !!searchParams.get("first");

  const [messages, setMessages] = useState<Message[]>(cachedMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(!hasFirst && cachedMessages.length === 0);
  const [model, setModel] = useState<ModelId>((searchParams.get("model") as ModelId) ?? "deepseek-v4-flash");
  const [effort, setEffort] = useState<Effort>((searchParams.get("effort") as Effort) ?? "medium");
  const initialized = useRef(false);
  const titleGenerated = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load messages or kick off first message
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const firstMsg = searchParams.get("first");

    if (firstMsg) {
      router.replace(`/dashboard/chat/${id}`, { scroll: false });
      sendMessage(firstMsg, []);
    } else if (cachedMessages.length > 0) {
      setLoadingMessages(false);
    } else {
      fetch(`/api/conversations/${id}/messages`)
        .then(r => r.ok ? r.json() : [])
        .then((msgs: Array<{ role: string; content: string }>) => {
          setMessages(msgs.map((m, i) => ({ id: i, role: m.role as "user" | "assistant", text: m.content })));
          setLoadingMessages(false);
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
    setStreaming(true);
    const abort = new AbortController();
    abortRef.current = abort;

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
    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, text: m.text })),
          model,
          effort,
        }),
        signal: abort.signal,
      });
      if (!res.ok || !res.body) throw new Error(`chat http ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
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
      setStreaming(false);
    } catch (err) {
      // Aborted by user — keep whatever text arrived
      if (err instanceof Error && err.name === "AbortError") {
        finalText = acc;
      } else {
        console.error(err);
        finalText = "Sorry, something went wrong.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: finalText } : m));
      }
      setThinking(false);
      setStreaming(false);
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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList messages={messages} thinking={thinking} streaming={streaming} loadingMessages={loadingMessages} />
      </div>
      <div className="shrink-0 px-4 pb-4 pt-2 relative">
        <div className="absolute bottom-full left-0 right-0 h-16 pointer-events-none" style={{ background: "linear-gradient(to top, white, transparent)" }} />
        <div className="max-w-3xl mx-auto">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            onStop={() => abortRef.current?.abort()}
            streaming={streaming}
            toolbar={<ChatControls model={model} effort={effort} onModelChange={setModel} onEffortChange={setEffort} upward={true} />}
          />
        </div>
      </div>
    </div>
  );
}
