import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "font-sans font-medium text-sm whitespace-nowrap select-none",
    "border border-transparent bg-clip-padding",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "transition-[transform,background-color,opacity,border-color] duration-150",
    "active:scale-[0.96]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost:
          "text-slate-700 hover:bg-white/25 hover:text-slate-900",
        outline:
          "border-border bg-background text-slate-700 hover:bg-muted hover:text-slate-900",
        glass:
          "bg-white/20 border-white/30 text-white backdrop-blur-md hover:bg-white/30",
        "glass-solid":
          "bg-white text-slate-700 border-white/60 hover:bg-white/90",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        default: "h-9 rounded-xl px-4",
        lg: "h-11 rounded-2xl px-6 text-base",
        pill: "h-10 rounded-full px-5",
        "pill-lg": "h-12 rounded-full px-7 text-base",
        icon: "size-9 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
