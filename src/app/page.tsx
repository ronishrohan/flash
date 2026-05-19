"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { ChatInput } from "@/components/dashboard/chat-input";
import { Mail01Icon, Moon02Icon, Sun01Icon } from "hugeicons-react";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = ["Features", "How it works", "Pricing", "Changelog"];

// Exponential ease-out — smooth and fast-settling
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

// Page-wide stagger — topbar children + hero children share one cascade
const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.0 },
  },
};

const blurIn = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 10 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.6, ease: EXPO_OUT },
  },
};

function Stars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.75,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random() * 0.7 + 0.3,
    }));
    ctx.clearRect(0, 0, W, H);
    for (const st of stars) {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${st.a})`;
      ctx.fill();
    }
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
}

const GRADIENTS = {
  light: "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 28%, #7dd3fc 56%, #bae6fd 80%, #f0f9ff 100%)",
  dark: "linear-gradient(180deg, #0f172a 0%, #1e3a5f 40%, #2563a8 75%, #93c5fd 100%)",
};

const DEMO_PROMPTS = [
  "Summarize my unread emails from this week",
  "Draft a reply to Sarah's invite",
  "Archive every newsletter older than a month",
  "Find that invoice from Acme last quarter",
  "Set up a follow-up for next Monday",
  "What's the latest from my team?",
  "Any emails I still need to reply to?",
  "Schedule a meeting with the design team",
];

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


export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("theme") === "dark");
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
    document.documentElement.style.backgroundColor = dark ? "#0f172a" : "#0ea5e9";
  }, [dark]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
      style={{
        background: dark ? GRADIENTS.dark : GRADIENTS.light,
        transition: "background 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* ── God rays (light mode) ──────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ opacity: dark ? 0 : 1 }}
      >
        {[
          { left: "38%", rotate: "-18deg", opacity: 0.13 },
          { left: "48%", rotate:  "-8deg", opacity: 0.18 },
          { left: "55%", rotate:   "2deg", opacity: 0.13 },
          { left: "63%", rotate:  "14deg", opacity: 0.09 },
          { left: "30%", rotate: "-30deg", opacity: 0.07 },
        ].map((ray, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-10%",
              left: ray.left,
              width: "18vw",
              height: "130%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)",
              transform: `rotate(${ray.rotate})`,
              transformOrigin: "top center",
              opacity: ray.opacity,
              filter: "blur(18px)",
            }}
          />
        ))}
      </div>

      {/* ── Stars (dark mode) ──────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ opacity: dark ? 1 : 0 }}
      >
        <Stars />
      </div>

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header
        className={[
          "fixed top-4 inset-x-0 z-30 h-14 transition-[background-color,backdrop-filter] duration-300",
          scrolled ? "bg-white/70 backdrop-blur-xl" : "",
        ].join(" ")}
      >
        <motion.div variants={blurIn} className="relative max-w-7xl mx-auto flex items-center justify-between h-full px-8">
          {/* Logo */}
          <a
            href="/"
            className="font-shadows  text-[1.5rem] font-normal leading-none select-none tracking-normal transition-opacity duration-150 hover:opacity-70 z-10"
            style={{ color: scrolled ? "#1e293b" : "#fff" }}
          >
            Flash
          </a>

          {/* Center nav pill — truly centered via absolute */}
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
            <LiquidGlass dark={dark} static scale={0.28} className="px-1.5 py-1">
              <div className="flex items-center gap-0.5">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link}
                    className="px-4 py-1.5 rounded-full text-[0.8125rem] font-medium text-white/90 hover:text-white hover:bg-white/15 transition-[background-color,color] duration-150"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </LiquidGlass>
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 z-10">
            <LiquidGlass dark={dark} scale={0.28} radius="9999px" hoverable whileTap={{ scale: 1.12 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
              <button aria-label="Contact" onClick={() => window.location.href = "mailto:"} className="flex items-center justify-center w-9 h-9 text-white">
                <Mail01Icon size={17} />
              </button>
            </LiquidGlass>
            <LiquidGlass dark={dark} scale={0.28} radius="9999px" hoverable whileTap={{ scale: 1.12 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                <button onClick={() => setDark(!dark)} aria-label="Toggle theme" className="flex items-center justify-center w-9 h-9 text-white">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={dark ? "sun" : "moon"}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, ease: EXPO_OUT } }}
                      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
                      className="flex"
                    >
                      {dark ? <Sun01Icon size={17} /> : <Moon02Icon size={17} />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </LiquidGlass>
            <LiquidGlass dark={dark} scale={0.28} hoverable whileTap={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
              <button onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")} className="flex items-center px-5 h-9 text-[0.8125rem] font-semibold text-white tracking-[-0.01em] whitespace-nowrap">
                Get started
              </button>
            </LiquidGlass>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2 -mr-2 min-h-[44px] min-w-[44px] items-center justify-center z-10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {[
              menuOpen ? "rotate-45 translate-y-[6.5px]" : "",
              menuOpen ? "opacity-0 scale-x-0" : "",
              menuOpen ? "-rotate-45 -translate-y-[6.5px]" : "",
            ].map((extra, i) => (
              <span
                key={i}
                className={[
                  "block w-5 h-[1.5px] rounded-full",
                  "transition-[transform,opacity] duration-200",
                  scrolled ? "bg-slate-700" : "bg-white",
                  extra,
                ].join(" ")}
                style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
              />
            ))}
          </button>
        </motion.div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 z-20 bg-sky-500/92 backdrop-blur-2xl flex flex-col items-start justify-center px-8 gap-1"
            onClick={() => setMenuOpen(false)}
          >
            {[...NAV_LINKS, "Contact"].map((link, i) => (
              <motion.a
                key={link}
                href="#"
                initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: EXPO_OUT, delay: i * 0.04 }}
                className="text-3xl font-semibold text-white py-3 hover:text-white/70 transition-[opacity] duration-150"
                style={{ letterSpacing: "-0.03em" }}
              >
                {link}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, delay: 0.22, ease: EXPO_OUT }}
              className="mt-6"
            >
              <LiquidGlass dark={dark} scale={0.38} hoverable>
                <button onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")} className="flex items-center px-7 h-11 text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">
                  Get started free
                </button>
              </LiquidGlass>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 pb-52 md:pb-60">
        <div className="max-w-7xl mx-auto px-8 pt-44">
          <div className="flex items-start gap-16">
            {/* Left: headline + CTA */}
            <motion.div variants={stagger} className="flex flex-col items-start flex-shrink-0">
              <motion.h1
                variants={blurIn}
                className="font-shadows text-[4rem] md:text-[6.5rem] lg:text-[7.5rem] font-normal leading-[1.1] tracking-normal mb-5 text-white"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Your inbox,
                <br />
                on autopilot.
              </motion.h1>

              <motion.p
                variants={blurIn}
                className="max-w-[40ch] text-white/80 font-medium text-[1.0625rem] leading-relaxed mb-9"
                style={{ textWrap: "pretty" } as React.CSSProperties}
              >
                Flash reads, replies, and organizes your Gmail. No rules to set up, no filters to maintain.
              </motion.p>

              <motion.div variants={blurIn}>
                <LiquidGlass dark={dark} scale={0.42} hoverable whileTap={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                  <button onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")} className="flex items-center px-8 h-12 text-[1rem] font-semibold text-white tracking-[-0.015em] whitespace-nowrap">
                    Try Flash
                  </button>
                </LiquidGlass>
              </motion.div>
            </motion.div>

            {/* Right: demo chat input — aligned to headline vertically, pushed to right edge */}
            <motion.div
              initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: EXPO_OUT, delay: 0.45 }}
              className="hidden lg:flex flex-1 justify-end items-start pt-8 pointer-events-none"
            >
              <div className="w-[440px]">
                <DemoChatInput />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── Clouds (fade only, no slide) ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EXPO_OUT, delay: 0.5 }}
        className="pointer-events-none absolute bottom-0 left-0 z-10 w-[52vw] max-w-[640px] translate-y-[18%]"
        aria-hidden
      >
        <Image
          src="/images/cloud-right-hd.png"
          alt=""
          width={640}
          height={350}
          className="w-full h-auto"
          style={{ opacity: dark ? 0.15 : 1 }}
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EXPO_OUT, delay: 0.5 }}
        className="pointer-events-none absolute bottom-0 right-0 z-10 w-[85vw] max-w-[1100px] translate-y-[18%] scale-x-[-1]"
        aria-hidden
      >
        <Image
          src="/images/cloud-left.png"
          alt=""
          width={860}
          height={483}
          className="w-full h-auto"
          style={{ opacity: dark ? 0.15 : 1 }}
          priority
        />
      </motion.div>

      {/* Ambient fade at bottom */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-64 z-[5]"
        style={{ background: dark ? "linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 100%)" : "linear-gradient(to top, rgba(186,230,253,0.7) 0%, transparent 100%)", transition: "background 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        aria-hidden
      />
    </motion.div>
  );
}
