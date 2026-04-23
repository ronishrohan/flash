"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-kiwi-300 text-black font-semibold hover:bg-kiwi-400 active:scale-[0.96] shadow-sm",
  secondary:
    "bg-surface-raised border border-border text-text-primary hover:bg-surface hover:border-border-strong active:scale-[0.96]",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-surface active:scale-[0.96]",
  danger:
    "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.96]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 ease-out cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
