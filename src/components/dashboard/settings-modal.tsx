"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cancel01Icon } from "hugeicons-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.8 };

export function SettingsModal({ open, onClose }: SettingsModalProps) {
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
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backdropFilter: "blur(12px) brightness(0.92)", WebkitBackdropFilter: "blur(12px) brightness(0.92)", background: "rgba(15,23,42,0.18)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={SPRING}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md" style={{ filter: "drop-shadow(0 32px 64px rgba(15,23,42,0.18))" }}>
            <LiquidGlass
              scale={0.35}
              radius="1.75rem"
              cornerShape="superellipse(1.333)"
              hoverable={false}
              background="rgba(255,255,255,0.88)"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[1.25rem] font-semibold text-slate-800 leading-none">Settings</h2>
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
                      <Cancel01Icon size={16} />
                    </button>
                  </LiquidGlass>
                </div>

                {/* Content placeholder */}
                <div className="space-y-4">
                  <SettingRow label="Account" value="ronish.rohan@gmail.com" />
                  <SettingRow label="Gmail" value="Connected" valueColor="text-green-600" />
                  <SettingRow label="Model" value="DeepSeek V4 Flash" />
                  <div className="h-px bg-slate-200/60 my-2" />
                  <button
                    onClick={onClose}
                    className="w-full text-left text-sm text-red-500 hover:text-red-600 transition-colors px-1 py-1"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </LiquidGlass>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingRow({ label, value, valueColor = "text-slate-500" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`text-sm ${valueColor}`}>{value}</span>
    </div>
  );
}
