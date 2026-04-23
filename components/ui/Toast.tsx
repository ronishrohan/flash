"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon, Alert02Icon } from "@hugeicons/core-free-icons";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextType = {
  notify: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType>({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const toneStyles: Record<ToastTone, { icon: typeof CheckmarkCircle01Icon; color: string }> = {
  success: { icon: CheckmarkCircle01Icon, color: "text-green-500" },
  error: { icon: Alert02Icon, color: "text-red-500" },
  info: { icon: CheckmarkCircle01Icon, color: "text-kiwi-300" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const tone = toneStyles[toast.tone];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                className="flex w-80 items-start gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-lg"
              >
                <HugeiconsIcon icon={tone.icon} size={18} className={`mt-0.5 shrink-0 ${tone.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs text-text-secondary">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors duration-150"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
