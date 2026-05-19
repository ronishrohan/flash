"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, animate, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiquidGlassProps extends Omit<HTMLMotionProps<"div">, "style"> {
  children?: React.ReactNode;
  className?: string;
  radius?: string;
  scale?: number;
  hoverable?: boolean;
  dark?: boolean;
  /** Disables all magnetic/scale physics — just renders the glass surface */
  static?: boolean;
  /** Optional background (e.g. gradient) painted behind the glass layers */
  background?: string;
}

const SPRING        = { type: "spring" as const, stiffness: 300, damping: 28 };
const SPRING_RETURN = { type: "spring" as const, stiffness: 100, damping: 18, mass: 1.2 };
const MAGNETIC = 0.08;
const MAX_PX   = 10;
const MAX_SCALE = 1.2;
const SCALE_ZONE = 300; // px from center at which max scale is reached

export function LiquidGlass({
  children,
  className,
  radius = "9999px",
  scale = 1,
  hoverable = false,
  dark = false,
  static: isStatic = false,
  background,
  ...motionProps
}: LiquidGlassProps) {
  const s = (v: number) => `${v * scale}px`;
  const ref = useRef<HTMLDivElement>(null);
  const pressed = useRef(false);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const [origin, setOrigin] = useState("center center");
  const [zIndex, setZIndex] = useState<number | undefined>(undefined);
  const [hovered, setHovered] = useState(false);

  const rawX  = useMotionValue(0);
  const rawY  = useMotionValue(0);
  const rawSX = useMotionValue(1); // scaleX
  const rawSY = useMotionValue(1); // scaleY
  const x  = useSpring(rawX,  SPRING);
  const y  = useSpring(rawY,  SPRING);
  const sX = useSpring(rawSX, SPRING);
  const sY = useSpring(rawSY, SPRING);

  function returnToRest() {
    animate(rawX,  0, SPRING_RETURN);
    animate(rawY,  0, SPRING_RETURN);
    animate(rawSX, 1, SPRING_RETURN);
    animate(rawSY, 1, SPRING_RETURN);
  }

  function setNearestOrigin(clientX: number, clientY: number) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ox = clientX < rect.left + rect.width  / 2 ? "left" : "right";
    const oy = clientY < rect.top  + rect.height / 2 ? "top"  : "bottom";
    setOrigin(`${ox} ${oy}`);
  }

  function update(clientX: number, clientY: number) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    setSpot({
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top,  rect.height)),
    });

    const clamp = (v: number) => Math.max(-MAX_PX, Math.min(MAX_PX, v));
    rawX.set(clamp((clientX - cx) * MAGNETIC));
    rawY.set(clamp((clientY - cy) * MAGNETIC));

    // Origin = opposite of drag direction from initial press point
    if (pressOrigin.current) {
      const dx = clientX - pressOrigin.current.x;
      const dy = clientY - pressOrigin.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        const ox = dx > 0 ? "left" : "right";
        const oy = dy > 0 ? "top"  : "bottom";
        setOrigin(`${ox} ${oy}`);
      }
    }

    // Scale on dominant axis — blend smoothly using axis ratio
    const absDx = Math.abs(clientX - cx);
    const absDy = Math.abs(clientY - cy);
    const total = absDx + absDy || 1;
    const ratioX = absDx / total; // 0→1 how horizontal
    const ratioY = absDy / total; // 0→1 how vertical
    const dist = Math.sqrt((clientX - cx) ** 2 + (clientY - cy) ** 2);
    const t = Math.min(dist / SCALE_ZONE, 1);
    const extra = t * (MAX_SCALE - 1);
    rawSX.set(1 + extra * ratioX);
    rawSY.set(1 + extra * ratioY);
  }

  function release() {
    pressed.current = false;
    pressOrigin.current = null;
    setSpot(null);
    setZIndex(undefined);
    setHovered(false);
    returnToRest();
    // Wait for both scale springs to settle before resetting origin
    const unsub1 = sX.on("change", check);
    const unsub2 = sY.on("change", check);
    function check() {
      if (Math.abs(sX.get() - 1) < 0.005 && Math.abs(sY.get() - 1) < 0.005) {
        setOrigin("center center");
        unsub1();
        unsub2();
      }
    }
  }

  useEffect(() => {
    if (isStatic) return;
    const onMove = (e: MouseEvent) => { if (pressed.current) update(e.clientX, e.clientY); };
    const onUp   = ()              => { if (pressed.current) release(); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic]);

  useEffect(() => {
    if (isStatic) return;
    const onMove = (e: TouchEvent) => { if (pressed.current) { const t = e.touches[0]; update(t.clientX, t.clientY); } };
    const onEnd  = ()              => { if (pressed.current) release(); };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend",  onEnd);
    return () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic]);

  const innerShadow = [
    `inset ${s(30)} ${s(30)} ${s(5)} ${s(-35)} rgba(255,255,255,0.50)`,
    `inset ${s(20)} ${s(20)} ${s(10)} ${s(-20)} rgba(255,255,255,0.20)`,
    `inset ${s(-30)} ${s(-30)} ${s(5)} ${s(-35)} rgba(255,255,255,0.50)`,
    `inset ${s(-20)} ${s(-20)} ${s(10)} ${s(-20)} rgba(255,255,255,0.20)`,
    `inset ${s(16)} ${s(-24)} ${s(5)} ${s(-20)} rgba(50,50,50,0.05)`,
    `inset ${s(-16)} ${s(24)} ${s(5)} ${s(-20)} rgba(50,50,50,0.05)`,
  ].join(", ");

  const staticHoverHandlers = isStatic && hoverable
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  const glassInner = (
    <motion.div
      ref={ref}
      {...motionProps}
      {...staticHoverHandlers}
      style={{ borderRadius: radius, background }}
      className={cn("relative overflow-hidden", !background && (dark ? "bg-white/5" : "bg-sky-600/10"), className)}
    >
        {/* Backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: radius,
            backdropFilter: "blur(12px) brightness(1.15) saturate(1.8)",
            WebkitBackdropFilter: "blur(12px) brightness(1.15) saturate(1.8)",
          }}
        />

        {/* Hover overlay */}
        {hoverable && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 transition-colors duration-150"
            style={{ borderRadius: radius, backgroundColor: hovered ? (dark ? "rgba(255,255,255,0.12)" : "rgba(186,230,253,0.2)") : "transparent" }}
          />
        )}

        {/* Tap spotlight */}
        <AnimatePresence>
          {spot && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="pointer-events-none absolute z-10"
              style={{
                left: spot.x,
                top: spot.y,
                transform: "translate(-50%, -50%)",
                width: 70,
                height: 70,
                borderRadius: "9999px",
                background: dark ? "rgba(255,255,255,0.15)" : "rgba(186,230,253,0.35)",
                filter: "blur(16px)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Inner shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: radius, boxShadow: innerShadow, zIndex: 20 }}
        />
    </motion.div>
  );

  if (isStatic) {
    return <div className={cn("contents")}>{glassInner}</div>;
  }

  return (
    <motion.div
      style={{ x, y, scaleX: sX, scaleY: sY, transformOrigin: origin, zIndex, position: zIndex ? "relative" : undefined }}
      onMouseEnter={() => { if (hoverable) setHovered(true); }}
      onMouseLeave={() => { if (!pressed.current) setHovered(false); }}
      onMouseDown={(e) => { pressed.current = true; setZIndex(2000); setHovered(true); pressOrigin.current = { x: e.clientX, y: e.clientY }; setNearestOrigin(e.clientX, e.clientY); update(e.clientX, e.clientY); motionProps.onMouseDown?.(e); }}
      onTouchStart={(e) => { const t = e.touches[0]; pressed.current = true; setZIndex(2000); setHovered(true); pressOrigin.current = { x: t.clientX, y: t.clientY }; setNearestOrigin(t.clientX, t.clientY); update(t.clientX, t.clientY); motionProps.onTouchStart?.(e); }}
    >
      {glassInner}
    </motion.div>
  );
}
