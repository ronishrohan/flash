"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft02Icon } from "hugeicons-react";
import { EXPO_OUT } from "@/components/dashboard/shared";

export default function ConversationsPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] flex flex-col p-6" style={{ background: "#f8fafc" }}>
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft02Icon size={16} />
          </button>
          <h1 className="text-[1.5rem] text-slate-900" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
            Conversations
          </h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EXPO_OUT }}
          className="text-slate-400 text-sm"
        >
          Your past conversations will appear here.
        </motion.p>
      </div>
    </div>
  );
}
