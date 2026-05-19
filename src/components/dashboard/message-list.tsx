"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RoseSpinner } from "@/components/ui/rose-spinner";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Copy01Icon, ThumbsUpIcon, ThumbsDownIcon, Refresh01Icon, Tick01Icon } from "hugeicons-react";
import type { Message } from "./shared";

interface MessageListProps {
  messages: Message[];
  thinking: boolean;
  loadingMessages?: boolean;
}

function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[80, 55, 70].map((w, i) => (
        <div key={i} className={`h-4 rounded-full bg-slate-100 animate-pulse`} style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

function ActionBar({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const actions = [
    { icon: copied ? Tick01Icon : Copy01Icon, label: "Copy", onClick: copy, active: copied },
    { icon: ThumbsUpIcon, label: "Good", onClick: () => {} },
    { icon: ThumbsDownIcon, label: "Bad", onClick: () => {} },
    { icon: Refresh01Icon, label: "Retry", onClick: () => {} },
  ];

  return (
    <div className="mt-3">
      <LiquidGlass scale={0.22} radius="9999px" hoverable={false} background="rgba(148,163,184,0.08)" static className="w-fit px-1.5 py-1">
        <div className="flex items-center gap-0.5">
          {actions.map(({ icon: Icon, label, onClick, active }) => (
            <button
              key={label}
              onClick={onClick}
              title={label}
              className={`flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-90 ${active ? "text-green-600" : "text-slate-400 hover:bg-black/5 hover:text-slate-600"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </LiquidGlass>
    </div>
  );
}

export function MessageList({ messages, thinking, loadingMessages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  if (loadingMessages) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto w-full">
        <MessageSkeleton />
      </div>
    );
  }

  const lastAssistantIndex = messages.reduce((acc, m, i) => m.role === "assistant" ? i : acc, -1);

  return (
    <div className="flex flex-col gap-8 px-6 py-8 max-w-3xl mx-auto w-full">
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          className={msg.role === "user" ? "flex justify-end" : "flex flex-col justify-start"}
        >
          {msg.role === "user" ? (
            <div className="max-w-[88%]">
              <LiquidGlass scale={0.28} radius="1.75rem" hoverable={false} dark background="rgba(15,23,42,0.92)">
                <div className="px-4 py-3 text-white text-[0.9375rem] leading-relaxed select-none">
                  {msg.text}
                </div>
              </LiquidGlass>
            </div>
          ) : (
            <>
              <p className="text-slate-800 text-[0.9375rem] leading-relaxed max-w-[88%]">
                {msg.text}
              </p>
              {/* Show action bar on completed assistant messages, not while streaming */}
              {msg.text && !(thinking && i === lastAssistantIndex) && (
                <ActionBar text={msg.text} />
              )}
            </>
          )}
        </div>
      ))}

      <AnimatePresence>
        {thinking && (
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
    </div>
  );
}
