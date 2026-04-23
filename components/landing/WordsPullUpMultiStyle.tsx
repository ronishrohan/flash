"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  containerClassName?: string;
  justify?: "center" | "start";
}

export function WordsPullUpMultiStyle({
  segments,
  containerClassName = "",
  justify = "center",
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const allWords: { word: string; className: string }[] = [];
  segments.forEach((seg) => {
    const words = seg.text.split(" ");
    words.forEach((word) => {
      allWords.push({ word, className: seg.className || "" });
    });
  });

  const justifyClass = justify === "center" ? "justify-center" : "justify-start";

  return (
    <span
      ref={ref}
      className={`flex flex-wrap gap-x-[0.3em] ${justifyClass} w-full ${containerClassName}`}
    >
      {allWords.map((item, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className={`inline-block ${item.className}`}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{
              duration: 0.6,
              delay: i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {item.word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
