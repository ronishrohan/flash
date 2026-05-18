import { cn } from "@/lib/utils";

/**
 * LiquidGlass — reusable glass surface following the Figma spec.
 *
 * Inner shadow anatomy (from Figma):
 *   top-left highlight   → inset 30px 30px 5px -35px  rgba(255,255,255,0.50)
 *   top-left rim         → inset 20px 20px 10px -20px  #b3b3b3
 *   bottom-right rim     → inset -20px -20px 10px -20px #b3b3b3
 *   all-edges ring       → inset 0 0 0 10px             #999
 *   inner fill           → inset 0 0 219px 0             rgba(242,242,242,0.50)
 *
 * Lenses: 5 nested backdrop-blur layers, blurred outward by 4px.
 */

interface LiquidGlassProps {
  children?: React.ReactNode;
  className?: string;
  /** Border radius — defaults to pill (9999px) */
  radius?: string;
  /** Scale the shadow anatomy (default 1) */
  scale?: number;
}

export function LiquidGlass({
  children,
  className,
  radius = "9999px",
  scale = 1,
}: LiquidGlassProps) {
  const s = (v: number) => `${v * scale}px`;

  const innerShadow = [
    `inset ${s(30)} ${s(30)} ${s(5)} ${s(-35)} rgba(255,255,255,0.50)`,
    // `inset ${s(20)} ${s(20)} ${s(10)} ${s(-20)} rgba(179,179,179,0.90)`,
    `inset ${s(-20)} ${s(-20)} ${s(10)} ${s(-20)} rgba(255,255,255,0.20)`,
    // `inset 0 0 0 ${s(10)} rgba(153,153,153,0.60)`,
    // `inset 0 0 ${s(219)} 0 rgba(242,242,242,0.30)`,
  ].join(", ");

  return (
    <div
      className={cn("relative overflow-hidden border border-white/10 bg-white/20 backdrop-brightness-200 backdrop-saturate-200", className)}
      style={{ borderRadius: radius }}
    >
      {/* Diagonal top-left radial highlight — mix-blend-plus-lighter */}
      {/* <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            "radial-gradient(ellipse at 15% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)",
          mixBlendMode: "plus-lighter",
          backdropFilter: "blur(0px)",
          zIndex: 2,
        }}
      /> */}

      {/* Lens stack — 5 concentric backdrop-blur rings */}
      {/* <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: `${s(-2)} ${s(-2.5)} ${s(-2)} ${s(-3)}`,
          filter: `blur(${s(4)})`,
          zIndex: 1,
        }}
      >
        <div className="absolute inset-0 rounded-[1000px]" style={{ backdropFilter: "blur(50px)", background: "rgba(255,255,255,0.01)" }} />
        <div className="absolute rounded-[1000px]" style={{ inset: `${s(3)} ${s(2.07)}`, backdropFilter: "blur(25px)", background: "rgba(255,255,255,0.01)" }} />
        <div className="absolute rounded-[1000px]" style={{ inset: `${s(9)} ${s(6.2)}`, backdropFilter: "blur(12.5px)", background: "rgba(255,255,255,0.01)" }} />
        <div className="absolute rounded-[1000px]" style={{ inset: `${s(19)} ${s(13.09)}`, backdropFilter: "blur(5px)", background: "rgba(255,255,255,0.01)" }} />
        <div className="absolute rounded-[1000px]" style={{ inset: `${s(39)} ${s(26.86)}`, backdropFilter: "blur(1px)", background: "rgba(255,255,255,0.01)" }} />
      </div> */}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Inner shadow overlay — on top of content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: radius, boxShadow: innerShadow, zIndex: 20 }}
      />
    </div>
  );
}
