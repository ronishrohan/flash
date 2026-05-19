"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const CLOUDS = [
  { src: "/images/cloud-right-hd.png", w: 700, h: 394, size: "w-[80%]", left: "0%",  top: "52%", duration: 18, dx: 24,  dy: 16 },
  { src: "/images/cloud-left.png",     w: 500, h: 272, size: "w-[60%]", left: "28%", top: "25%", duration: 24, dx: -18, dy: 20, flip: true },
  { src: "/images/cloud-right-hd.png", w: 400, h: 225, size: "w-[45%]", left: "48%", top: "68%", duration: 20, dx: 14,  dy: -12 },
];

const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
      setUser(data.user);
    });
  }, []);

  async function connectGmail() {
    setConnecting(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: GMAIL_SCOPES,
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  async function skipForNow() {
    if (!user) return;
    await supabase.auth.updateUser({ data: { onboarded: true } });
    window.location.href = "/dashboard";
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <Spinner size={28} color="#94a3b8" />
      </div>
    );
  }

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    || user.email?.split("@")[0]
    || "there";

  return (
    <div className="min-h-[100dvh] flex bg-white">
      {/* ── Left: Onboarding step ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-8">
        <div className="max-w-sm w-full">
          <Link href="/" className="mb-16 inline-block text-slate-900 hover:opacity-70 transition-opacity text-[1.6rem]" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
            Flash
          </Link>
          <h1 className="text-[2.75rem] text-slate-900 mb-2 leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
            Welcome, {firstName}.
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            Connect your Gmail so Flash can read, organize, and reply on your behalf. Nothing happens without your approval.
          </p>

          <div className="flex flex-col gap-3">
            <div className="relative rounded-full overflow-hidden group" style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 rounded-full pointer-events-none z-20" />
              <LiquidGlass static hoverable={false} className="w-full">
                <button onClick={connectGmail} disabled={connecting} className="w-full h-12 px-5 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                  {connecting && <Spinner size={18} color="white" />}
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff" opacity="0.95"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#fff" opacity="0.85"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#fff" opacity="0.9"/>
                  </svg>
                  {connecting ? "Opening Google…" : "Connect Gmail"}
                </button>
              </LiquidGlass>
            </div>

            <button
              onClick={skipForNow}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors mt-2"
            >
              Skip for now
            </button>
          </div>

          <ul className="mt-10 text-xs text-slate-500 space-y-2">
            <li className="flex gap-2"><span className="text-sky-500">•</span> Read access only for now — no sending without your OK.</li>
            <li className="flex gap-2"><span className="text-sky-500">•</span> Tokens stay encrypted in your Supabase project.</li>
            <li className="flex gap-2"><span className="text-sky-500">•</span> You can revoke access any time from Google.</li>
          </ul>
        </div>
      </div>

      {/* ── Right: Sky panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex p-6" style={{ width: "55%" }}>
        <div
          className="relative w-full rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 35%, #7dd3fc 65%, #bae6fd 100%)" }}
        >
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
          <div className="absolute top-12 left-10 right-10">
            <p className="text-white text-[2.5rem] leading-tight" style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif' }}>
              One last thing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
