"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoseSpinner } from "@/components/ui/rose-spinner";
import { EXPO_OUT, type Message } from "./shared";

interface MessageListProps {
  messages: Message[];
  thinking: boolean;
}

export function MessageList({ messages, thinking }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Last message — if assistant and streaming, show spinner below it
  const last = messages[messages.length - 1];
  const isStreaming = last?.role === "assistant" && thinking;

  return (
    <motion.div
      key="messages"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 px-6 py-8 max-w-2xl mx-auto w-full"
    >
      {messages.map(msg => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: EXPO_OUT }}
          className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
        >
          {msg.role === "user" ? (
            <div className="px-4 py-3 rounded-[1.75rem] rounded-br-lg bg-slate-900 text-white text-[0.9375rem] leading-relaxed max-w-[78%]">
              {msg.text}
            </div>
          ) : (
            <p className="text-slate-800 text-[0.9375rem] leading-relaxed max-w-[88%]">
              {msg.text}
            </p>
          )}
        </motion.div>
      ))}

      {/* Rose spinner — shown while thinking (no text yet) or while streaming */}
      <AnimatePresence>
        {(thinking) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-start overflow-hidden"
          >
            <RoseSpinner size={40} color="#94a3b8" />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </motion.div>
  );
}
