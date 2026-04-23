"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  GoogleIcon,
  CheckmarkCircle01Icon,
  SparklesIcon,
  Search01Icon,
  MailReply01Icon,
  Archive01Icon,
} from "@hugeicons/core-free-icons";

type Step = "connect" | "indexing" | "success";

const indexingSteps = [
  { icon: Search01Icon, label: "Scanning inbox..." },
  { icon: Mail01Icon, label: "Reading email patterns..." },
  { icon: MailReply01Icon, label: "Learning your tone..." },
  { icon: Archive01Icon, label: "Mapping categories..." },
  { icon: SparklesIcon, label: "Agent ready!" },
];

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("connect");
  const [checking, setChecking] = useState(true);
  const [indexProgress, setIndexProgress] = useState(0);

  const checkGmailConnected = useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/accounts");
      if (!res.ok) return false;
      const data = (await res.json()) as { accounts: Array<{ id: string }> };
      return data.accounts.length > 0;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    checkGmailConnected().then((connected) => {
      if (connected) {
        setStep("indexing");
      }
      setChecking(false);
    });
  }, [checkGmailConnected]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      setStep("indexing");
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (step !== "indexing") return;

    const interval = setInterval(() => {
      setIndexProgress((prev) => {
        if (prev >= indexingSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStep("success"), 600);
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [step]);

  function handleConnect() {
    window.location.href = "/api/gmail/connect?redirect=/onboarding?connected=1";
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-kiwi-300 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {step === "connect" && (
          <motion.div
            key="connect"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-kiwi-300"
            >
              <HugeiconsIcon icon={Mail01Icon} size={28} className="text-black" />
            </motion.div>

            <h1 className="mt-6 text-2xl font-semibold">Connect your Gmail</h1>
            <p className="mt-2 text-sm text-text-secondary max-w-xs mx-auto">
              Grant access so your agent can read, search, and send emails on your behalf.
            </p>

            <button
              onClick={handleConnect}
              className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-raised px-6 py-3 text-sm font-medium text-text-primary transition-all duration-150 ease-out hover:border-border-strong hover:bg-surface active:scale-[0.96] cursor-pointer"
            >
              <HugeiconsIcon icon={GoogleIcon} size={18} />
              Connect Gmail account
            </button>

            <p className="mt-4 text-xs text-text-tertiary">
              We request read, send, and modify permissions.
              <br />
              Your data stays private and is never shared.
            </p>
          </motion.div>
        )}

        {step === "indexing" && (
          <motion.div
            key="indexing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-kiwi-300/10 border border-kiwi-300/20"
            >
              <HugeiconsIcon icon={SparklesIcon} size={28} className="text-kiwi-300" />
            </motion.div>

            <h1 className="mt-6 text-2xl font-semibold">Setting up your agent</h1>
            <p className="mt-2 text-sm text-text-secondary">
              This only takes a moment...
            </p>

            <div className="mt-10 space-y-0">
              {indexingSteps.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{
                    opacity: i <= indexProgress ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{
                    type: "spring",
                    duration: 0.4,
                    bounce: 0,
                    delay: i * 0.05,
                  }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                      i < indexProgress
                        ? "bg-kiwi-300 text-black"
                        : i === indexProgress
                          ? "bg-kiwi-300/20 text-kiwi-300"
                          : "bg-surface text-text-tertiary"
                    }`}
                  >
                    {i < indexProgress ? (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                    ) : (
                      <HugeiconsIcon icon={s.icon} size={16} />
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      i <= indexProgress
                        ? "text-text-primary"
                        : "text-text-tertiary"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i === indexProgress && i < indexingSteps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-auto"
                    >
                      <div className="h-4 w-4 rounded-full border-2 border-kiwi-300 border-t-transparent animate-spin" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8">
              <div className="h-1 w-full rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full bg-kiwi-300 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((indexProgress + 1) / indexingSteps.length) * 100}%`,
                  }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-kiwi-300"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} className="text-black" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", duration: 0.4, bounce: 0 }}
              className="mt-6 text-2xl font-semibold"
            >
              You&apos;re all set!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", duration: 0.4, bounce: 0 }}
              className="mt-2 text-sm text-text-secondary"
            >
              Your agent is ready. Start chatting with your inbox.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", duration: 0.4, bounce: 0 }}
            >
              <button
                onClick={() => router.push("/chat")}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-kiwi-300 px-6 py-3 text-sm font-semibold text-black transition-all duration-150 ease-out hover:bg-kiwi-400 active:scale-[0.96] cursor-pointer"
              >
                <HugeiconsIcon icon={SparklesIcon} size={16} />
                Open InboxAgent
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
