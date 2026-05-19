"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Spinner } from "@/components/ui/spinner";
import { ChatInput } from "@/components/dashboard/chat-input";
import { supabase } from "@/lib/supabase";

type Phase = "auth" | "intro" | "gmail" | "success";

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING_MED = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.7 };

const CLOUDS = [
  { src: "/images/cloud-right-hd.png", w: 700, h: 394, size: "w-[80%]", left: "0%",  top: "52%", duration: 18, dx: 24,  dy: 16,  spread: { x: -120, y:  120 } },
  { src: "/images/cloud-left.png",     w: 500, h: 272, size: "w-[60%]", left: "28%", top: "25%", duration: 24, dx: -18, dy: 20,  flip: true, spread: { x: -100, y: -140 } },
  { src: "/images/cloud-right-hd.png", w: 400, h: 225, size: "w-[45%]", left: "48%", top: "68%", duration: 20, dx: 14,  dy: -12, spread: { x:  140, y:  120 } },
];

const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

const DEMO_PROMPTS = [
  "Summarize my unread emails from this week",
  "Draft a reply to Sarah's invite",
  "Archive every newsletter older than a month",
  "Find that invoice from Acme last quarter",
  "Set up a follow-up for next Monday",
  "What's the latest from my team?",
];

// Stagger helpers
const FADE_OUT_UP: Variants = {
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: (i: number) => ({
    opacity: 0,
    y: -24,
    filter: "blur(8px)",
    transition: { duration: 0.35, delay: i * 0.045, ease: EXPO_OUT },
  }),
};

const FADE_IN_UP: Variants = {
  hidden:  { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.06, ease: EXPO_OUT },
  }),
};

function LoginPageInner() {
  const params = useSearchParams();
  const initialPhase: Phase = useMemo(() => {
    const step = params.get("step");
    if (step === "onboard" || step === "intro") return "intro";
    if (step === "gmail") return "gmail";
    if (step === "success") return "success";
    return "auth";
  }, [params]);

  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      window.location.href = "/dashboard";
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) { setError(error.message); setLoading(false); return; }
      setLoading(false);
      setPhase("intro");
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async function connectGmail() {
    const next = encodeURIComponent("/login?step=success");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: GMAIL_SCOPES,
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  return (
    <div className="min-h-[100dvh] flex bg-white">

      {/* ── Left: Phase content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-8 relative">
        <AnimatePresence mode="wait">
          {phase === "auth" ? (
            <AuthForm
              key="auth"
              mode={mode}
              setMode={setMode}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              error={error}
              loading={loading}
              onSubmit={handleSubmit}
              onGoogle={handleGoogle}
            />
          ) : phase === "intro" ? (
            <IntroStep key="intro" onContinue={() => setPhase("gmail")} />
          ) : phase === "gmail" ? (
            <GmailStep key="gmail" onConnect={connectGmail} />
          ) : (
            <SuccessStep key="success" onContinue={() => { window.location.href = "/dashboard"; }} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: Sky panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex p-6" style={{ width: "55%" }}>
        <div
          className="relative w-full rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 35%, #7dd3fc 65%, #bae6fd 100%)" }}
        >
          {CLOUDS.map((cloud, i) => {
            const spread = phase === "intro" || phase === "gmail" || phase === "success";
            return (
              <motion.div
                key={i}
                className={`absolute ${cloud.size} pointer-events-none`}
                style={{ left: cloud.left, top: cloud.top, ...(cloud.flip ? { transform: "scaleX(-1)" } : {}) }}
                animate={spread
                  ? {
                      x: cloud.spread.x,
                      y: cloud.spread.y,
                      opacity: 0.55,
                      transition: { duration: 1.6, ease: EXPO_OUT },
                    }
                  : {
                      x: [0, cloud.dx, cloud.dx * 0.4, -cloud.dx * 0.5, 0],
                      y: [0, cloud.dy * 0.5, cloud.dy, cloud.dy * 0.3, 0],
                      opacity: 1,
                      transition: { duration: cloud.duration, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 0.55, 0.8, 1] },
                    }
                }
              >
                <Image src={cloud.src} alt="" width={cloud.w} height={cloud.h} className="w-full h-auto" priority={i === 0} />
              </motion.div>
            );
          })}

          {/* Centered demo chat input that appears once clouds spread */}
          <AnimatePresence>
            {phase === "intro" && (
              <motion.div
                key="demo"
                initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: 0.6, duration: 0.7, ease: EXPO_OUT } }}
                exit={{ opacity: 0, y: -16, filter: "blur(10px)", transition: { duration: 0.35, ease: EXPO_OUT } }}
                className="absolute inset-0 flex items-center justify-center px-12"
              >
                <div className="w-full max-w-md pointer-events-none">
                  <DemoChatInput />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tagline */}
          <AnimatePresence>
            {phase === "auth" && (
              <motion.div
                key="tagline"
                initial={false}
                exit={{ opacity: 0, y: -12, filter: "blur(8px)", transition: { duration: 0.4, ease: EXPO_OUT } }}
                className="absolute top-12 left-10 right-10"
              >
                <p className="text-white text-[2.5rem] leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
                  Your inbox,<br />on autopilot.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center bg-white"><Spinner size={28} color="#94a3b8" /></div>}>
      <LoginPageInner />
    </Suspense>
  );
}

