"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp02Icon } from "hugeicons-react";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

const PLACEHOLDERS = [
  "Summarize my unread emails from this week",
  "Draft a reply to Sarah's meeting invite",
  "Find the invoice from Acme last month",
  "What did my team say about the launch?",
  "Archive every newsletter older than 30 days",
  "Any emails I still need to reply to?",
  "Pull up the thread with John about the contract",
  "Set a follow-up reminder for tomorrow",
];

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: (v: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  toolbar?: React.ReactNode;
}

export function ChatInput({ input, setInput, onSend, textareaRef: externalRef, toolbar }: ChatInputProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;
  const placeholder = useMemo(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)], []);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const canSend = input.trim().length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [input, textareaRef]);

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.focusTarget === "true") {
          textareaRef.current?.focus();
        }
      }}
      className={`rounded-[2rem] border bg-white transition-[border-color,box-shadow] cursor-text ${textareaFocused ? "border-sky-400 ring-4 ring-sky-100" : "border-slate-200"}`}
    >
      <div data-focus-target="true" className="flex flex-col px-4 pt-4 pb-3 gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setTextareaFocused(true)}
          onBlur={() => setTextareaFocused(false)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); } }}
          placeholder={placeholder}
          className="w-full bg-transparent text-[1.0625rem] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
          style={{ maxHeight: 240, minHeight: "1.75rem" }}
        />
        <div data-focus-target="true" className="flex items-center justify-between h-9">
          <div className="flex items-center gap-1.5 h-full" onClick={e => e.stopPropagation()}>
            {toolbar}
          </div>
          <LiquidGlassButton
            onClick={() => onSend(input)}
            disabled={!canSend}
            scale={0.32}
            tapScale={1.12}
            className="w-9 h-9 shrink-0"
          >
            <ArrowUp02Icon size={16} className={canSend ? "text-white" : "text-slate-400"} />
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  );
}
