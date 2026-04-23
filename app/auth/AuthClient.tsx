"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, GoogleIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type Mode = "select" | "login" | "register";

export default function AuthClient() {
  const { notify } = useToast();
  const [mode, setMode] = useState<Mode>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials() {
    if (mode === "register") {
      if (!name || !email || password.length < 8) {
        notify({ title: "Missing details", description: "Name, email, and 8+ character password required.", tone: "error" });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Registration failed");
        }
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) throw new Error("Account created but sign-in failed.");
        window.location.href = "/onboarding";
      } catch (err) {
        notify({ title: "Error", description: (err as Error).message, tone: "error" });
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (result?.error) {
        notify({ title: "Sign in failed", description: "Check your email and password.", tone: "error" });
        return;
      }
      window.location.href = "/onboarding";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
      className="w-full max-w-sm"
    >
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kiwi-300">
          <HugeiconsIcon icon={Mail01Icon} size={16} className="text-black" />
        </span>
        <span className="font-mono text-sm font-medium tracking-tight">inboxagent</span>
      </div>

      <h1 className="text-2xl font-semibold mt-6">
        {mode === "register" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-sm text-text-secondary mt-1.5">
        {mode === "register"
          ? "Sign up to get started with your AI inbox agent."
          : "Sign in to continue to your inbox agent."}
      </p>

      <div className="mt-8 space-y-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-text-primary transition-all duration-150 ease-out hover:border-border-strong hover:bg-surface active:scale-[0.96] cursor-pointer"
        >
          <HugeiconsIcon icon={GoogleIcon} size={16} />
          Continue with Google
        </button>

        <div className="relative flex items-center py-3">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-text-tertiary">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {mode === "select" ? (
          <div className="space-y-2">
            <Button variant="secondary" className="w-full" onClick={() => setMode("login")}>
              Sign in with email
            </Button>
            <button
              onClick={() => setMode("register")}
              className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 py-2 cursor-pointer"
            >
              Create a new account
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="space-y-3"
          >
            {mode === "register" && (
              <Input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              placeholder={mode === "register" ? "Password (8+ characters)" : "Password"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              onKeyDown={(e) => e.key === "Enter" && handleCredentials()}
            />
            <Button
              variant="primary"
              className="w-full"
              onClick={handleCredentials}
              disabled={loading}
            >
              {loading
                ? mode === "register" ? "Creating account..." : "Signing in..."
                : mode === "register" ? "Create account" : "Sign in"
              }
            </Button>
            <button
              onClick={() => setMode(mode === "register" ? "login" : "register")}
              className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 py-1 cursor-pointer"
            >
              {mode === "register"
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
