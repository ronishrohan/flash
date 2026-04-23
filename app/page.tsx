"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { WordsPullUp } from "@/components/landing/WordsPullUp";
import { WordsPullUpMultiStyle } from "@/components/landing/WordsPullUpMultiStyle";
import { ShaderBackground } from "@/components/landing/ShaderBackground";

const navItems = ["How it works", "Features", "About", "Get started"];

const featureCards = [
  {
    number: "01",
    title: "Natural Language Control.",
    items: [
      "Talk to your inbox in plain English",
      "No filters to configure or maintain",
      "Context-aware command parsing",
      "Multi-step task orchestration",
    ],
  },
  {
    number: "02",
    title: "Agent Execution.",
    items: [
      "Intent detection and planning",
      "Autonomous Gmail API actions",
      "Step-by-step transparency",
    ],
  },
  {
    number: "03",
    title: "Multi-Account Hub.",
    items: [
      "Unified command center for all Gmail",
      "Per-account context switching",
      "Primary account auto-selection",
    ],
  },
];

function HeroSection() {
  return (
    <section className="h-screen p-4 md:p-6">
      <div className="relative h-full w-full rounded-2xl md:rounded-[2rem] overflow-hidden">
        <ShaderBackground />

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

        {/* Navbar — detached, top-right, concentric radius */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
          <nav className="bg-black/80 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 py-2.5 md:px-6 md:py-3">
            <div className="flex items-center gap-3 sm:gap-5 md:gap-8 lg:gap-10">
              {navItems.map((item) => (
                <Link
                  key={item}
                  href={item === "Get started" ? "/auth" : "#"}
                  className="text-[10px] sm:text-xs md:text-sm transition-colors duration-200"
                  style={{ color: "rgba(225, 224, 204, 0.8)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-6 sm:pb-8 md:px-8 md:pb-10">
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-pixel text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] font-medium leading-[0.85] tracking-[-0.05em]"
                style={{ color: "#E1E0CC" }}
              >
                <WordsPullUp text="Flash" />
              </h1>
            </div>

            <div className="col-span-12 lg:col-span-4 pb-2 lg:pb-4">
              <motion.p
                className="text-primary/70 text-xs sm:text-sm md:text-base mb-5"
                style={{ lineHeight: 1.2 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                An autonomous email agent you control through natural language.
                Search, reply, send, archive — all through a single chat
                interface.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  href="/auth"
                  className="group inline-flex items-center gap-1.5 hover:gap-3 bg-primary rounded-full pl-5 pr-1.5 py-1.5 text-black font-medium text-sm sm:text-base transition-all duration-300"
                >
                  Get started
                  <span className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <ArrowRight size={16} style={{ color: "#E1E0CC" }} />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const diagonalLines = [
  { text: "lets be honest,", indent: 5 },
  { text: "we all hate emails,", indent: 25 },
  { text: "flash does it for you.", indent: 50 },
];

function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="h-screen bg-black relative flex flex-col justify-center overflow-hidden"
    >
      {diagonalLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -60, y: 20 }}
          animate={
            isInView
              ? { opacity: 1, x: 0, y: 0 }
              : { opacity: 0, x: -60, y: 20 }
          }
          transition={{
            duration: 0.8,
            delay: i * 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ paddingLeft: `${line.indent}vw` }}
        >
          <h2
            className="font-pixel text-[10vw] sm:text-[9vw] md:text-[8vw] lg:text-[7vw] leading-[1.1] tracking-[-0.02em]"
            style={{ color: "#E1E0CC" }}
          >
            {line.text}
          </h2>
        </motion.div>
      ))}
    </section>
  );
}

function FeatureCard({
  number,
  title,
  items,
  index,
}: {
  number: string;
  title: string;
  items: string[];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={
        isInView
          ? { scale: 1, opacity: 1 }
          : { scale: 0.95, opacity: 0 }
      }
      transition={{
        duration: 0.7,
        delay: (index + 1) * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="bg-[#212121] rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full"
    >
      <div>
        <div className="mb-5">
          <span className="text-gray-500 text-xs mr-2">{number}</span>
          <span
            className="text-sm sm:text-base font-medium"
            style={{ color: "#E1E0CC" }}
          >
            {title}
          </span>
        </div>
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Check size={14} className="text-primary mt-0.5 shrink-0" />
              <span className="text-gray-400 text-xs sm:text-sm leading-snug">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        className="mt-6 flex items-center gap-1.5 text-xs sm:text-sm transition-colors duration-200 cursor-pointer"
        style={{ color: "#E1E0CC" }}
      >
        Learn more
        <ArrowRight size={14} className="rotate-[-45deg]" />
      </button>
    </motion.div>
  );
}

function FeaturesSection() {
  const videoCardRef = useRef<HTMLDivElement>(null);
  const videoCardInView = useInView(videoCardRef, {
    once: true,
    margin: "-100px",
  });

  return (
    <section className="min-h-screen bg-black relative px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28">
      <div className="bg-noise absolute inset-0 opacity-[0.15] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-14 md:mb-16 text-center">
          <WordsPullUpMultiStyle
            segments={[
              {
                text: "Stop managing your inbox. Start talking to it.",
                className: "font-normal",
              },
            ]}
            containerClassName="text-xl sm:text-2xl md:text-3xl lg:text-4xl"
          />
          <div className="mt-2">
            <WordsPullUpMultiStyle
              segments={[
                {
                  text: "Built for professionals who refuse to live in email.",
                  className: "font-normal text-gray-500",
                },
              ]}
              containerClassName="text-xl sm:text-2xl md:text-3xl lg:text-4xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 md:gap-1 lg:h-[480px]">
          {/* Chat preview card */}
          <motion.div
            ref={videoCardRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={
              videoCardInView
                ? { scale: 1, opacity: 1 }
                : { scale: 0.95, opacity: 0 }
            }
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative rounded-2xl overflow-hidden h-[300px] md:h-full bg-[#0a0a0a] border border-[#1a1a1a]"
          >
            <div className="absolute inset-0 flex flex-col p-5 sm:p-6">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="h-2 w-2 rounded-full bg-red-400/60" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
                <span className="h-2 w-2 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 space-y-3 overflow-hidden">
                <div className="flex justify-end">
                  <div
                    className="rounded-2xl rounded-br-md px-3 py-2 text-[11px] sm:text-[12px] text-black font-medium max-w-[80%]"
                    style={{ background: "#DEDBC8" }}
                  >
                    Show me unread emails from today
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <p className="text-[11px] sm:text-[12px] text-gray-400 leading-relaxed">
                      Found 3 unread emails from today...
                    </p>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        • Sarah Chen — Q3 budget review
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        • GitHub — 2 review requests
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        • Figma — Weekly digest
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="rounded-2xl rounded-br-md px-3 py-2 text-[11px] sm:text-[12px] text-black font-medium max-w-[80%]"
                    style={{ background: "#DEDBC8" }}
                  >
                    Reply to Sarah — I&apos;ll review by EOD
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                    <Check size={10} />
                    Reply sent
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] to-transparent h-16" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <p
                className="text-sm sm:text-base font-medium"
                style={{ color: "#E1E0CC" }}
              >
                Your inbox, as a conversation.
              </p>
            </div>
          </motion.div>

          {featureCards.map((card, i) => (
            <FeatureCard key={card.number} {...card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
    </main>
  );
}
