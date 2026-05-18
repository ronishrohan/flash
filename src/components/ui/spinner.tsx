export function Spinner({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  const bars = 12;
  const barW = size * 0.09;
  const barH = size * 0.25;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.33;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Loading">
      {Array.from({ length: bars }).map((_, i) => {
        const angle = (i / bars) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = Math.round((cx + r * Math.sin(rad) - barW / 2) * 1000) / 1000;
        const y = Math.round((cy - r * Math.cos(rad) - barH / 2) * 1000) / 1000;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={barW / 2}
            fill={color}
            transform={`rotate(${angle}, ${cx}, ${cy})`}
            style={{
              animation: `mac-spin-fade 1s ${-((bars - i) / bars)}s linear infinite`,
            }}
          />
        );
      })}
    </svg>
  );
}
