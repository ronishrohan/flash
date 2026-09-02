"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete02Icon, Search01Icon } from "hugeicons-react";
import { useDashboard } from "@/components/dashboard/context";

export default function ConversationsPage() {
  const router = useRouter();
  const { conversations, deleteConversation } = useDashboard();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible = conversations.filter(c => c.loadingTitle || c.title);
  const filtered = query.trim()
    ? visible.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : visible;

  return (
    <div className="flex flex-col h-full overflow-hidden px-8 py-8">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <h1 className="text-[1.375rem] font-medium text-slate-900 mb-4">Conversations</h1>
        {/* Search */}
        <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-full border border-slate-200 bg-slate-50 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 transition-[border-color,box-shadow]">
          <Search01Icon size={14} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-[0.9375rem] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto -mx-8 px-8">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm">{query ? "No results." : "No conversations yet."}</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className="group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left hover:bg-slate-100/70 transition-all"
              >
                <button
                  onClick={() => router.push(`/dashboard/chat/${conv.id}`)}
                  className="min-w-0 flex-1 flex flex-col gap-0.5 text-left"
                >
                  <span className={`text-[0.9375rem] font-medium leading-snug ${conv.loadingTitle ? "text-slate-300 animate-pulse" : "text-slate-800"}`}>
                    {conv.loadingTitle ? "Loading…" : (conv.title || "Untitled")}
                  </span>
                  {conv.messages.length > 0 && (
                    <span className="text-sm text-slate-400 truncate leading-snug">
                      {conv.messages[conv.messages.length - 1]?.text?.slice(0, 100)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${conv.title || "conversation"}`}
                  disabled={deleting === conv.id}
                  onClick={async e => {
                    e.stopPropagation();
                    if (!window.confirm("Delete this conversation?")) return;
                    setDeleting(conv.id);
                    await deleteConversation(conv.id);
                    setDeleting(null);
                  }}
                  className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50"
                >
                  {deleting === conv.id ? <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> : <Delete02Icon size={15} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
