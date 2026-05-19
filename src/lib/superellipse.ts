/**
 * Generates a superellipse path normalized to a 1×1 bounding box (for objectBoundingBox).
 * n=1.333 gives the iOS/macOS squircle feel.
 */
function superellipsePathUnit(n: number, steps = 128): string {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    // Normalized to [0,1] bounding box (center at 0.5, radius 0.5)
    const x = 0.5 + 0.5 * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n);
    const y = 0.5 + 0.5 * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
    points.push([x, y]);
  }
  return (
    points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(4)},${y.toFixed(4)}`).join(" ") + " Z"
  );
}

const INJECTED = new Set<string>();

/** Injects a reusable SVG clipPath into document body. Call once on mount. */
export function injectSquircleClipPath(id: string, n = 1.333): void {
  if (typeof document === "undefined" || INJECTED.has(id)) return;
  INJECTED.add(id);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
  clipPath.setAttribute("id", id);
  clipPath.setAttribute("clipPathUnits", "objectBoundingBox");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", superellipsePathUnit(n));

  clipPath.appendChild(path);
  defs.appendChild(clipPath);
  svg.appendChild(defs);
  document.body.appendChild(svg);
}

export const SQUIRCLE_CLIP_ID = "squircle-1333";
export const SQUIRCLE_CLIP = `url(#${SQUIRCLE_CLIP_ID})`;
