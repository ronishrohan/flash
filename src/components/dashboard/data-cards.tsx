"use client";

import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
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

// ── Email list card ───────────────────────────────────────────────────────────

export function EmailListCard({ emails }: { emails: EmailItem[] }) {
  if (!emails?.length) return null;

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden bg-white">
      {emails.map((email, i) => (
        <div
          key={email.id}
          className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-default ${i < emails.length - 1 ? "border-b border-slate-100" : ""}`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-medium text-slate-500 mt-0.5">
            {senderInitial(email.from)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.8125rem] font-medium text-slate-700 truncate">{senderName(email.from)}</span>
              <span className="text-[0.75rem] text-slate-400 shrink-0">{formatDate(email.date)}</span>
            </div>
            <p className="text-[0.8125rem] text-slate-800 truncate leading-snug">{email.subject}</p>
            <p className="text-[0.75rem] text-slate-400 truncate leading-snug mt-0.5">{email.snippet}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Single email card ─────────────────────────────────────────────────────────

export function EmailCard({ email }: { email: EmailItem }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100">
        <p className="text-[0.9375rem] font-medium text-slate-900 leading-snug">{email.subject}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[0.8125rem] text-slate-500">{senderName(email.from)}</span>
          <span className="text-[0.75rem] text-slate-400">{formatDate(email.date)}</span>
        </div>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[0.8125rem] text-slate-700 leading-relaxed whitespace-pre-wrap">
          {email.body?.slice(0, 800) ?? email.snippet}
        </p>
      </div>
    </div>
  );
}

// ── Calendar event list card ──────────────────────────────────────────────────

export function EventListCard({ events }: { events: EventItem[] }) {
  if (!events?.length) return null;

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden bg-white">
      {events.map((event, i) => (
        <div
          key={event.id}
          className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-default ${i < events.length - 1 ? "border-b border-slate-100" : ""}`}
        >
          {/* Color dot */}
          <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-medium text-slate-800 truncate">{event.title}</p>
            <p className="text-[0.75rem] text-slate-400 leading-snug mt-0.5">{formatEventTime(event.start, event.end)}</p>
            {event.location && (
              <p className="text-[0.75rem] text-slate-400 truncate mt-0.5">{event.location}</p>
            )}
            {event.meetLink && (
              <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                className="text-[0.75rem] text-sky-600 hover:underline mt-0.5 block">
                Join Meet
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
