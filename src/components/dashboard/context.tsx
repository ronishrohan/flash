"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Conversation, Message } from "./shared";

interface DashboardContextValue {
  user: User | null;
  loading: boolean;
  collapsed: boolean;
  setCollapsed: (v: boolean | ((p: boolean) => boolean)) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  refreshConversations: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data: Array<{ id: string; title: string; messages: Array<{ id: string; role: string; content: string }> }> = await res.json();
    setConversations(data.map((c, ci) => ({
      id: c.id,
      title: c.title,
      messages: (c.messages ?? []).map((m, mi): Message => ({
        id: ci * 10000 + mi,
        role: m.role as "user" | "assistant",
        text: m.content,
      })),
    })));
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { window.location.href = "/login"; return; }
      const onboarded = data.user.user_metadata?.onboarded === true;
      const { data: tokenRow } = await supabase.from("gmail_tokens").select("user_id").eq("user_id", data.user.id).maybeSingle();
      if (!onboarded && !tokenRow) { window.location.href = "/login?step=onboard"; return; }
      setUser(data.user);
      await loadConversations();
      setLoading(false);
    })();
  }, [loadConversations]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === "b") { e.preventDefault(); setCollapsed(c => !c); }
      if (e.key === ",") { e.preventDefault(); setSettingsOpen(v => !v); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <DashboardContext.Provider value={{
      user, loading, collapsed, setCollapsed,
      conversations, setConversations,
      settingsOpen, setSettingsOpen,
      refreshConversations: loadConversations,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
