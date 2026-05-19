"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
  const [pos, setPos] = useState<{ left: number; bottom: number; width: number } | null>(null);
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
      const left = r.left;
      const bottom = window.innerHeight - r.top + MENU_GAP;
      setPos({ left, bottom, width: Math.max(r.width, 220) });
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
    <>
      {open && pos && (
        <div
          ref={ref}
          className="fixed origin-bottom z-50 bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-col gap-0.5"
          style={{
            left: pos.left,
            bottom: pos.bottom,
            width: pos.width,
            boxShadow: "0 4px 16px -4px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)",
          }}
        >
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
        </div>
      )}
    </>,
    document.body,
  );
}
