"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { RoseSpinner } from "@/components/ui/rose-spinner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ChatInput } from "@/components/dashboard/chat-input";
import { MessageList } from "@/components/dashboard/message-list";
import { ChatControls } from "@/components/dashboard/model-picker";
import { SettingsModal } from "@/components/dashboard/settings-modal";
import { EXPO_OUT, type Message, type Conversation } from "@/components/dashboard/shared";
import type { ModelId, Effort } from "@/lib/agent";



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
  const [model, setModel] = useState<ModelId>("deepseek-v4-flash");
  const [effort, setEffort] = useState<Effort>("medium");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { window.location.href = "/login"; return; }
      const onboarded = data.user.user_metadata?.onboarded === true;
      const { data: tokenRow } = await supabase
        .from("gmail_tokens")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (!onboarded && !tokenRow) { window.location.href = "/login?step=onboard"; return; }
      setUser(data.user);
    })();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === "b") { e.preventDefault(); setCollapsed(c => !c); }
      if (e.key === ",") { e.preventDefault(); setSettingsOpen(v => !v); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed };
    const assistantId = Date.now() + 1;
    const nextHistory = [...messages, userMsg];
    const isNew = messages.length === 0;
    const convId = isNew ? Date.now() : (activeConv ?? Date.now());
    const convTitle = isNew ? trimmed.slice(0, 60) : undefined;

    setMessages([...nextHistory, { id: assistantId, role: "assistant", text: "" }]);
    setInput("");
    setThinking(true);
    if (isNew) setActiveConv(convId);

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
    setConversations(prev => {
      const exists = prev.find(c => c.id === convId);
      if (exists) return prev.map(c => c.id === convId ? { ...c, messages: finalMessages } : c);
      return [{ id: convId, title: convTitle ?? trimmed.slice(0, 60), messages: finalMessages }, ...prev];
    });
  }

  if (!user) return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <RoseSpinner size={72} color="#94a3b8" />
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
        conversations={conversations}
        activeConv={activeConv}
        onConvSelect={(id) => {
          const conv = conversations.find(c => c.id === id);
          if (conv) { setActiveConv(id); setMessages(conv.messages); }
        }}
        onNewChat={() => { setMessages([]); setActiveConv(null); }}
        displayName={displayName}
        email={user.email}
        initials={initials}
        onSignOut={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
        onProfile={() => {}}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => {}}
      />

      <main
        className="flex-1 flex flex-col bg-white rounded-[2rem] overflow-hidden"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <AnimatePresence initial={false}>
            {isHome ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center justify-center h-full min-h-[500px] px-6 -mt-16 overflow-y-auto"
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
                  className="w-full max-w-lg flex flex-col gap-2"
                >
                  <ChatInput
                    input={input}
                    setInput={setInput}
                    onSend={sendMessage}
                    toolbar={<ChatControls model={model} effort={effort} onModelChange={setModel} onEffortChange={setEffort} upward={false} />}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div key="chat" className="flex-1 overflow-y-auto min-h-0 h-full">
                <MessageList messages={messages} thinking={thinking} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {!isHome && (
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
        )}
      </main>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
