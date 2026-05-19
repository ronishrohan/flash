"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ModelId, Effort } from "@/lib/agent";

const MODELS: { id: ModelId; label: string; sub: string }[] = [
  { id: "deepseek-v4-flash", label: "Quick",  sub: "Faster · cheaper" },
  { id: "deepseek-v4-pro",   label: "Pro",    sub: "Smarter · slower" },
];

const EFFORTS: { id: Effort; label: string; sub: string }[] = [
  { id: "low",    label: "Low",    sub: "Faster response" },
  { id: "medium", label: "Medium", sub: "Balanced" },
  { id: "high",   label: "High",   sub: "Deep reasoning" },
];

const MENU_SPRING = { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.7 };

function Picker<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; sub: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium transition-colors ${open ? "bg-slate-100 text-slate-800" : "bg-slate-100/70 text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
      >
        {current.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={MENU_SPRING}
            className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl border border-slate-200 p-1.5 z-50 origin-bottom-left flex flex-col gap-0.5"
            style={{ boxShadow: "0 8px 24px -8px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.06)" }}
          >
            {options.map(o => (
              <button
                key={o.id}
                onClick={() => { onChange(o.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 h-9 rounded-xl text-sm transition-colors ${value === o.id ? "bg-slate-100 text-slate-800 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span>{o.label}</span>
                <span className="text-xs text-slate-400">{o.sub}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChatControlsProps {
  model: ModelId;
  effort: Effort;
  onModelChange: (m: ModelId) => void;
  onEffortChange: (e: Effort) => void;
}

export function ChatControls({ model, effort, onModelChange, onEffortChange }: ChatControlsProps) {
  return (
    <>
      <Picker value={model} options={MODELS} onChange={onModelChange} />
      <Picker value={effort} options={EFFORTS} onChange={onEffortChange} />
    </>
  );
}
