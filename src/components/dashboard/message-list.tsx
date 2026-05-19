"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { EXPO_OUT, type Message } from "./shared";

interface MessageListProps {
  messages: Message[];
  thinking: boolean;
}

export function MessageList({ messages, thinking }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
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
            "px-4 py-3 rounded-[1.75rem] text-[0.9375rem] leading-relaxed max-w-[78%]",
            msg.role === "user" ? "bg-slate-900 text-white rounded-br-lg" : "bg-slate-100 text-slate-800 rounded-bl-lg",
          ].join(" ")}>
            {msg.text}
          </div>
        </motion.div>
      ))}
      {thinking && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <div className="px-5 py-3.5 rounded-[1.75rem] rounded-bl-lg bg-slate-100 flex items-center gap-1.5">
            {[0, 0.15, 0.3].map(d => (
              <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400" style={{ animation: `msgbounce 1s ${d}s ease-in-out infinite` }} />
            ))}
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
      <style>{`
        @keyframes msgbounce {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-4px); }
        }
      `}</style>
    </motion.div>
  );
}
