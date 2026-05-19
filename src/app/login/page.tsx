"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";


const CLOUDS = [
  { src: "/images/cloud-right-hd.png", w: 700, h: 394, size: "w-[80%]", left: "0%",  top: "52%", duration: 18, dx: 24,  dy: 16 },
  { src: "/images/cloud-left.png",     w: 500, h: 272, size: "w-[60%]", left: "28%", top: "25%", duration: 24, dx: -18, dy: 20, flip: true },
  { src: "/images/cloud-right-hd.png", w: 400, h: 225, size: "w-[45%]", left: "48%", top: "68%", duration: 20, dx: 14,  dy: -12 },
];

export default function LoginPage() {
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
      if (error) setError(error.message);
      else window.location.href = "/dashboard";
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) setError(error.message);
      else window.location.href = "/onboarding";
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="min-h-[100dvh] flex bg-white">

      {/* ── Left: Auth form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-8">

        <div className="max-w-sm w-full">
        {/* Logo */}
        <a href="/" className="mb-16 inline-block text-slate-900 hover:opacity-70 transition-opacity text-[1.6rem]" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
          Flash
        </a>
          <h1 className="text-[2.75rem] text-slate-900 mb-2 leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
            {mode === "login" ? "Welcome back." : "Get started."}
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            {mode === "login" ? "Sign in to your Flash account." : "Create your free Flash account."}
          </p>

          {error && (
            <p className={`text-sm mb-2 ${error.startsWith("Check") ? "text-green-600" : "text-red-500"}`}>{error}</p>
          )}
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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

            {/* Primary — liquid glass over sky gradient */}
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

            {/* Secondary — border + hover bg */}
            <button
              type="button"
              onClick={handleGoogle}
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
          </form>

          {/* Ghost toggle */}
          <p className="text-sm text-slate-500 mt-8 text-center">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sky-500 font-medium px-2 py-0.5 rounded-full hover:bg-sky-50"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* ── Right: Sky panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex p-6" style={{ width: "55%" }}>
        <div
          className="relative w-full rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 35%, #7dd3fc 65%, #bae6fd 100%)" }}
        >
          {/* Floating clouds */}
          {CLOUDS.map((cloud, i) => (
            <motion.div
              key={i}
              className={`absolute ${cloud.size} pointer-events-none`}
              style={{ left: cloud.left, top: cloud.top, ...(cloud.flip ? { transform: "scaleX(-1)" } : {}) }}
              animate={{
                x: [0, cloud.dx, cloud.dx * 0.4, -cloud.dx * 0.5, 0],
                y: [0, cloud.dy * 0.5, cloud.dy, cloud.dy * 0.3, 0],
              }}
              transition={{ duration: cloud.duration, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 0.55, 0.8, 1] }}
            >
              <Image src={cloud.src} alt="" width={cloud.w} height={cloud.h} className="w-full h-auto" priority={i === 0} />
            </motion.div>
          ))}

          {/* Tagline */}
          <div className="absolute top-12 left-10 right-10">
            <p className="text-white text-[2.5rem] leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              Your inbox,<br />on autopilot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
