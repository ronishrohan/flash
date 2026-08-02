"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail01Icon, Calendar01Icon, MailReply01Icon, Archive02Icon, Delete02Icon } from "hugeicons-react";

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
  onReply?: (email: EmailItem) => void;
  onArchive?: (email: EmailItem) => void;
  onTrash?: (email: EmailItem) => void;
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

function EmailActions({ email, actions }: { email: EmailItem; actions?: EmailCardActions }) {
  if (!actions?.onReply && !actions?.onArchive && !actions?.onTrash) return null;
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {actions.onReply && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.onReply!(email); }}
          className="flex items-center gap-1 text-[0.75rem] font-medium text-sky-500 hover:text-sky-600 transition-colors"
        >
          <MailReply01Icon size={13} /> Reply
        </button>
      )}
      {actions.onArchive && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.onArchive!(email); }}
          className="flex items-center gap-1 text-[0.75rem] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Archive02Icon size={13} /> Archive
        </button>
      )}
      {actions.onTrash && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.onTrash!(email); }}
          className="flex items-center gap-1 text-[0.75rem] font-medium text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Delete02Icon size={13} /> Trash
        </button>
      )}
    </div>
  );
}

// ── Email list ────────────────────────────────────────────────────────────────

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
        <Item
          key={email.id}
          index={i}
          onClick={() => window.open(`https://mail.google.com/mail/u/0/#all/${email.threadId ?? email.id}`, "_blank", "noopener,noreferrer")}
        >
          <div className="flex items-center gap-2.5">
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
              <EmailActions email={email} actions={actions} />
            </div>
          </div>
        </Item>
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
  return (
    <Container>
      <Item
        onClick={() => window.open(`https://mail.google.com/mail/u/0/#all/${email.threadId ?? email.id}`, "_blank", "noopener,noreferrer")}
      >
        <p className="text-[0.875rem] font-semibold text-slate-900 leading-snug">{email.subject}</p>
        <div className="flex items-center justify-between mt-1 mb-2.5">
          <span className="text-[0.75rem] text-slate-500">{senderName(email.from)}</span>
          <span className="text-[0.6875rem] text-slate-400">{formatDate(email.date)}</span>
        </div>
        <p className="text-[0.8125rem] text-slate-700 leading-relaxed whitespace-pre-wrap">
          {email.body?.slice(0, 800) ?? email.snippet}
        </p>
        <EmailActions email={email} actions={actions} />
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
