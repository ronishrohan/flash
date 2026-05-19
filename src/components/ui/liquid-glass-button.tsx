"use client";

import { forwardRef } from "react";
import { LiquidGlass } from "./liquid-glass";
import { SKY_BG } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

interface LiquidGlassButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  radius?: string;
  scale?: number;
  tapScale?: number;
  background?: string;
  type?: "button" | "submit" | "reset";
  title?: string;
}

export const LiquidGlassButton = forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(function LiquidGlassButton(
  {
    onClick,
    disabled = false,
    children,
    className,
    innerClassName,
    radius = "9999px",
    scale = 0.4,
    tapScale = 1.04,
    background = SKY_BG,
    type = "button",
    title,
  },
  ref,
) {
  return (
    <LiquidGlass
      scale={scale}
      radius={radius}
      hoverable={!disabled}
      static={disabled}
      background={disabled ? "#e2e8f0" : background}
      whileTap={disabled ? undefined : { scale: tapScale }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className={className}
    >
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn("w-full h-full flex items-center justify-center text-white", innerClassName)}
      >
        {children}
      </button>
    </LiquidGlass>
  );
});
