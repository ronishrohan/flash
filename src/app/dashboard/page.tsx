"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChatInput } from "@/components/dashboard/chat-input";
import { ChatControls } from "@/components/dashboard/model-picker";
import { useDashboard } from "@/components/dashboard/context";
import { EXPO_OUT } from "@/components/dashboard/shared";
import type { ModelId, Effort } from "@/lib/agent";

const MORNING_GREETINGS = [
  "Inbox zero won't achieve itself.",
  "Let's see what landed overnight.",
  "Morning. Your inbox has thoughts.",
  "Early start. Good time to clear the queue.",
  "Rise and reply.",
  "What's first on the agenda?",
  "Coffee's ready. Inbox isn't.",
  "Let's get ahead of today.",
];

const AFTERNOON_GREETINGS = [
  "Halfway through. How's the inbox holding up?",
  "Afternoon. Anything piling up?",
  "Post-lunch slump? Let's clear some mail.",
  "What needs handling before end of day?",
  "Any threads still waiting on you?",
  "Let's knock something out.",
  "Good time to follow up on anything?",
  "Keeping up with the calendar?",
];

const EVENING_GREETINGS = [
  "Wrapping up for the day?",
  "Any loose ends to tie off?",
  "Evening. Let's clear the backlog.",
  "One last check before you're done.",
  "What's left on the list?",
  "End of day sweep?",
  "Still have emails waiting on replies?",
  "Let's get tomorrow's calendar sorted.",
];

const ALL_GREETINGS = [
  "What do you need today?",
  "Your inbox is waiting.",
  "Let's get through it.",
  "Anything urgent in the queue?",
  "What's on the calendar?",
  "Need to draft something?",
  "Catch up on anything?",
  "Who needs a reply?",
  "Any meetings to sort out?",
  "Want a summary of what came in?",
];

function getGreeting() {
  const h = new Date().getHours();
  const pool = h < 12 ? MORNING_GREETINGS : h < 18 ? AFTERNOON_GREETINGS : EVENING_GREETINGS;
  // Mix in some all-day ones
  const combined = [...pool, ...ALL_GREETINGS];
  return combined[Math.floor(Math.random() * combined.length)];
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

    router.push(`/dashboard/chat/${tempId}?first=${encodeURIComponent(trimmed)}&model=${model}&effort=${effort}`);

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
        {getGreeting()}
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
