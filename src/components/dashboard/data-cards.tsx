"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail01Icon, Calendar01Icon, MailReply01Icon, Archive02Icon, Delete02Icon, ArrowUp02Icon } from "hugeicons-react";

const MAX_VISIBLE = 4;

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.28, ease: "easeOut" as const, delay: i * 0.055 },
  }),
};

export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
  threadId?: string;
  to?: string;
}

export interface EmailCardActions {
  onReply?: (email: EmailItem, intent: string) => void;
}

export interface EventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  meetLink?: string;
  description?: string;
}

export function senderName(from: string) {
  const m = from.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : from.split("@")[0];
}

function senderInitial(from: string) {
  return senderName(from)[0]?.toUpperCase() ?? "?";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEventTime(start: string, end: string) {
  if (!start) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime())) return start;
  const date = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeFrom = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const timeTo = isNaN(e.getTime()) ? "" : ` – ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  return `${date}, ${timeFrom}${timeTo}`;
}

// Container + item primitives
function Container({ children }: { children: React.ReactNode }) {
  return (
    <motion.div layout className="mt-3 rounded-2xl bg-slate-100 p-2 flex flex-col gap-1.5">
      {children}
    </motion.div>
  );
}

function Item({ children, onClick, index = 0 }: { children: React.ReactNode; onClick?: () => void; index?: number }) {
  return (
    <motion.div
      custom={index}
      variants={ITEM_VARIANTS}
      initial="hidden"
      animate="show"
      onClick={onClick}
      className={`rounded-xl bg-white px-3.5 py-3 ${onClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
    >
      {children}
    </motion.div>
  );
}

type ActionState = null | "archiving" | "archived" | "trashing" | "trashed";

function EmailActions({
  email,
  actions,
  actionState,
  onAction,
  errorMessage,
}: {
  email: EmailItem;
  actions?: EmailCardActions;
  actionState: ActionState;
  onAction: (type: "archive" | "trash") => void;
  errorMessage?: string;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const busy = actionState === "archiving" || actionState === "trashing";

  function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    actions?.onReply?.(email, trimmed);
    setReplyOpen(false);
    setReplyText("");
  }

  return (
    <div className="mt-2">
      {errorMessage && <p role="alert" className="mb-1.5 text-[0.6875rem] text-rose-500">{errorMessage}</p>}
      <div className="flex items-center gap-2">
        {actions?.onReply && !replyOpen && (
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              setReplyOpen(true);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1 text-[0.75rem] font-medium text-sky-500 hover:text-sky-600 transition-colors"
          >
            <MailReply01Icon size={13} /> Reply
          </button>
        )}
        <button
          disabled={busy || !!actionState}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAction("archive"); }}
          className="flex items-center gap-1 text-[0.75rem] font-medium text-slate-400 hover:text-slate-600 transition-colors disabled:pointer-events-none"
        >
          {actionState === "archiving" ? (
            <span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <Archive02Icon size={13} />
          )}
          Archive
        </button>
        <button
          disabled={busy || !!actionState}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAction("trash"); }}
          className="flex items-center gap-1 text-[0.75rem] font-medium text-slate-400 hover:text-rose-500 transition-colors disabled:pointer-events-none"
        >
          {actionState === "trashing" ? (
            <span className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <Delete02Icon size={13} />
          )}
          Trash
        </button>
      </div>

      <AnimatePresence>
        {replyOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pb-0.5 px-0.5 flex items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); }
                  if (e.key === "Escape") { setReplyOpen(false); setReplyText(""); }
                }}
                placeholder="What should this reply be about?"
                rows={2}
                className="flex-1 text-[0.75rem] text-slate-700 placeholder-slate-400 bg-slate-100 rounded-lg px-2.5 py-1.5 resize-none outline-none focus:ring-1 focus:ring-sky-300"
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="w-6 h-6 rounded-md bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0 mb-0.5"
              >
                <ArrowUp02Icon size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

async function runEmailAction(emailId: string, type: "archive" | "trash") {
  const url = type === "archive" ? "/api/gmail/archive" : "/api/gmail/trash";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId: emailId }),
  });
  if (!res.ok) throw new Error(await res.text());
}

function DoneOverlay({ state }: { state: ActionState }) {
  if (state !== "archived" && state !== "trashed") return null;
  const isArchived = state === "archived";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`absolute inset-0 rounded-xl flex items-center justify-center gap-1.5 ${
        isArchived ? "bg-slate-200/90" : "bg-rose-50/90"
      }`}
    >
      {isArchived ? (
        <><Archive02Icon size={14} className="text-slate-500" /><span className="text-[0.8125rem] font-medium text-slate-500">Archived</span></>
      ) : (
        <><Delete02Icon size={14} className="text-rose-400" /><span className="text-[0.8125rem] font-medium text-rose-400">Trashed</span></>
      )}
    </motion.div>
  );
}

// ── Email list ────────────────────────────────────────────────────────────────

