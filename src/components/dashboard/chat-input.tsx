"use client";

import { useEffect, useRef } from "react";
import { ArrowUp02Icon } from "hugeicons-react";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: (v: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({ input, setInput, onSend, textareaRef: externalRef }: ChatInputProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;
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
      className="rounded-[2rem] border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-4 ring-0 ring-sky-100 focus-within:ring-sky-100 transition-[border-color,box-shadow] cursor-text"
    >
      <div data-focus-target="true" className="flex flex-col p-4 gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); } }}
          placeholder="What's in your inbox today — summarize, reply, or find anything"
          className="w-full bg-transparent text-[1.0625rem] text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
          style={{ maxHeight: 240, minHeight: "1.75rem" }}
        />
        <div data-focus-target="true" className="flex justify-end">
          <button
            onClick={() => onSend(input)}
            disabled={!canSend}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.92] transition-transform relative overflow-hidden"
            style={{
              background: canSend ? "linear-gradient(135deg, #0ea5e9, #38bdf8)" : "#e2e8f0",
              boxShadow: canSend ? [
                "inset 4px 4px 2px -4px rgba(255,255,255,0.55)",
                "inset -4px -4px 2px -4px rgba(255,255,255,0.25)",
                "inset 2px -3px 2px -2px rgba(50,50,50,0.06)",
              ].join(", ") : "none",
            }}
          >
            <ArrowUp02Icon size={16} className={canSend ? "text-white" : "text-slate-400"} />
          </button>
        </div>
      </div>
    </div>
  );
}
