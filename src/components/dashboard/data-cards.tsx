"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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

function senderName(from: string) {
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

// ── Email list ────────────────────────────────────────────────────────────────

export function EmailListCard({ emails }: { emails: EmailItem[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!emails?.length) return null;
  const visible = expanded ? emails : emails.slice(0, MAX_VISIBLE);
  const hidden = emails.length - MAX_VISIBLE;
  return (
    <Container>
      <div className="flex items-center gap-1.5 px-1 pt-0.5 pb-0.5">
        <svg width="12" height="12" viewBox="0 0 48 48" fill="none"><path d="M44 8H4C1.79 8 0 9.79 0 12v24c0 2.21 1.79 4 4 4h40c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4z" fill="#fff"/><path d="M44 8H4L24 28 44 8z" fill="#EA4335"/><path d="M0 12v24l12-12L0 12z" fill="#34A853"/><path d="M48 12v24L36 24 48 12z" fill="#FBBC05"/><path d="M4 8l20 20L44 8H4z" fill="#EA4335"/><path d="M0 36l12-12 12 12-12 4L0 36z" fill="#34A853"/><path d="M48 36L36 24 24 36l12 4 12-4z" fill="#FBBC05"/><path d="M24 36L12 24l-12 12h48L36 24 24 36z" fill="#4285F4"/></svg>
        <span className="text-[0.6875rem] font-medium text-slate-400">Gmail</span>
      </div>
      {visible.map((email, i) => (
        <a
          key={email.id}
          href={`https://mail.google.com/mail/u/0/#all/${email.threadId ?? email.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Item index={i}>
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
              </div>
            </div>
          </Item>
        </a>
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

export function EmailCard({ email }: { email: EmailItem }) {
  return (
    <Container>
      <a
        href={`https://mail.google.com/mail/u/0/#all/${email.threadId ?? email.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Item>
          <p className="text-[0.875rem] font-semibold text-slate-900 leading-snug">{email.subject}</p>
          <div className="flex items-center justify-between mt-1 mb-2.5">
            <span className="text-[0.75rem] text-slate-500">{senderName(email.from)}</span>
            <span className="text-[0.6875rem] text-slate-400">{formatDate(email.date)}</span>
          </div>
          <p className="text-[0.8125rem] text-slate-700 leading-relaxed whitespace-pre-wrap">
            {email.body?.slice(0, 800) ?? email.snippet}
          </p>
        </Item>
      </a>
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
    <motion.div layout className="mt-3 rounded-2xl p-2 flex flex-col gap-1.5" style={{ background: "#fffbeb" }}>
      <div className="flex items-center gap-1.5 px-1 pt-0.5 pb-0.5">
        <svg width="12" height="12" viewBox="0 0 48 48" fill="none"><rect x="4" y="8" width="40" height="36" rx="3" fill="#fff"/><rect x="4" y="8" width="40" height="10" rx="3" fill="#1a73e8"/><rect x="14" y="4" width="4" height="8" rx="2" fill="#1a73e8"/><rect x="30" y="4" width="4" height="8" rx="2" fill="#1a73e8"/><rect x="10" y="24" width="6" height="6" rx="1" fill="#EA4335"/><rect x="21" y="24" width="6" height="6" rx="1" fill="#FBBC04"/><rect x="32" y="24" width="6" height="6" rx="1" fill="#34A853"/><rect x="10" y="34" width="6" height="6" rx="1" fill="#FBBC04"/><rect x="21" y="34" width="6" height="6" rx="1" fill="#34A853"/><rect x="32" y="34" width="6" height="6" rx="1" fill="#EA4335"/></svg>
        <span className="text-[0.6875rem] font-medium text-slate-400">Calendar</span>
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
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#FBBC04" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] font-medium text-slate-800 truncate">{event.title}</p>
              <p className="text-[0.75rem] leading-snug mt-0.5" style={{ color: "#d97706" }}>{formatEventTime(event.start, event.end)}</p>
              {event.location && (
                <p className="text-[0.75rem] text-slate-400 truncate mt-0.5">{event.location}</p>
              )}
              {event.meetLink && (
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                  className="text-[0.75rem] hover:underline mt-0.5 inline-block" style={{ color: "#d97706" }}>
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
          className="w-full text-center text-[0.8125rem] py-1.5 transition-colors"
          style={{ color: "#d97706" }}
        >
          Show {hidden} more
        </button>
      )}
    </motion.div>
  );
}
