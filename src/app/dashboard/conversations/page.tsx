"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search01Icon } from "hugeicons-react";
import { useDashboard } from "@/components/dashboard/context";

export default function ConversationsPage() {
  const router = useRouter();
  const { conversations } = useDashboard();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : conversations;

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
              <button
                key={conv.id}
                onClick={() => router.push(`/dashboard/chat/${conv.id}`)}
                className="w-full flex flex-col gap-0.5 px-4 py-3.5 rounded-2xl text-left hover:bg-slate-100/70 active:scale-[0.99] transition-all"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
