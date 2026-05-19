"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileIcon, Settings02Icon, HelpCircleIcon, Logout02Icon } from "hugeicons-react";

interface AccountMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onProfile: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onSignOut: () => void;
  displayName: string;
  email?: string;
}

const ITEM_CLASS = "w-full flex items-center gap-2.5 h-9 px-3 rounded-xl text-[0.875rem] text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-transform";
const MENU_WIDTH = 220;
const MENU_GAP = 8;

export function AccountMenu({
  open,
  onClose,
  anchorRef,
  onProfile,
  onSettings,
  onHelp,
  onSignOut,
  displayName,
  email,
}: AccountMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    function compute() {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_WIDTH - 8));
      const bottom = window.innerHeight - r.top + MENU_GAP;
      setPos({ left, bottom });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && ref.current.contains(e.target as Node)) return;
      if (anchorRef.current && anchorRef.current.contains(e.target as Node)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.7 }}
          className="fixed origin-bottom z-50 bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-col gap-0.5"
          style={{
            left: pos.left,
            bottom: pos.bottom,
            width: MENU_WIDTH,
            boxShadow: "0 10px 30px -10px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.06)",
          }}
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[0.875rem] font-medium text-slate-800 truncate">{displayName}</p>
            {email && email !== displayName && (
              <p className="text-[0.75rem] text-slate-500 truncate">{email}</p>
            )}
          </div>
          <button className={ITEM_CLASS} onClick={() => { onClose(); onProfile(); }}>
            <ProfileIcon size={16} className="shrink-0 text-slate-500" />
            <span>Profile</span>
          </button>
          <button className={ITEM_CLASS} onClick={() => { onClose(); onSettings(); }}>
            <Settings02Icon size={16} className="shrink-0 text-slate-500" />
            <span>Settings</span>
          </button>
          <button className={ITEM_CLASS} onClick={() => { onClose(); onHelp(); }}>
            <HelpCircleIcon size={16} className="shrink-0 text-slate-500" />
            <span>Help</span>
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            className={`${ITEM_CLASS} text-red-600 hover:bg-red-50`}
            onClick={() => { onClose(); onSignOut(); }}
          >
            <Logout02Icon size={16} className="shrink-0" />
            <span>Log out</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