function EmailRow({ email, index, actions }: { email: EmailItem; index: number; actions?: EmailCardActions }) {
  const [actionState, setActionState] = useState<ActionState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAction(type: "archive" | "trash") {
    setErrorMessage(null);
    setActionState(type === "archive" ? "archiving" : "trashing");
    try {
      await runEmailAction(email.id, type);
      setActionState(type === "archive" ? "archived" : "trashed");
    } catch (err) {
      setActionState(null);
      setErrorMessage(err instanceof Error ? err.message : "Could not update this email. Try again.");
    }
  }

  return (
    <Item
      index={index}
      onClick={() => window.open(`https://mail.google.com/mail/u/0/#all/${email.threadId ?? email.id}`, "_blank", "noopener,noreferrer")}
    >
      <div className="relative">
        <div className={`flex items-center gap-2.5 ${actionState === "archived" || actionState === "trashed" ? "opacity-30" : ""}`}>
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[0.6875rem] font-semibold text-slate-500">
            {senderInitial(email.from)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.8125rem] font-medium text-slate-700 truncate">{senderName(email.from)}</span>
              <span className="text-[0.6875rem] text-slate-400 shrink-0">{formatDate(email.date)}</span>
            </div>
            <p className="text-[0.8125rem] text-slate-800 truncate leading-snug">{email.subject}</p>
            <p className="text-[0.75rem] text-slate-400 truncate leading-snug mt-0.5">{email.snippet}</p>
            <EmailActions email={email} actions={actions} actionState={actionState} onAction={handleAction} errorMessage={errorMessage ?? undefined} />
          </div>
        </div>
        <DoneOverlay state={actionState} />
      </div>
    </Item>
  );
}

export function EmailListCard({ emails, actions }: { emails: EmailItem[]; actions?: EmailCardActions }) {
  const [expanded, setExpanded] = useState(false);
  if (!emails?.length) return null;
  const visible = expanded ? emails : emails.slice(0, MAX_VISIBLE);
  const hidden = emails.length - MAX_VISIBLE;
  return (
    <Container>
      <div className="flex items-center gap-1.5 px-1 pt-0.5 pb-0.5">
        <Mail01Icon size={12} className="text-slate-400" />
        <span className="text-[0.6875rem] font-medium text-slate-400">Gmail</span>
      </div>
      {visible.map((email, i) => (
        <EmailRow key={email.id} email={email} index={i} actions={actions} />
      ))}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center text-[0.8125rem] text-slate-400 hover:text-slate-600 py-1.5 transition-colors"
        >
          Show {hidden} more
        </button>
      )}
    </Container>
  );
}

// ── Single email ──────────────────────────────────────────────────────────────

export function EmailCard({ email, actions }: { email: EmailItem; actions?: EmailCardActions }) {
  const [actionState, setActionState] = useState<ActionState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAction(type: "archive" | "trash") {
    setErrorMessage(null);
    setActionState(type === "archive" ? "archiving" : "trashing");
    try {
      await runEmailAction(email.id, type);
      setActionState(type === "archive" ? "archived" : "trashed");
    } catch (err) {
      setActionState(null);
      setErrorMessage(err instanceof Error ? err.message : "Could not update this email. Try again.");
    }
  }

  return (
    <Container>
      <Item
        onClick={() => window.open(`https://mail.google.com/mail/u/0/#all/${email.threadId ?? email.id}`, "_blank", "noopener,noreferrer")}
      >
        <div className="relative">
          <div className={actionState === "archived" || actionState === "trashed" ? "opacity-30" : ""}>
            <p className="text-[0.875rem] font-semibold text-slate-900 leading-snug">{email.subject}</p>
            <div className="flex items-center justify-between mt-1 mb-2.5">
              <span className="text-[0.75rem] text-slate-500">{senderName(email.from)}</span>
              <span className="text-[0.6875rem] text-slate-400">{formatDate(email.date)}</span>
            </div>
            <p className="text-[0.8125rem] text-slate-700 leading-relaxed whitespace-pre-wrap">
              {email.body?.slice(0, 800) ?? email.snippet}
            </p>
            <EmailActions email={email} actions={actions} actionState={actionState} onAction={handleAction} errorMessage={errorMessage ?? undefined} />
          </div>
          <DoneOverlay state={actionState} />
        </div>
      </Item>
    </Container>
  );
}

// ── Event list ────────────────────────────────────────────────────────────────

export function EventListCard({ events }: { events: EventItem[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!events?.length) return null;
  const visible = expanded ? events : events.slice(0, MAX_VISIBLE);
  const hidden = events.length - MAX_VISIBLE;
  return (
    <motion.div layout className="mt-3 rounded-2xl p-2 flex flex-col gap-1.5 bg-violet-50">
      <div className="flex items-center gap-1.5 px-1 pt-0.5 pb-0.5">
        <Calendar01Icon size={12} className="text-violet-400" />
        <span className="text-[0.6875rem] font-medium text-violet-400">Calendar</span>
      </div>
      {visible.map((event, i) => (
        <motion.div
          key={event.id ?? i}
          custom={i}
          variants={ITEM_VARIANTS}
          initial="hidden"
          animate="show"
          className="rounded-xl bg-white px-3.5 py-3"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] font-medium text-slate-800 truncate">{event.title}</p>
              <p className="text-[0.75rem] text-violet-400 leading-snug mt-0.5">{formatEventTime(event.start, event.end)}</p>
              {event.location && (
                <p className="text-[0.75rem] text-slate-400 truncate mt-0.5">{event.location}</p>
              )}
              {event.meetLink && (
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                  className="text-[0.75rem] text-violet-500 hover:underline mt-0.5 inline-block">
                  Join Meet
                </a>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center text-[0.8125rem] text-violet-400 hover:text-violet-600 py-1.5 transition-colors"
        >
          Show {hidden} more
        </button>
      )}
    </motion.div>
  );
}