// ─── Auth form ───────────────────────────────────────────────────

interface AuthFormProps {
  mode: "login" | "signup";
  setMode: (m: "login" | "signup") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
}

function AuthForm({ mode, setMode, email, setEmail, password, setPassword, name, setName, error, loading, onSubmit, onGoogle }: AuthFormProps) {
  return (
    <motion.div className="max-w-sm w-full" exit={{ transition: { staggerChildren: 0.03 } }}>
      {[
        <motion.a key="logo" custom={0} variants={FADE_OUT_UP} initial={false} animate="visible" exit="exit"
          href="/" className="mb-16 inline-block text-slate-900 hover:opacity-70 transition-opacity text-[1.6rem]"
          style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
          Flash
        </motion.a>,
        <motion.h1 key="title" custom={1} variants={FADE_OUT_UP} initial={false} animate="visible" exit="exit"
          className="text-[2.75rem] text-slate-900 mb-2 leading-tight"
          style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
          {mode === "login" ? "Welcome back." : "Get started."}
        </motion.h1>,
        <motion.p key="sub" custom={2} variants={FADE_OUT_UP} initial={false} animate="visible" exit="exit"
          className="text-slate-500 text-sm mb-10">
          {mode === "login" ? "Sign in to your Flash account." : "Create your free Flash account."}
        </motion.p>,
        ...(error ? [
          <motion.p key="err" custom={3} variants={FADE_OUT_UP} initial={false} animate="visible" exit="exit"
            className={`text-sm mb-2 ${error.startsWith("Check") ? "text-green-600" : "text-red-500"}`}>
            {error}
          </motion.p>,
        ] : []),
        <motion.form key="form" custom={4} variants={FADE_OUT_UP} initial={false} animate="visible" exit="exit"
          className="flex flex-col gap-3" onSubmit={onSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-5 rounded-full border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-5 rounded-full border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-5 rounded-full border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition"
          />

          <div className="relative mt-2 rounded-full overflow-hidden group" style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 rounded-full pointer-events-none z-20" />
            <LiquidGlass static hoverable={false} className="w-full">
              <button type="submit" disabled={loading} className="w-full h-12 px-5 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                {loading && <Spinner size={18} color="white" />}
                {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </LiquidGlass>
          </div>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            className="w-full h-12 rounded-full border border-slate-200 bg-transparent text-slate-700 text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-black/5 active:scale-[0.97]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </motion.form>,
        <motion.p key="toggle" custom={5} variants={FADE_OUT_UP} initial={false} animate="visible" exit="exit"
          className="text-sm text-slate-500 mt-8 text-center">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sky-500 font-medium px-2 py-0.5 rounded-full hover:bg-sky-50"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </motion.p>,
      ]}
    </motion.div>
  );
}

// ─── Step 1: Intro ──────────────────────────────────────────────

function IntroStep({ onContinue }: { onContinue: () => void }) {
  const items = [
    { kind: "logo" as const },
    { kind: "title" as const, text: "Meet Flash." },
    { kind: "sub" as const, text: "An assistant that lives on top of your inbox. Read, reply, organize, and find things — all in plain English." },
    { kind: "bullets" as const, items: [
      "Summarize unread mail in seconds.",
      "Draft and send replies you approve.",
      "Pull threads, files, and dates on demand.",
    ] },
    { kind: "cta" as const },
  ];
  return (
    <motion.div className="max-w-sm w-full">
      {items.map((it, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={FADE_IN_UP}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -16, filter: "blur(8px)", transition: { delay: (items.length - i - 1) * 0.04, duration: 0.3, ease: EXPO_OUT } }}
        >
          {it.kind === "logo" && (
            <Link href="/" className="mb-16 inline-block text-slate-900 hover:opacity-70 transition-opacity text-[1.6rem]" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              Flash
            </Link>
          )}
          {it.kind === "title" && (
            <h1 className="text-[2.75rem] text-slate-900 mb-2 leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              {it.text}
            </h1>
          )}
          {it.kind === "sub" && (
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{it.text}</p>
          )}
          {it.kind === "bullets" && (
            <ul className="text-sm text-slate-700 space-y-2.5 mb-10">
              {it.items.map((b, j) => (
                <li key={j} className="flex gap-3">
                  <span className="text-sky-500 mt-1">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {it.kind === "cta" && (
            <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Step 2: Connect Gmail ──────────────────────────────────────

function GmailStep({ onConnect }: { onConnect: () => void }) {
  const [connecting, setConnecting] = useState(false);
  async function go() {
    setConnecting(true);
    await onConnect();
  }
  const items = [
    { kind: "logo" as const },
    { kind: "title" as const, text: "Connect your Gmail." },
    { kind: "sub" as const, text: "Flash needs read access to your inbox to actually help. You stay in control — nothing sends without your approval." },
    { kind: "cta" as const },
    { kind: "notes" as const },
  ];
  return (
    <motion.div className="max-w-sm w-full">
      {items.map((it, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={FADE_IN_UP}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -16, filter: "blur(8px)", transition: { delay: (items.length - i - 1) * 0.04, duration: 0.3, ease: EXPO_OUT } }}
        >
          {it.kind === "logo" && (
            <Link href="/" className="mb-16 inline-block text-slate-900 hover:opacity-70 transition-opacity text-[1.6rem]" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              Flash
            </Link>
          )}
          {it.kind === "title" && (
            <h1 className="text-[2.75rem] text-slate-900 mb-2 leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              {it.text}
            </h1>
          )}
          {it.kind === "sub" && (
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">{it.text}</p>
          )}
          {it.kind === "cta" && (
            <PrimaryButton onClick={go} loading={connecting} loadingText="Opening Google…">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="mr-1">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff" opacity="0.95"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#fff" opacity="0.85"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#fff" opacity="0.9"/>
              </svg>
              Connect Gmail
            </PrimaryButton>
          )}
          {it.kind === "notes" && (
            <ul className="mt-8 text-xs text-slate-500 space-y-2">
              <li className="flex gap-2"><span className="text-sky-500">•</span> Read access only for now — no sending without your OK.</li>
              <li className="flex gap-2"><span className="text-sky-500">•</span> Tokens stay encrypted in your Supabase project.</li>
              <li className="flex gap-2"><span className="text-sky-500">•</span> You can revoke access any time from Google.</li>
            </ul>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Step 3: Success ────────────────────────────────────────────

function SuccessStep({ onContinue }: { onContinue: () => void }) {
  const items = [
    { kind: "logo" as const },
    { kind: "check" as const },
    { kind: "title" as const, text: "You're all set." },
    { kind: "sub" as const, text: "Gmail is connected. Jump in and ask Flash anything about your inbox." },
    { kind: "cta" as const },
  ];
  return (
    <motion.div className="max-w-sm w-full">
      {items.map((it, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={FADE_IN_UP}
          initial="hidden"
          animate="visible"
        >
          {it.kind === "logo" && (
            <Link href="/" className="mb-12 inline-block text-slate-900 hover:opacity-70 transition-opacity text-[1.6rem]" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              Flash
            </Link>
          )}
          {it.kind === "check" && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { ...SPRING_MED, delay: 0.1 } }}
              className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, transition: { duration: 0.5, delay: 0.35, ease: EXPO_OUT } }}
                />
              </svg>
            </motion.div>
          )}
          {it.kind === "title" && (
            <h1 className="text-[2.75rem] text-slate-900 mb-2 leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              {it.text}
            </h1>
          )}
          {it.kind === "sub" && (
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">{it.text}</p>
          )}
          {it.kind === "cta" && <PrimaryButton onClick={onContinue}>Open Flash</PrimaryButton>}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Shared primary button ──────────────────────────────────────

function PrimaryButton({ children, onClick, loading, loadingText }: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <div className="relative rounded-full overflow-hidden group" style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 rounded-full pointer-events-none z-20" />
      <LiquidGlass static hoverable={false} className="w-full">
        <button onClick={onClick} disabled={loading} className="w-full h-12 px-5 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Spinner size={18} color="white" />{loadingText ?? "Loading…"}</> : children}
        </button>
      </LiquidGlass>
    </div>
  );
}

// ─── Demo chat input (typing animation) ─────────────────────────

function DemoChatInput() {
  const [value, setValue] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const prompt = DEMO_PROMPTS[promptIdx];
    let i = 0;
    let typingIn = true;
    function step() {
      if (typingIn) {
        i += 1;
        setValue(prompt.slice(0, i));
        if (i >= prompt.length) {
          typingIn = false;
          timer.current = setTimeout(step, 1400);
          return;
        }
        timer.current = setTimeout(step, 35 + Math.random() * 60);
      } else {
        i -= 1;
        setValue(prompt.slice(0, Math.max(0, i)));
        if (i <= 0) {
          setPromptIdx(p => (p + 1) % DEMO_PROMPTS.length);
          return;
        }
        timer.current = setTimeout(step, 18 + Math.random() * 25);
      }
    }
    step();
  }, [promptIdx]);

  useEffect(() => {
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [tick]);

  return (
    <div className="shadow-[0_30px_60px_-20px_rgba(15,23,42,0.35)] rounded-[2rem]">
      <ChatInput input={value} setInput={() => {}} onSend={() => {}} />
    </div>
  );
}
