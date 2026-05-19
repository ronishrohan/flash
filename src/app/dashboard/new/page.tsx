"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChatInput } from "@/components/dashboard/chat-input";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import { EXPO_OUT } from "@/components/dashboard/shared";
import type { ModelId, Effort } from "@/lib/agent";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function NewChatPage() {
  const router = useRouter();
  const { user, setConversations } = useDashboard();
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ModelId>("deepseek-v4-flash");
  const [effort, setEffort] = useState<Effort>("medium");

  const firstName = useMemo(() => {
    if (!user) return "there";
    const full = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    return full.split(" ")[0] || "there";
  }, [user]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const tempId = `temp_${Date.now()}`;
    setConversations(prev => [{ id: tempId, title: "", messages: [], loadingTitle: true }, ...prev]);

    // Navigate immediately with temp ID
    router.push(`/dashboard/chat/${tempId}?first=${encodeURIComponent(trimmed)}&model=${model}&effort=${effort}`);

    // Create in DB in background, then swap temp→real in context
    fetch("/api/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "" }),
    }).then(r => r.json()).then(conv => {
      setConversations(prev => prev.map(c =>
        c.id === tempId ? { ...c, id: conv.id } : c
      ));
    });
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-6 -mt-16">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EXPO_OUT }}
        className="text-slate-900 text-[2.25rem] mb-8 text-center"
        style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}
      >
        {getGreeting()}, {firstName}.
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EXPO_OUT, delay: 0.07 }}
        className="w-full max-w-lg"
      >
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          toolbar={<ChatControls model={model} effort={effort} onModelChange={setModel} onEffortChange={setEffort} upward={false} />}
        />
      </motion.div>
    </div>
  );
}
