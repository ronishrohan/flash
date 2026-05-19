"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import type { ModelId, Effort } from "@/lib/agent";

const MODELS: { id: ModelId; label: string; sub: string }[] = [
  { id: "deepseek-v4-flash", label: "Quick", sub: "Faster · cheaper" },
  { id: "deepseek-v4-pro",   label: "Pro",   sub: "Smarter · slower" },
];

const EFFORTS: { id: Effort; label: string; sub: string }[] = [
  { id: "low",    label: "Low",    sub: "Faster" },
  { id: "medium", label: "Medium", sub: "Balanced" },
  { id: "high",   label: "High",   sub: "Deep reasoning" },
];

const MENU_SPRING = { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.7 };
const GAP = 8;

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
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.id === value) ?? options[0];

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    function compute() {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      setPos({ left: r.left, bottom: window.innerHeight - r.top + GAP });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={triggerRef} className="relative">
      <LiquidGlass
        scale={0.28}
        radius="9999px"
        hoverable
        background="rgba(148,163,184,0.12)"
        whileTap={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
      >
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium transition-colors ${open ? "text-slate-800" : "text-slate-500"}`}
        >
          {current.label}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </LiquidGlass>

      {mounted && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={MENU_SPRING}
              className="fixed z-[9999] origin-bottom-left"
              style={{
                left: pos.left,
                bottom: pos.bottom,
                boxShadow: "0 16px 40px -12px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              <LiquidGlass
                static
                hoverable={false}
                radius="0.875rem"
                background="rgba(255,255,255,0.92)"
                className="p-1"
              >
                {options.map(o => (
                  <button
                    key={o.id}
                    onClick={() => { onChange(o.id); setOpen(false); }}
                    className={`flex items-center justify-between gap-5 w-full px-3 h-8 rounded-[0.625rem] text-[0.8125rem] whitespace-nowrap transition-colors ${value === o.id ? "bg-black/5 text-slate-800 font-medium" : "text-slate-500 hover:bg-black/[0.03] hover:text-slate-700"}`}
                  >
                    <span>{o.label}</span>
                    <span className="text-[0.7rem] text-slate-400 font-normal">{o.sub}</span>
                  </button>
                ))}
              </LiquidGlass>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
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
