"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Spinner } from "@/components/ui/spinner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ChatInput } from "@/components/dashboard/chat-input";
import { MessageList } from "@/components/dashboard/message-list";
import { EXPO_OUT, type Message, type Conversation } from "@/components/dashboard/shared";

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 1, title: "Summarize my unread emails" },
  { id: 2, title: "Reply to John's meeting request" },
  { id: 3, title: "Archive newsletters" },
  { id: 4, title: "Find invoice from Acme" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
      else setUser(data.user);
    });
  }, []);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", text: text.trim() }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", text: "I'm looking into that for you…" }]);
      setThinking(false);
    }, 1200);
  }

  if (!user) return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <Spinner size={28} color="#94a3b8" />
    </div>
  );

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
  const firstName = fullName.split(" ")[0] || "there";
  const displayName = fullName || user.email || "";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const isHome = messages.length === 0;

  return (
    <div
      className="min-h-[100dvh] flex p-3 gap-3"
      style={{ background: "#f8fafc" }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        activeNav={activeNav}
        onNavSelect={setActiveNav}
        conversations={MOCK_CONVERSATIONS}
        activeConv={activeConv}
        onConvSelect={(id) => { setActiveConv(id); setMessages([]); }}
        onNewChat={() => { setMessages([]); setActiveConv(null); }}
        displayName={displayName}
        initials={initials}
        onSignOut={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
      />

      <main
        className="flex-1 flex flex-col bg-white rounded-[2rem] overflow-hidden"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            {isHome ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full min-h-[500px] px-6"
              >
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
                  className="w-full max-w-2xl"
                >
                  <ChatInput input={input} setInput={setInput} onSend={sendMessage} />
                </motion.div>
              </motion.div>
            ) : (
              <MessageList messages={messages} thinking={thinking} />
            )}
          </AnimatePresence>
        </div>

        {!isHome && (
          <div className="px-4 pb-3 pt-2 shrink-0 border-t border-slate-100">
            <div className="max-w-2xl mx-auto">
              <ChatInput input={input} setInput={setInput} onSend={sendMessage} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
