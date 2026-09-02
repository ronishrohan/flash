"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChatInput } from "@/components/dashboard/chat-input";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import { EXPO_OUT } from "@/components/dashboard/shared";
import type { ModelId, Effort } from "@/lib/agent";

const greetingStyle: React.CSSProperties = {
  fontFamily: '"Junicode", ui-serif, Georgia, serif',
  animation: "greeting-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const Greeting = memo(function Greeting({ firstName }: { firstName: string }) {
  return (
    <h1
      className="text-slate-900 text-[2.25rem] mb-8 text-center"
      style={greetingStyle}
    >
      {getGreeting()}, {firstName}.
    </h1>
  );
});

function InputArea({ onSend }: { onSend: (text: string, model: ModelId, effort: Effort) => void }) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ModelId>("deepseek-v4-flash");
  const [effort, setEffort] = useState<Effort>("medium");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EXPO_OUT, delay: 0.07 }}
      className="w-full max-w-lg"
    >
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={(text) => onSend(text, model, effort)}
        toolbar={<ChatControls model={model} effort={effort} onModelChange={setModel} onEffortChange={setEffort} upward={false} />}
      />
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        {[
          "Show my latest emails",
          "What's on my calendar today?",
          "Find emails I haven't replied to",
        ].map(prompt => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSend(prompt, model, effort)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.98]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function NewChatPage() {
  const router = useRouter();
  const { user, setConversations } = useDashboard();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const firstName = useMemo(() => {
    if (!user) return "there";
    const full = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    return full.split(" ")[0] || "there";
  }, [user]);

  const handleSend = useCallback(async (text: string, model: ModelId, effort: Effort) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      if (!res.ok) throw new Error("Could not start a conversation.");
      const conv = await res.json() as { id: string; title?: string };
      setConversations(prev => [{ id: conv.id, title: conv.title || "New conversation", messages: [], loadingTitle: true }, ...prev]);
      router.push(`/dashboard/chat/${conv.id}?first=${encodeURIComponent(trimmed)}&model=${model}&effort=${effort}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not start a conversation. Try again.");
      setCreating(false);
    }
  }, [creating, router, setConversations]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-6 -mt-16">
      <Greeting firstName={firstName} />
      <InputArea onSend={handleSend} />
      {createError && <p role="alert" className="mt-3 text-center text-xs text-rose-500">{createError}</p>}
    </div>
  );
}
