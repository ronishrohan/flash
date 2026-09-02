"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp02Icon, AiMicIcon } from "hugeicons-react";
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
  onStop?: () => void;
  streaming?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  toolbar?: React.ReactNode;
  layoutId?: string;
}

export function ChatInput({ input, setInput, onSend, onStop, streaming, textareaRef: externalRef, toolbar, layoutId }: ChatInputProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const canSend = input.trim().length > 0;

  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "unsupported" | "error">("idle");
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const shouldContinueRef = useRef(false);

  function toggleVoice() {
    if (voiceState === "listening") {
      shouldContinueRef.current = false;
      recognitionRef.current?.stop();
      setVoiceState("idle");
      setVoiceMessage(null);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceState("unsupported");
      setVoiceMessage("Voice input is not supported in this browser.");
      return;
    }

    baseTranscriptRef.current = input.trim();
    finalTranscriptRef.current = "";
    shouldContinueRef.current = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = new SR() as any;
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";

    r.onstart = () => {
      setVoiceState("listening");
      setVoiceMessage("Listening… tap the mic when you’re done.");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += e.results[i][0].transcript.trim() + " ";
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      const parts = [baseTranscriptRef.current, finalTranscriptRef.current.trim(), interim.trim()].filter(Boolean);
      setInput(parts.join(" "));
    };
    r.onend = () => {
      // Some Chromium versions end a continuous session after a short pause.
      // Restart while the user still considers voice mode active.
      if (shouldContinueRef.current) {
        try { r.start(); } catch { /* the browser is already restarting */ }
      } else {
        setVoiceState("idle");
        setVoiceMessage(null);
      }
    };
    r.onerror = (event: { error?: string }) => {
      shouldContinueRef.current = false;
      setVoiceState("error");
      setVoiceMessage(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings and try again."
          : "Voice input stopped. Try again when you’re ready."
      );
    };
    recognitionRef.current = r;
    try {
      r.start();
    } catch {
      shouldContinueRef.current = false;
      setVoiceState("error");
      setVoiceMessage("Voice input could not start. Check your microphone and try again.");
    }
  }

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input, textareaRef]);

  const Wrapper = layoutId ? motion.div : "div";
  const wrapperProps = layoutId ? { layoutId, layout: true, transition: { type: "spring" as const, stiffness: 400, damping: 36, mass: 0.8 } } : {};

  return (
    <Wrapper
      {...wrapperProps}
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
          style={{ maxHeight: 160, minHeight: "1.75rem", overflowY: "auto" }}
        />
        {voiceMessage && (
          <p
            role={voiceState === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`text-xs ${voiceState === "error" || voiceState === "unsupported" ? "text-rose-600" : "text-sky-600"}`}
          >
            {voiceMessage}
          </p>
        )}
        <div data-focus-target="true" className="flex items-center justify-between h-9">
          <div className="flex items-center gap-1.5 h-full" onClick={e => e.stopPropagation()}>
            {toolbar}
          </div>
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={toggleVoice}
              type="button"
              title={voiceState === "listening" ? "Stop voice input" : voiceState === "unsupported" ? "Voice input unavailable" : "Start voice input"}
              aria-label={voiceState === "listening" ? "Stop voice input" : voiceState === "unsupported" ? "Voice input unavailable" : "Start voice input"}
              aria-pressed={voiceState === "listening"}
              disabled={voiceState === "unsupported"}
              className={`relative w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${
                voiceState === "listening"
                  ? "bg-rose-500 text-white"
                  : voiceState === "error" || voiceState === "unsupported"
                    ? "text-rose-400 hover:text-rose-500 hover:bg-rose-50"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              {voiceState === "listening" && (
                <span className="absolute inset-0 rounded-full animate-ping bg-rose-400 opacity-40" />
              )}
              <AiMicIcon size={17} />
            </button>
            {streaming ? (
              <button
                onClick={onStop}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(15,23,42,0.92)" }}
              >
                <div className="w-[13px] h-[13px] rounded-[3px] bg-white" />
              </button>
            ) : (
              <LiquidGlassButton
                onClick={() => onSend(input)}
                disabled={!canSend}
                dark
                scale={0.28}
                background="rgba(15,23,42,0.92)"
                tapScale={1.12}
                className="w-9 h-9 shrink-0"
              >
                <ArrowUp02Icon size={16} className={canSend ? "text-white" : "text-slate-400"} />
              </LiquidGlassButton>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
