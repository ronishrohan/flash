"use client";

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChatInput } from "@/components/dashboard/chat-input";
import { MessageList } from "@/components/dashboard/message-list";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import type { Message, DataBlock } from "@/components/dashboard/shared";
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
  const [toolLabel, setToolLabel] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(!hasFirst && cachedMessages.length === 0);
  const [model, setModel] = useState<ModelId>((searchParams.get("model") as ModelId) ?? "deepseek-v4-flash");
  const [effort, setEffort] = useState<Effort>((searchParams.get("effort") as Effort) ?? "medium");
  const initialized = useRef(false);
  const titleGenerated = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const realId = useRef<string>(id.startsWith("temp_") ? "" : id);

  // Watch context for temp→real ID swap, then replace URL
  useEffect(() => {
    if (!id.startsWith("temp_")) return;
    // The entry with this tempId has been swapped — find the new real ID
    // Context will no longer have id===tempId; instead a new UUID entry appears at index 0
    const swapped = conversations.find(c => !c.id.startsWith("temp_") && realId.current === "");
    if (swapped) {
      realId.current = swapped.id;
      router.replace(`/dashboard/chat/${swapped.id}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // Resolve real ID: polls context until temp entry is swapped
  function getRealId(): Promise<string> {
    if (realId.current) return Promise.resolve(realId.current);
    return new Promise(resolve => {
      const iv = setInterval(() => {
        if (realId.current) { clearInterval(iv); resolve(realId.current); }
      }, 50);
    });
  }

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
    } else if (!id.startsWith("temp_")) {
      fetch(`/api/conversations/${id}/messages`)
        .then(r => r.ok ? r.json() : [])
        .then((msgs: Array<{ role: string; content: string }>) => {
          setMessages(msgs.map((m, i) => ({ id: i, role: m.role as "user" | "assistant", text: m.content })));
          setLoadingMessages(false);
        });
    }
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

    const isFirstMessage = history !== undefined;
    if (!isFirstMessage) {
      getRealId().then(rid => fetch(`/api/conversations/${rid}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "user", content: trimmed }),
      }));
    }

    // Stream response
    let finalText = "";
    let acc = "";
    const collectedBlocks: DataBlock[] = [];
    let lineBuffer = "";
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
        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "text") {
              acc += event.delta;
              if (first && acc.length > 0) { setThinking(false); setToolLabel(null); first = false; }
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: acc } : m));
            } else if (event.type === "tool") {
              setToolLabel(event.name);
            } else if (event.type === "data") {
              const block: DataBlock = { kind: event.kind, payload: event.payload };
              collectedBlocks.push(block);
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, blocks: [...collectedBlocks] } : m));
            }
          } catch { /* malformed line */ }
        }
      }
      finalText = acc;
      setThinking(false);
      setStreaming(false);
      setToolLabel(null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        finalText = acc;
      } else {
        console.error(err);
        finalText = "Sorry, something went wrong.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: finalText } : m));
      }
      setThinking(false);
      setStreaming(false);
      setToolLabel(null);
    }

    const finalMessages = [...nextHistory, { id: assistantId, role: "assistant" as const, text: finalText, blocks: collectedBlocks }];
    // Update context — match both temp and real ID since URL may not have replaced yet
    setConversations(prev => prev.map(c =>
      (c.id === id || c.id === realId.current) ? { ...c, messages: finalMessages } : c
    ));

    getRealId().then(rid => {
      fetch(`/api/conversations/${rid}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "assistant", content: finalText }),
      });

      if (isFirstMessage) {
        fetch(`/api/conversations/${rid}/title`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userMessage: trimmed, assistantMessage: finalText }),
        }).then(r => r.json()).then(({ title }) => {
          if (title) {
            titleGenerated.current = true;
            setConversations(prev => prev.map(c =>
              (c.id === rid || c.id === id) ? { ...c, title, loadingTitle: false } : c
            ));
          }
        });
      }
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList messages={messages} thinking={thinking} streaming={streaming} loadingMessages={loadingMessages} toolLabel={toolLabel} />
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
