"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Home01Icon, InboxIcon, Mail01Icon, Search01Icon, PlusSignIcon, ArrowUp02Icon, SidebarLeft01Icon } from "hugeicons-react";
import { Spinner } from "@/components/ui/spinner";
import { LiquidGlass } from "@/components/ui/liquid-glass";

interface Message { id: number; role: "user" | "assistant"; text: string; }
interface Conversation { id: number; title: string; }

const NAV = [
  { icon: Home01Icon,   label: "Home"   },
  { icon: InboxIcon,    label: "Inbox"  },
  { icon: Mail01Icon,   label: "Mail"   },
  { icon: Search01Icon, label: "Search" },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 1, title: "Summarize my unread emails" },
  { id: 2, title: "Reply to John's meeting request" },
  { id: 3, title: "Archive newsletters" },
  { id: 4, title: "Find invoice from Acme" },
];

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
const SIDEBAR_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const SKY_BG = "linear-gradient(135deg, #0ea5e9, #38bdf8)";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
      else setUser(data.user);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [input]);

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
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 288 }}
        transition={SIDEBAR_SPRING}
        className="hidden md:flex flex-col shrink-0 bg-[#f8fafc] rounded-3xl overflow-hidden"
      >
        <div className="flex flex-col flex-1 min-h-0 p-3 gap-1 overflow-hidden">

          {/* Branding + toggle */}
          <div className="flex items-center justify-between px-1 pt-1 pb-3">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.a
                  href="/"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-slate-900 leading-none whitespace-nowrap"
                  style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif', fontSize: "1.75rem" }}
                >
                  Flash
                </motion.a>
              )}
            </AnimatePresence>
            <button
              onClick={() => setCollapsed(c => !c)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-[0.97] transition-transform shrink-0 ${collapsed ? "mx-auto" : ""}`}
            >
              <SidebarLeft01Icon size={16} />
            </button>
          </div>

          {/* New chat */}
          <div className="mb-2 rounded-full overflow-hidden shrink-0" style={{ background: SKY_BG }}>
            <LiquidGlass static hoverable={false} className="w-full" radius="9999px">
              <button
                onClick={() => { setMessages([]); setActiveConv(null); }}
                className={`w-full flex items-center gap-2.5 h-10 text-[0.9375rem] font-medium text-white overflow-hidden ${collapsed ? "justify-center px-0" : "px-4"}`}
              >
                <PlusSignIcon size={16} className="shrink-0" />
                <motion.span
                  animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
                  transition={SIDEBAR_SPRING}
                  className="overflow-hidden whitespace-nowrap"
                >
                  New chat
                </motion.span>
              </button>
            </LiquidGlass>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 shrink-0">
            {NAV.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-2.5 h-10 rounded-full text-[0.9375rem] font-medium active:scale-[0.97] transition-transform overflow-hidden ${collapsed ? "justify-center px-0" : "px-4"} ${activeNav === label ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"}`}
              >
                <Icon size={17} className="shrink-0" />
                <motion.span
                  animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
                  transition={SIDEBAR_SPRING}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {label}
                </motion.span>
              </button>
            ))}
          </nav>

          {/* Conversations */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-3 flex-1 overflow-y-auto min-h-0 flex flex-col gap-0.5"
              >
                <p className="px-3 text-xs text-slate-400 mb-0.5">Recent</p>
                {MOCK_CONVERSATIONS.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConv(conv.id); setMessages([]); }}
                    className={`w-full flex items-center px-4 h-10 rounded-full text-[0.9375rem] active:scale-[0.97] transition-transform ${activeConv === conv.id ? "bg-slate-100 text-slate-800 font-medium" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"}`}
                  >
                    <span className="truncate">{conv.title}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {collapsed && <div className="flex-1" />}

          {/* Account */}
          <button
            className={`mt-1 w-full flex items-center gap-3 h-12 rounded-full hover:bg-slate-50 active:scale-[0.97] transition-transform ${collapsed ? "justify-center px-0" : "px-3"}`}
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
            title={collapsed ? displayName : undefined}
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <motion.span
              animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
              transition={SIDEBAR_SPRING}
              className="overflow-hidden whitespace-nowrap text-[0.9375rem] font-medium text-slate-700"
            >
              {displayName}
            </motion.span>
          </button>

        </div>
      </motion.aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden"
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
                  <ChatInput input={input} setInput={setInput} onSend={sendMessage} textareaRef={textareaRef} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 px-6 py-6 max-w-2xl mx-auto w-full"
              >
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: EXPO_OUT }}
                    className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div className={[
                      "px-4 py-3 rounded-3xl text-[0.9375rem] leading-relaxed max-w-[78%]",
                      msg.role === "user" ? "bg-slate-900 text-white rounded-br-lg" : "bg-slate-100 text-slate-800 rounded-bl-lg",
                    ].join(" ")}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {thinking && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="px-5 py-3.5 rounded-3xl rounded-bl-lg bg-slate-100 flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400" style={{ animation: `msgbounce 1s ${d}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isHome && (
          <div className="px-4 pb-3 pt-2 shrink-0 border-t border-slate-100">
            <div className="max-w-2xl mx-auto">
              <ChatInput input={input} setInput={setInput} onSend={sendMessage} textareaRef={textareaRef} />
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes msgbounce {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

function ChatInput({ input, setInput, onSend, textareaRef }: {
  input: string;
  setInput: (v: string) => void;
  onSend: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const canSend = input.trim().length > 0;
  return (
    <div
      className="rounded-3xl border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-4 ring-0 ring-sky-100  focus-within:ring-sky-100 transition-[border-color,box-shadow]"
      // style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="flex flex-col p-4 gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); } }}
          placeholder="What's in your inbox today — summarize, reply, or find anything"
          className="w-full bg-transparent text-[1.0625rem] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
          style={{ maxHeight: 240, minHeight: "1.75rem" }}
        />
        <div className="flex justify-end">
          <button
            onClick={() => onSend(input)}
            disabled={!canSend}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.92] transition-transform relative overflow-hidden"
            style={{
              background: canSend ? "linear-gradient(135deg, #0ea5e9, #38bdf8)" : "#e2e8f0",
              boxShadow: canSend ? [
                "inset 4px 4px 2px -4px rgba(255,255,255,0.55)",
                "inset -4px -4px 2px -4px rgba(255,255,255,0.25)",
                "inset 2px -3px 2px -2px rgba(50,50,50,0.06)",
              ].join(", ") : "none",
            }}
          >
            <ArrowUp02Icon size={16} className={canSend ? "text-white" : "text-slate-400"} />
          </button>
        </div>
      </div>
    </div>
  );
}
