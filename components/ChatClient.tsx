"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  SparklesIcon,
  Mail01Icon,
  Search01Icon,
  MailReply01Icon,
  MailSend01Icon,
  Archive01Icon,
} from "@hugeicons/core-free-icons";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: {
    intent: string;
    steps: Array<{ id: string; title: string; status: string }>;
    summary: string;
  };
};

const suggestions = [
  { icon: Search01Icon, text: "Show my unread emails" },
  { icon: MailReply01Icon, text: "Reply to the last email from my manager" },
  { icon: MailSend01Icon, text: "Draft a follow-up to the marketing team" },
  { icon: Archive01Icon, text: "Archive all promotional emails from today" },
];

export default function ChatClient({
  conversationId,
}: {
  conversationId?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      setCurrentConvId(conversationId);
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      let convId = currentConvId;

      if (!convId) {
        const createRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 80) }),
        });
        if (createRes.ok) {
          const data = (await createRes.json()) as { conversation: { id: string } };
          convId = data.conversation.id;
          setCurrentConvId(convId);
          router.replace(`/chat/${convId}`, { scroll: false });
        }
      }

      if (convId) {
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content }),
        });
      }

      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: content }),
      });

      const agentData = (await agentRes.json()) as {
        intent?: string;
        steps?: Array<{ id: string; title: string; status: string }>;
        summary?: string;
        error?: string;
      };

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: agentData.error ?? agentData.summary ?? "I processed your request.",
        plan: agentData.error
          ? undefined
          : {
              intent: agentData.intent ?? "unknown",
              steps: agentData.steps ?? [],
              summary: agentData.summary ?? "",
            },
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (convId) {
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: assistantMsg.content,
            metadata: assistantMsg.plan ? JSON.stringify(assistantMsg.plan) : undefined,
          }),
        });
      }
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="w-full max-w-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-kiwi-300/10 mb-6"
            >
              <HugeiconsIcon icon={Mail01Icon} size={24} className="text-kiwi-300" />
            </motion.div>

            <h1 className="text-xl font-semibold">What can I help you with?</h1>
            <p className="text-sm text-text-secondary mt-1.5">
              Ask me anything about your inbox. I can search, read, reply, send, and organize your emails.
            </p>

            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    duration: 0.4,
                    bounce: 0,
                    delay: 0.1 + i * 0.06,
                  }}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-surface-raised p-4 text-left text-sm text-text-secondary transition-all duration-150 ease-out hover:border-kiwi-300/30 hover:text-text-primary active:scale-[0.98] cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={s.icon}
                    size={16}
                    className="mt-0.5 shrink-0 text-kiwi-400"
                  />
                  <span>{s.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--user-bubble)] px-4 py-2.5 text-sm text-[var(--user-bubble-text)]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-kiwi-300/10">
                          <HugeiconsIcon icon={SparklesIcon} size={12} className="text-kiwi-300" />
                        </span>
                        <div className="space-y-2">
                          <p className="text-sm text-[var(--assistant-bubble-text)] leading-relaxed">
                            {msg.content}
                          </p>
                          {msg.plan && msg.plan.steps.length > 0 && (
                            <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                {msg.plan.intent} plan
                              </p>
                              {msg.plan.steps.map((step, idx) => (
                                <div
                                  key={step.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                                      step.status === "complete"
                                        ? "bg-kiwi-300 text-black"
                                        : "bg-surface-raised text-text-tertiary border border-border"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <span
                                    className={
                                      step.status === "complete"
                                        ? "text-text-primary"
                                        : "text-text-tertiary"
                                    }
                                  >
                                    {step.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className="flex items-center gap-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-kiwi-300/10">
                  <HugeiconsIcon icon={SparklesIcon} size={12} className="text-kiwi-300" />
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-kiwi-300"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="border-t border-border bg-[var(--background)] px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-raised px-4 py-2 transition-colors duration-150 focus-within:border-kiwi-300/50 focus-within:ring-2 focus-within:ring-kiwi-300/10">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about your inbox..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none py-1 max-h-40"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer ${
                input.trim() && !loading
                  ? "bg-kiwi-300 text-black hover:bg-kiwi-400"
                  : "bg-surface text-text-tertiary"
              }`}
            >
              <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-text-tertiary font-mono">
            InboxAgent can make mistakes. Review important actions before confirming.
          </p>
        </div>
      </div>
    </div>
  );
}
