"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { RoseSpinner } from "@/components/ui/rose-spinner";
import { SKY_BG } from "@/components/dashboard/shared";

interface CalendarCreateData {
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  attendeeEmails?: string[];
  addMeet?: boolean;
  calendarId?: string;
}

interface CalendarUpdateData {
  eventId: string;
  calendarId?: string;
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  description?: string;
  location?: string;
  attendeeEmails?: string[];
}

interface CalendarDeleteData {
  eventId: string;
  calendarId?: string;
  // Optional display name passed by agent for UX
  title?: string;
}

type State = "idle" | "confirming" | "done" | "discarded" | "error";

function formatDT(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl px-3.5 py-2.5">
      <p className="text-[0.6875rem] text-slate-400 mb-0.5">{label}</p>
      <p className="text-[0.8125rem] text-slate-800">{value}</p>
    </div>
  );
}

function CardShell({ children, onConfirm, onDiscard, confirmLabel, confirmBg, state, errorMsg }: {
  children: React.ReactNode;
  onConfirm: () => void;
  onDiscard: () => void;
  confirmLabel: string;
  confirmBg?: string;
  state: State;
  errorMsg?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="bg-violet-50 rounded-2xl p-2 flex flex-col gap-1.5"
    >
      {children}
      {errorMsg && <p className="text-[0.75rem] text-red-400 px-1">{errorMsg}</p>}
      <div className="flex items-center gap-2 pt-0.5 px-1">
        <LiquidGlassButton
          onClick={state === "confirming" ? undefined : onConfirm}
          background={confirmBg ?? SKY_BG}
          className="text-[0.8125rem] font-medium px-5 py-2"
        >
          {state === "confirming"
            ? <span className="flex items-center gap-2"><RoseSpinner size={14} color="white" />Working</span>
            : confirmLabel}
        </LiquidGlassButton>
        <LiquidGlassButton
          onClick={state === "confirming" ? undefined : onDiscard}
          background="linear-gradient(135deg, #64748b, #94a3b8)"
          className="text-[0.8125rem] px-4 py-2"
        >
          Cancel
        </LiquidGlassButton>
      </div>
    </motion.div>
  );
}

// ─── Create ──────────────────────────────────────────────────────

export function CalendarCreateCard({ data }: { data: CalendarCreateData }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (state === "done") return <Done text={`Event "${data.title}" created.`} />;
  if (state === "discarded") return <Cancelled />;

  async function confirm() {
    setState("confirming");
    try {
      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create event");
      setState("error");
    }
  }

  return (
    <CardShell onConfirm={confirm} onDiscard={() => setState("discarded")} confirmLabel="Create event" confirmBg="linear-gradient(135deg, #7c3aed, #a78bfa)" state={state} errorMsg={errorMsg}>
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <span className="text-[0.6875rem] font-medium text-violet-400 uppercase tracking-wide">New event</span>
      </div>
      <Row label="Title" value={data.title} />
      <Row label="Start" value={formatDT(data.startDateTime)} />
      <Row label="End" value={formatDT(data.endDateTime)} />
      {data.location && <Row label="Location" value={data.location} />}
      {data.description && <Row label="Description" value={data.description} />}
      {data.attendeeEmails?.length ? <Row label="Guests" value={data.attendeeEmails.join(", ")} /> : null}
      {data.addMeet && <Row label="Meet link" value="Will be added" />}
    </CardShell>
  );
}

// ─── Update ──────────────────────────────────────────────────────

export function CalendarUpdateCard({ data }: { data: CalendarUpdateData }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (state === "done") return <Done text="Event updated." />;
  if (state === "discarded") return <Cancelled />;

  async function confirm() {
    setState("confirming");
    try {
      const res = await fetch("/api/calendar/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update event");
      setState("error");
    }
  }

  const changes = [
    data.title && ["Title", data.title],
    data.startDateTime && ["Start", formatDT(data.startDateTime)],
    data.endDateTime && ["End", formatDT(data.endDateTime)],
    data.location && ["Location", data.location],
    data.description && ["Description", data.description],
    data.attendeeEmails?.length && ["Guests", data.attendeeEmails.join(", ")],
  ].filter(Boolean) as [string, string][];

  return (
    <CardShell onConfirm={confirm} onDiscard={() => setState("discarded")} confirmLabel="Save changes" confirmBg="linear-gradient(135deg, #7c3aed, #a78bfa)" state={state} errorMsg={errorMsg}>
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <span className="text-[0.6875rem] font-medium text-violet-400 uppercase tracking-wide">Update event</span>
      </div>
      {changes.map(([label, value]) => <Row key={label} label={label} value={value} />)}
    </CardShell>
  );
}

// ─── Delete ──────────────────────────────────────────────────────

export function CalendarDeleteCard({ data }: { data: CalendarDeleteData }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (state === "done") return <Done text="Event deleted." />;
  if (state === "discarded") return <Cancelled />;

  async function confirm() {
    setState("confirming");
    try {
      const res = await fetch("/api/calendar/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId: data.eventId, calendarId: data.calendarId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete event");
      setState("error");
    }
  }

  return (
    <CardShell
      onConfirm={confirm}
      onDiscard={() => setState("discarded")}
      confirmLabel="Delete"
      confirmBg="linear-gradient(135deg, #ef4444, #f87171)"
      state={state}
      errorMsg={errorMsg}
    >
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <span className="text-[0.6875rem] font-medium text-red-400 uppercase tracking-wide">Delete event</span>
      </div>
      <div className="bg-white rounded-xl px-3.5 py-2.5">
        <p className="text-[0.8125rem] text-slate-700">
          {data.title ? `Delete "${data.title}"?` : "Delete this event? This cannot be undone."}
        </p>
      </div>
    </CardShell>
  );
}

// ─── Shared states ───────────────────────────────────────────────

function Done({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-violet-50 rounded-2xl px-4 py-3 text-[0.8125rem] text-violet-500"
    >
      {text}
    </motion.div>
  );
}

function Cancelled() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-violet-50 rounded-2xl px-4 py-3 text-[0.8125rem] text-violet-300"
    >
      Cancelled.
    </motion.div>
  );
}
