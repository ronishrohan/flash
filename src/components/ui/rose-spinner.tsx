"use client";

import { useEffect, useRef } from "react";

interface RoseSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

const CONFIG = {
  particleCount: 76,
  trailSpan: 0.31,
  durationMs: 5300,
  rotationDurationMs: 28000,
  pulseDurationMs: 4400,
  strokeWidth: 4.6,
  roseA: 9.2,
  roseABoost: 0.6,
  roseBreathBase: 0.72,
  roseBreathBoost: 0.28,
  roseScale: 3.25,
} as const;

function point(progress: number, detailScale: number) {
  const t = progress * Math.PI * 2;
  const a = CONFIG.roseA + detailScale * CONFIG.roseABoost;
  const r = a * (CONFIG.roseBreathBase + detailScale * CONFIG.roseBreathBoost) * Math.cos(3 * t);
  return {
    x: 50 + Math.cos(t) * r * CONFIG.roseScale,
    y: 50 + Math.sin(t) * r * CONFIG.roseScale,
  };
}

function buildPath(detailScale: number, steps = 480): string {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = point(i / steps, detailScale);
    return `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(" ");
}

function getDetailScale(time: number): number {
  const pulseAngle = ((time % CONFIG.pulseDurationMs) / CONFIG.pulseDurationMs) * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

function norm(p: number): number {
  return ((p % 1) + 1) % 1;
}

export function RoseSpinner({ size = 120, color = "currentColor", className }: RoseSpinnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const SVG_NS = "http://www.w3.org/2000/svg";
    const group = svg.querySelector<SVGGElement>("#rg")!;
    const pathEl = svg.querySelector<SVGPathElement>("#rp")!;

    const particles = Array.from({ length: CONFIG.particleCount }, () => {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("fill", "currentColor");
      group.appendChild(c);
      return c;
    });

    const startedAt = performance.now();

    function render(now: number) {
      const time = now - startedAt;
      const progress = (time % CONFIG.durationMs) / CONFIG.durationMs;
      const detailScale = getDetailScale(time);
      const rotation = -((time % CONFIG.rotationDurationMs) / CONFIG.rotationDurationMs) * 360;

      group.setAttribute("transform", `rotate(${rotation} 50 50)`);
      pathEl.setAttribute("d", buildPath(detailScale));

      particles.forEach((node, i) => {
        const tailOffset = i / (CONFIG.particleCount - 1);
        const p = point(norm(progress - tailOffset * CONFIG.trailSpan), detailScale);
        const fade = Math.pow(1 - tailOffset, 0.56);
        node.setAttribute("cx", p.x.toFixed(2));
        node.setAttribute("cy", p.y.toFixed(2));
        node.setAttribute("r", (0.9 + fade * 2.7).toFixed(2));
        node.setAttribute("opacity", (0.04 + fade * 0.96).toFixed(3));
      });

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color }}
    >
      <g id="rg">
        <path
          id="rp"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={CONFIG.strokeWidth}
          opacity="0.1"
        />
      </g>
    </svg>
  );
}
