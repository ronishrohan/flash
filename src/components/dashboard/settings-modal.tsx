"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cancel01Icon, UserIcon, Mail01Icon, AiBrain01Icon, Notification01Icon, LockIcon } from "hugeicons-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const TRANSITION = { duration: 0.15, ease: "easeOut" } as const;

const SECTIONS = [
  { id: "account",       label: "Account",       icon: UserIcon },
  { id: "gmail",         label: "Gmail",          icon: Mail01Icon },
  { id: "notifications", label: "Notifications",  icon: Notification01Icon },
  { id: "privacy",       label: "Privacy",        icon: LockIcon },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("account");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ backdropFilter: "blur(10px) brightness(0.94)", WebkitBackdropFilter: "blur(10px) brightness(0.94)", background: "rgba(15,23,42,0.12)" }}
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={TRANSITION}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto bg-white rounded-[1.75rem] overflow-hidden flex"
              style={{
                width: "min(860px, 90vw)",
                height: "min(580px, 85vh)",
                boxShadow: "0 8px 40px -8px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.06)",
              }}
            >
              {/* Sidebar */}
              <div className="w-52 shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col p-3 gap-0.5">
                <p className="px-4 pt-2 pb-1.5 text-xs text-slate-400">Settings</p>
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`w-full flex items-center gap-2.5 px-4 h-10 rounded-full text-[0.9375rem] active:scale-[0.97] transition-transform ${activeSection === id ? "bg-slate-100 text-slate-800 font-medium" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"}`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </button>
                ))}
                <div className="flex-1" />
                <LiquidGlass scale={0.22} radius="9999px" hoverable={false} dark background="rgba(220,38,38,0.85)" static className="w-full">
                  <button className="w-full flex items-center justify-center h-10 text-[0.9375rem] text-white active:scale-[0.97] transition-transform">
                    Sign out
                  </button>
                </LiquidGlass>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-slate-100">
                  <h2 className="text-[1.0625rem] font-semibold text-slate-800">
                    {SECTIONS.find(s => s.id === activeSection)?.label}
                  </h2>
                  <LiquidGlass
                    scale={0.25}
                    radius="9999px"
                    hoverable
                    background="rgba(148,163,184,0.12)"
                    whileTap={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  >
                    <button
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Cancel01Icon size={15} />
                    </button>
                  </LiquidGlass>
                </div>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <SectionContent id={activeSection} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionContent({ id }: { id: string }) {
  switch (id) {
    case "account": return (
      <div className="space-y-6">
        <Field label="Display name" value="Ronish Rohan" />
        <Field label="Email" value="ronish.rohan@gmail.com" readonly />
        <div className="h-px bg-slate-100" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <button className="self-start text-sm text-sky-600 hover:text-sky-700 transition-colors">Change password</button>
        </div>
      </div>
    );
    case "gmail": return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Gmail connection</p>
            <p className="text-xs text-slate-400 mt-0.5">Read and manage your inbox</p>
          </div>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Connected</span>
        </div>
        <div className="h-px bg-slate-100" />
        <button className="text-sm text-red-500 hover:text-red-600 transition-colors">Disconnect Gmail</button>
      </div>
    );
    case "ai": return (
      <div className="space-y-6">
        <Field label="Default model" value="Quick (DeepSeek V4 Flash)" />
        <Field label="Default effort" value="Balanced" />
        <div className="h-px bg-slate-100" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Reasoning</span>
          <p className="text-xs text-slate-400">Controls how deeply the model thinks before responding.</p>
        </div>
      </div>
    );
    case "notifications": return (
      <div className="space-y-4">
        <Toggle label="Email digests" sub="Weekly summary of your inbox activity" />
        <Toggle label="Important email alerts" sub="Notify when high-priority emails arrive" />
        <Toggle label="Conversation summaries" sub="Get summaries after long threads" defaultOn />
      </div>
    );
    case "privacy": return (
      <div className="space-y-4">
        <Toggle label="Store conversation history" sub="Save chats for later reference" defaultOn />
        <Toggle label="Improve Flash with my data" sub="Help train future versions" />
        <div className="h-px bg-slate-100 my-2" />
        <button className="text-sm text-red-500 hover:text-red-600 transition-colors">Delete all conversations</button>
      </div>
    );
    default: return null;
  }
}

function Field({ label, value, readonly }: { label: string; value: string; readonly?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        defaultValue={value}
        readOnly={readonly}
        className={`h-9 px-3 rounded-xl border text-sm text-slate-800 outline-none transition-colors ${readonly ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-white border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"}`}
      />
    </div>
  );
}

function Toggle({ label, sub, defaultOn = false }: { label: string; sub: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className={`w-10 h-6 rounded-full shrink-0 transition-colors relative ${on ? "bg-slate-900" : "bg-slate-200"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );
}
