"use client";

"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "@/components/dashboard/chat-input";
import { MessageList } from "@/components/dashboard/message-list";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import type { Message, UIBlock } from "@/components/dashboard/shared";
import type { EmailItem } from "@/components/dashboard/data-cards";
import { senderName } from "@/components/dashboard/data-cards";
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
      // Timeout after 10s — use current id as fallback
      setTimeout(() => { clearInterval(iv); resolve(id); }, 10000);
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

    if (scrollRef.current) scrollRef.current.style.paddingBottom = "";

    const baseHistory = history ?? messages;
    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    const assistantId = Date.now() + 1;
    const nextHistory = [...baseHistory, userMsg];

    setMessages([...nextHistory, { id: assistantId, role: "assistant", text: "" }]);
    setInput("");
    setThinking(true);
    setStreaming(true);

    // Ensure at least 40vh of space below the user message for the response
    // Reset any previous padding first, then set new one after DOM update
    suppressScrollRef.current = true;
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      const msgEl = userMsgRefs.current.get(userMsg.id);
      if (container && msgEl) {
        const minPad = container.clientHeight * 0.4;
        const spaceBelow = container.scrollHeight - (msgEl.offsetTop + msgEl.offsetHeight);
        if (spaceBelow < minPad) {
          container.style.paddingBottom = `${minPad - spaceBelow}px`;
        }
        container.scrollTo({ top: msgEl.offsetTop - 24, behavior: "smooth" });
      }
      setTimeout(() => { suppressScrollRef.current = false; }, 500);
    });
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
    const collectedBlocks: UIBlock[] = [];
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
              if (first && acc.length > 0) {
                setThinking(false); setToolLabel(null); first = false;
              }
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: acc } : m));
            } else if (event.type === "tool") {
              setToolLabel(event.name);
            } else if (event.type === "ui") {
              const block: UIBlock = { component: event.component, data: event.data };
              collectedBlocks.push(block);
              if (first) { setThinking(false); first = false; }
              setToolLabel(null);
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

    const finalMessages: Message[] = [...nextHistory, { id: assistantId, role: "assistant" as const, text: finalText, blocks: collectedBlocks.length ? collectedBlocks : undefined }];
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const userMsgRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const suppressScrollRef = useRef(false);
  const actionTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(actionTimers.current).forEach(clearTimeout);
      actionTimers.current = {};
    };
  }, []);

  const [pendingActions, setPendingActions] = useState<Array<{ id: string; type: "archive" | "trash"; emailId: string; message: string }>>([]);

  function handleReply(email: EmailItem) {
    const sender = senderName(email.from);
    const prompt = `Draft a reply to the email from ${sender} with subject "${email.subject}"${email.threadId ? ` (thread: ${email.threadId})` : ""}. Match my usual tone and keep it concise.`;
    sendMessage(prompt);
  }

  function executeAction(id: string, type: "archive" | "trash", emailId: string) {
    delete actionTimers.current[id];
    setPendingActions(prev => prev.filter(a => a.id !== id));
    fetch(`/api/gmail/${type}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageId: emailId }),
    });
  }

  function handleAction(type: "archive" | "trash", email: EmailItem) {
    const id = Math.random().toString(36).slice(2);
    const label = type === "archive" ? "Archived" : "Trashed";
    setPendingActions(prev => [...prev, { id, type, emailId: email.id, message: `${label} "${email.subject}"` }]);
    actionTimers.current[id] = setTimeout(() => executeAction(id, type, email.id), 5000);
  }

  function undoAction(id: string) {
    const timer = actionTimers.current[id];
    if (timer) clearTimeout(timer);
    delete actionTimers.current[id];
    setPendingActions(prev => prev.filter(a => a.id !== id));
  }

  const emailActions = {
    onReply: handleReply,
    onArchive: (email: EmailItem) => handleAction("archive", email),
    onTrash: (email: EmailItem) => handleAction("trash", email),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <MessageList messages={messages} thinking={thinking} streaming={streaming} loadingMessages={loadingMessages} toolLabel={toolLabel} scrollRef={scrollRef} userMsgRefs={userMsgRefs} suppressScrollRef={suppressScrollRef} emailActions={emailActions} />
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
      <AnimatePresence>
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2"
          >
            {pendingActions.map(action => (
              <div
                key={action.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900 text-white text-[0.8125rem] shadow-lg"
              >
                <span className="max-w-[220px] truncate">{action.message}</span>
                <button
                  onClick={() => undoAction(action.id)}
                  className="text-sky-300 hover:text-sky-200 font-medium"
                >
                  Undo
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
