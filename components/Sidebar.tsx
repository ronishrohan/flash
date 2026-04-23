"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Settings01Icon,
  Logout01Icon,
  SidebarLeftIcon,
  UserCircleIcon,
  Chat01Icon,
} from "@hugeicons/core-free-icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

export function Sidebar({
  user,
  open,
  onToggle,
  onOpenSettings,
}: {
  user: User;
  open: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, pathname]);

  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  return (
    <>
      <button
        onClick={onToggle}
        className={`fixed top-4 left-4 z-30 flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer lg:hidden ${open ? "hidden" : ""}`}
        aria-label="Open sidebar"
      >
        <HugeiconsIcon icon={SidebarLeftIcon} size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-20 bg-black/30 lg:hidden"
              onClick={onToggle}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className="fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col border-r border-border bg-[var(--sidebar-bg)] lg:relative lg:z-auto"
            >
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={onToggle}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-[var(--sidebar-hover)] transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <HugeiconsIcon icon={SidebarLeftIcon} size={16} />
                </button>
                <button
                  onClick={() => router.push("/chat")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-[var(--sidebar-hover)] transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer"
                  aria-label="New chat"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                </button>
              </div>

              <div className="px-3 pb-2">
                <button
                  onClick={() => router.push("/chat")}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-[var(--sidebar-hover)] transition-all duration-150 ease-out active:scale-[0.98] cursor-pointer"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={16} className="text-kiwi-300" />
                  New chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3">
                {conversations.length > 0 && (
                  <div className="pb-2">
                    <p className="px-3 py-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                      Recent
                    </p>
                    <div className="space-y-0.5">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => router.push(`/chat/${conv.id}`)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150 ease-out cursor-pointer truncate ${
                            activeId === conv.id
                              ? "bg-[var(--sidebar-active)] text-text-primary font-medium"
                              : "text-text-secondary hover:bg-[var(--sidebar-hover)] hover:text-text-primary"
                          }`}
                        >
                          <HugeiconsIcon
                            icon={Chat01Icon}
                            size={14}
                            className="shrink-0"
                          />
                          <span className="truncate">{conv.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-[var(--sidebar-hover)] transition-all duration-150 ease-out active:scale-[0.98] cursor-pointer"
                  >
                    <HugeiconsIcon icon={Settings01Icon} size={14} />
                    Settings
                  </button>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="h-7 w-7 rounded-full shrink-0 outline outline-1 outline-black/[0.08] dark:outline-white/[0.08]"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kiwi-300/20 text-kiwi-400 shrink-0">
                        <HugeiconsIcon icon={UserCircleIcon} size={14} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-text-primary">
                        {user.name ?? "User"}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer shrink-0"
                    aria-label="Sign out"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={14} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
