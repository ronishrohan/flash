"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { RoseSpinner } from "@/components/ui/rose-spinner";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Copy01Icon, ThumbsUpIcon, ThumbsDownIcon, Tick01Icon } from "hugeicons-react";
import { EmailListCard, EmailCard, EventListCard } from "./data-cards";
import { EmailDraftCard } from "./email-draft-card";
import { CalendarCreateCard, CalendarUpdateCard, CalendarDeleteCard } from "./calendar-draft-card";
import type { EmailItem, EventItem } from "./data-cards";
import type { Message, UIBlock } from "./shared";

interface MessageListProps {
  messages: Message[];
  thinking: boolean;
  streaming?: boolean;
  loadingMessages?: boolean;
  toolLabel?: string | null;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  userMsgRefs?: React.RefObject<Map<number, HTMLDivElement>>;
  suppressScrollRef?: React.RefObject<boolean>;
}

// Drains a buffer into displayed text at ~chars/frame rate
function StreamingText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState(active ? "" : text);
  const bufferRef = useRef(active ? text : "");
  const frameRef = useRef<number | null>(null);
  const CHARS_PER_FRAME = 6;

  // Keep buffer in sync with incoming text; flush instantly when stream ends
  useEffect(() => {
    if (!active) {
      if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
      setDisplayed(text);
      return;
    }
    bufferRef.current = text;
  }, [text, active]);

  // Drain loop — only runs while streaming
  useEffect(() => {
    if (!active) return;

    function drain() {
      setDisplayed(prev => {
        const target = bufferRef.current;
        if (prev.length >= target.length) return prev;
        return target.slice(0, prev.length + CHARS_PER_FRAME);
      });
      frameRef.current = requestAnimationFrame(drain);
    }

    frameRef.current = requestAnimationFrame(drain);
    return () => { if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null; } };
  }, [active]);

  return (
    <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-[0.9375rem]
      prose-p:my-1.5 prose-headings:font-semibold prose-headings:text-slate-900
      prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.8em] prose-code:font-mono prose-code:text-slate-700 prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:rounded-xl prose-pre:text-[0.8em]
      prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-slate-900 prose-strong:font-semibold
      prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
      prose-blockquote:border-slate-300 prose-blockquote:text-slate-500">
      <ReactMarkdown>{displayed}</ReactMarkdown>
    </div>
  );
}

function UIBlockRenderer({ block }: { block: UIBlock }) {
  if (block.component === "email_list") return <EmailListCard emails={block.data as EmailItem[]} />;
  if (block.component === "email_card") return <EmailCard email={block.data as EmailItem} />;
  if (block.component === "event_list") return <EventListCard events={block.data as EventItem[]} />;
  if (block.component === "email_draft") return <EmailDraftCard data={block.data as { to: string; subject: string; body: string; threadId?: string }} />;
  if (block.component === "calendar_create") return <CalendarCreateCard data={block.data as Parameters<typeof CalendarCreateCard>[0]["data"]} />;
  if (block.component === "calendar_update") return <CalendarUpdateCard data={block.data as Parameters<typeof CalendarUpdateCard>[0]["data"]} />;
  if (block.component === "calendar_delete") return <CalendarDeleteCard data={block.data as Parameters<typeof CalendarDeleteCard>[0]["data"]} />;
  return null;
}

function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[80, 55, 70].map((w, i) => (
        <div key={i} className="h-4 rounded-full bg-slate-100 animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

function ActionBar({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function toggleFeedback(val: "good" | "bad") {
    setFeedback(prev => prev === val ? null : val);
  }

  return (
    <div className="mt-3">
      <LiquidGlass scale={0.22} radius="9999px" hoverable={false} background="rgba(148,163,184,0.08)" static className="w-fit px-1.5 py-1">
        <div className="flex items-center gap-0.5">
          {/* Copy */}
          <button
            onClick={copy}
            title="Copy"
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-90 ${copied ? "bg-green-100 text-green-600" : "text-slate-400 hover:bg-black/5 hover:text-slate-600"}`}
          >
            {copied ? <Tick01Icon size={14} /> : <Copy01Icon size={14} />}
          </button>
          {/* Thumbs up */}
          <button
            onClick={() => toggleFeedback("good")}
            title="Good response"
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-90 ${feedback === "good" ? "bg-green-100 text-green-600" : "text-slate-400 hover:bg-black/5 hover:text-slate-600"}`}
          >
            <ThumbsUpIcon size={14} />
          </button>
          {/* Thumbs down */}
          <button
            onClick={() => toggleFeedback("bad")}
            title="Bad response"
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-90 ${feedback === "bad" ? "bg-red-100 text-red-500" : "text-slate-400 hover:bg-black/5 hover:text-slate-600"}`}
          >
            <ThumbsDownIcon size={14} />
          </button>
        </div>
      </LiquidGlass>
    </div>
  );
}

export function MessageList({ messages, thinking, streaming, loadingMessages, toolLabel, scrollRef, userMsgRefs, suppressScrollRef }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const THRESHOLD = 80;

  // Detect manual scroll up on the provided scroll container
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    function onScroll() {
      if (!el || suppressScrollRef?.current) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledUp.current = distFromBottom > THRESHOLD;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  const charsSinceScrollRef = useRef(0);
  const lastScrolledTextRef = useRef("");

  useEffect(() => {
    if (userScrolledUp.current || suppressScrollRef?.current) return;

    // Find the streaming assistant message
    const streamingMsg = streaming
      ? messages.findLast(m => m.role === "assistant")
      : null;

    if (streamingMsg && streaming) {
      const newText = streamingMsg.text ?? "";
      const added = newText.length - lastScrolledTextRef.current.length;
      charsSinceScrollRef.current += added;
      lastScrolledTextRef.current = newText;

      if (charsSinceScrollRef.current < 25) return;
      charsSinceScrollRef.current = 0;
    } else {
      // Not streaming (thinking state change, stream end, new message) — always scroll
      charsSinceScrollRef.current = 0;
      lastScrolledTextRef.current = "";
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, streaming, suppressScrollRef]);

  if (loadingMessages) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto w-full">
        <MessageSkeleton />
      </div>
    );
  }

  const lastAssistantIndex = messages.reduce((acc, m, i) => m.role === "assistant" ? i : acc, -1);
  const busy = thinking || streaming;

  return (
    <div className="flex flex-col gap-8 px-6 py-8 max-w-3xl mx-auto w-full">
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          ref={msg.role === "user" ? (el => { if (el) userMsgRefs?.current?.set(msg.id, el); }) : undefined}
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
              {msg.blocks?.map((block, bi) => (
                <UIBlockRenderer key={bi} block={block} />
              ))}
              {msg.text && (
                <StreamingText
                  text={msg.text}
                  active={!!(streaming && i === lastAssistantIndex)}
                />
              )}

              {msg.text && !(busy && i === lastAssistantIndex) && (
                <ActionBar text={msg.text} />
              )}
            </>
          )}
        </div>
      ))}

      <AnimatePresence>
        {(thinking || toolLabel) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 overflow-hidden"
          >
            <RoseSpinner size={40} color="#94a3b8" />
            <AnimatePresence mode="wait">
              {toolLabel && (
                <motion.p
                  key={toolLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="text-[0.9375rem] text-slate-400 animate-pulse"
                >
                  {toolLabel}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
