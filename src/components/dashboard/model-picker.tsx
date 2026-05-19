"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ModelId } from "@/lib/agent";

const MODELS: { id: ModelId; label: string; description: string }[] = [
  { id: "deepseek-v4-flash", label: "Quick",  description: "Faster, cheaper" },
  { id: "deepseek-v4-pro",   label: "Pro",    description: "Smarter, slower" },
];

interface ModelPickerProps {
  model: ModelId;
  onModelChange: (m: ModelId) => void;
}

export function ModelPicker({ model, onModelChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = MODELS.find(m => m.id === model) ?? MODELS[0];

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
        className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium transition-colors ${open ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
      >
        {current.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.7 }}
            className="absolute bottom-full left-0 mb-2 w-44 bg-white rounded-2xl border border-slate-200 p-1.5 z-50 origin-bottom-left"
            style={{ boxShadow: "0 8px 24px -8px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.06)" }}
          >
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => { onModelChange(m.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 h-9 rounded-xl text-sm transition-colors ${model === m.id ? "bg-slate-100 text-slate-800 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span>{m.label}</span>
                <span className="text-xs text-slate-400">{m.description}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
