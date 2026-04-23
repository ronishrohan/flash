"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary",
          "transition-colors duration-150 ease-out",
          "hover:border-border-strong focus:border-kiwi-300 focus:outline-none focus:ring-2 focus:ring-kiwi-300/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
