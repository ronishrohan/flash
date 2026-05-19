"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { SKY_BG } from "@/components/dashboard/shared";

interface EmailDraftData {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}

interface Props {
  data: EmailDraftData;
}

type State = "idle" | "sending" | "sent" | "discarded" | "error";

export function EmailDraftCard({ data }: Props) {
  const [to, setTo] = useState(data.to);
  const [subject, setSubject] = useState(data.subject);
  const [body, setBody] = useState(data.body);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [editing, setEditing] = useState(false);

  async function handleSend() {
    setState("sending");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, subject, body, threadId: data.threadId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-100 rounded-2xl px-4 py-3 text-[0.8125rem] text-slate-500"
      >
        Email sent to {to}.
      </motion.div>
    );
  }

  if (state === "discarded") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-100 rounded-2xl px-4 py-3 text-[0.8125rem] text-slate-400"
      >
        Draft discarded.
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="bg-slate-100 rounded-2xl p-2 flex flex-col gap-1.5"
    >
      {/* Header */}
      <div className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between">
        <span className="text-[0.6875rem] font-medium text-slate-400 uppercase tracking-wide">Draft</span>
        <button
          onClick={() => setEditing(e => !e)}
          className="text-[0.75rem] text-sky-500 hover:text-sky-600 transition-colors"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {/* To */}
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <p className="text-[0.6875rem] text-slate-400 mb-0.5">To</p>
        {editing ? (
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full text-[0.8125rem] text-slate-800 outline-none bg-transparent"
          />
        ) : (
          <p className="text-[0.8125rem] text-slate-800">{to}</p>
        )}
      </div>

      {/* Subject */}
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <p className="text-[0.6875rem] text-slate-400 mb-0.5">Subject</p>
        {editing ? (
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full text-[0.8125rem] font-medium text-slate-800 outline-none bg-transparent"
          />
        ) : (
          <p className="text-[0.8125rem] font-medium text-slate-800">{subject}</p>
        )}
      </div>

      {/* Body */}
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <p className="text-[0.6875rem] text-slate-400 mb-0.5">Body</p>
        {editing ? (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            className="w-full text-[0.8125rem] text-slate-700 leading-relaxed outline-none bg-transparent resize-none"
          />
        ) : (
          <p className="text-[0.8125rem] text-slate-700 leading-relaxed whitespace-pre-wrap">{body}</p>
        )}
      </div>

      {state === "error" && (
        <p className="text-[0.75rem] text-red-400 px-1">{errorMsg}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5 px-1">
        <LiquidGlassButton
          onClick={handleSend}
          disabled={state === "sending"}
          background={SKY_BG}
          className="text-[0.8125rem] font-medium px-5 py-2"
        >
          {state === "sending" ? "Sending…" : "Send"}
        </LiquidGlassButton>
        <LiquidGlassButton
          onClick={() => setState("discarded")}
          disabled={state === "sending"}
          background="linear-gradient(135deg, #94a3b8, #cbd5e1)"
          className="text-[0.8125rem] px-4 py-2"
        >
          Discard
        </LiquidGlassButton>
      </div>
    </motion.div>
  );
}
