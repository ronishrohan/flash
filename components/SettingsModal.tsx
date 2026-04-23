"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Mail01Icon,
  GoogleIcon,
  Delete01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

type GmailAccount = {
  id: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
};

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/accounts");
      if (!res.ok) return;
      const data = (await res.json()) as { accounts: GmailAccount[] };
      setAccounts(data.accounts);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (open) loadAccounts();
  }, [open, loadAccounts]);

  async function handleSetPrimary(accountId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/gmail/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error("Failed to set primary");
      notify({ title: "Primary account updated", tone: "success" });
      await loadAccounts();
    } catch {
      notify({ title: "Error", description: "Could not update primary account.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(accountId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/gmail/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      notify({ title: "Account disconnected", tone: "success" });
      await loadAccounts();
    } catch {
      notify({ title: "Error", description: "Could not disconnect account.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  function handleConnect() {
    window.location.href = "/api/gmail/connect";
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-[var(--overlay-bg)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-surface-raised shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <HugeiconsIcon icon={Mail01Icon} size={16} className="text-kiwi-300" />
                    Gmail accounts
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Manage connected Gmail accounts. Your agent uses these to read and send emails.
                  </p>

                  <div className="mt-4 space-y-2">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <HugeiconsIcon icon={GoogleIcon} size={16} className="shrink-0 text-text-secondary" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{account.email}</p>
                            {account.isPrimary && (
                              <span className="inline-flex items-center gap-1 text-xs text-kiwi-400">
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} />
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!account.isPrimary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimary(account.id)}
                              disabled={loading}
                            >
                              Set primary
                            </Button>
                          )}
                          <button
                            onClick={() => handleDisconnect(account.id)}
                            disabled={loading}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 ease-out active:scale-[0.96] cursor-pointer disabled:opacity-50"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {accounts.length === 0 && (
                      <p className="text-sm text-text-tertiary py-4 text-center">
                        No Gmail accounts connected.
                      </p>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={handleConnect}
                  >
                    <HugeiconsIcon icon={GoogleIcon} size={14} />
                    Connect another account
                  </Button>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold">About</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    InboxAgent is an AI-powered email assistant. Your data is processed securely and never shared with third parties.
                  </p>
                  <p className="text-xs text-text-tertiary mt-2 font-mono">v0.2.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
