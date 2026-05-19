"use client";

import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/context";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ConversationsPage() {
  const router = useRouter();
  const { conversations } = useDashboard();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0">
        <h1 className="text-[1.375rem] text-slate-900 font-medium">Conversations</h1>
        <p className="text-sm text-slate-400 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No conversations yet.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col divide-y divide-slate-100">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => router.push(`/dashboard/chat/${conv.id}`)}
                className="flex flex-col gap-1 py-4 px-2 text-left hover:bg-slate-50 rounded-2xl transition-colors active:scale-[0.99] transition-transform -mx-2"
              >
                <span className={`text-[0.9375rem] font-medium leading-snug ${conv.loadingTitle ? "text-slate-300 animate-pulse" : "text-slate-800"}`}>
                  {conv.loadingTitle ? "Loading..." : (conv.title || "Untitled")}
                </span>
                {conv.messages.length > 0 && (
                  <span className="text-sm text-slate-400 truncate leading-snug">
                    {conv.messages[conv.messages.length - 1]?.text?.slice(0, 120)}
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
