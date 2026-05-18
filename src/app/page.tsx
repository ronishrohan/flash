"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { Mail01Icon } from "hugeicons-react";

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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 28%, #7dd3fc 56%, #bae6fd 80%, #f0f9ff 100%)",
      }}
    >
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
            className="font-junicode text-[1.375rem] font-semibold leading-none select-none tracking-tight transition-opacity duration-150 hover:opacity-70 z-10"
            style={{ color: scrolled ? "#1e293b" : "#fff" }}
          >
            Flash
          </a>

          {/* Center nav pill — truly centered via absolute */}
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
            <LiquidGlass scale={0.28} className="px-1.5 py-1">
              <div className="flex items-center gap-0.5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="px-4 py-1.5 rounded-full text-[0.8125rem] font-medium text-white/90 hover:text-white hover:bg-white/15 transition-[background-color,color] duration-150"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </LiquidGlass>
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 z-10">
            <a
              href="mailto:"
              aria-label="Contact"
              className="flex items-center justify-center w-9 h-9 rounded-full text-white/75 hover:text-white hover:bg-white/15 transition-[background-color,color] duration-150 active:scale-[0.96] transition-transform"
            >
              <Mail01Icon size={18} />
            </a>
            <LiquidGlass scale={0.28}>
              <a
                href="#"
                className="flex items-center px-5 h-9 text-[0.8125rem] font-semibold text-white tracking-[-0.01em] whitespace-nowrap active:scale-[0.96] transition-transform duration-150"
              >
                Get started
              </a>
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
              <LiquidGlass scale={0.38}>
                <a href="#" className="flex items-center px-7 h-11 text-[0.9375rem] font-semibold text-white tracking-[-0.01em]">
                  Get started free
                </a>
              </LiquidGlass>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 pb-52 md:pb-60">
        <div className="max-w-7xl mx-auto px-8 pt-44">
          <motion.div
            variants={stagger}
            className="flex flex-col items-start max-w-2xl"
          >
            <motion.h1
              variants={blurIn}
              className="font-junicode text-[3.25rem] md:text-[5rem] lg:text-[5.5rem] font-semibold leading-[1.05] tracking-[-0.02em] mb-5 text-white"
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
              <LiquidGlass scale={0.42}>
                <a
                  href="#"
                  className="flex items-center px-8 h-12 text-[1rem] font-semibold text-white tracking-[-0.015em] whitespace-nowrap active:scale-[0.96] transition-transform duration-150"
                >
                  Try Flash
                </a>
              </LiquidGlass>
            </motion.div>
          </motion.div>
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
          src="/images/cloud-left.png"
          alt=""
          width={640}
          height={350}
          className="w-full h-auto"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EXPO_OUT, delay: 0.5 }}
        className="pointer-events-none absolute bottom-0 right-0 z-10 w-[52vw] max-w-[640px] translate-y-[18%] scale-x-[-1]"
        aria-hidden
      >
        <Image
          src="/images/cloud-right.png"
          alt=""
          width={640}
          height={350}
          className="w-full h-auto"
          priority
        />
      </motion.div>

      {/* Ambient fade at bottom */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-48 z-[5]"
        style={{ background: "linear-gradient(to top, rgba(240,249,255,0.9) 0%, transparent 100%)" }}
        aria-hidden
      />
    </motion.div>
  );
}
