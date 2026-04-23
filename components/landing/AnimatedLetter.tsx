"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

interface AnimatedLetterProps {
  char: string;
  index: number;
  totalChars: number;
  scrollProgress: MotionValue<number>;
}

export function AnimatedLetter({ char, index, totalChars, scrollProgress }: AnimatedLetterProps) {
  const charProgress = index / totalChars;
  const start = Math.max(charProgress - 0.1, 0);
  const end = Math.min(charProgress + 0.05, 1);

  const opacity = useTransform(scrollProgress, [start, end], [0.2, 1]);

  return (
    <motion.span style={{ opacity }}>
      {char}
    </motion.span>
  );
}

interface AnimatedTextProps {
  text: string;
  scrollProgress: MotionValue<number>;
}

export function AnimatedText({ text, scrollProgress }: AnimatedTextProps) {
  const words = text.split(" ");
  let charIndex = 0;
  const totalChars = text.length;

  return (
    <>
      {words.map((word, wi) => {
        const startIndex = charIndex;
        charIndex += word.length + 1;

        return (
          <span key={wi} className="inline-block whitespace-nowrap">
            {word.split("").map((char, ci) => (
              <AnimatedLetter
                key={ci}
                char={char}
                index={startIndex + ci}
                totalChars={totalChars}
                scrollProgress={scrollProgress}
              />
            ))}
            {wi < words.length - 1 && (
              <AnimatedLetter
                char=" "
                index={startIndex + word.length}
                totalChars={totalChars}
                scrollProgress={scrollProgress}
              />
            )}
          </span>
        );
      })}
    </>
  );
}
