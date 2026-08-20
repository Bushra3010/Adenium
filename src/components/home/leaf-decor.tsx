/** Soft botanical shapes that sit behind a section, purely decorative. */
export function LeafDecor({
  className = '',
  flip = false,
  opacity = 0.5,
}: {
  className?: string;
  flip?: boolean;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 200 220"
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className}`}
      style={{ opacity, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <g fill="none" stroke="#7f9c83" strokeWidth="1.6" strokeLinecap="round">
        <path d="M20 210C40 150 70 100 130 60" />
        <path d="M60 150c-18-6-28-24-24-44 20-2 38 10 42 30" />
        <path d="M92 108c-14-14-14-36 0-52 16 12 20 34 8 50" />
        <path d="M118 74c-4-20 8-38 28-44 6 20-4 40-22 48" />
      </g>
      <g fill="#8fae93" opacity="0.55">
        <ellipse cx="52" cy="126" rx="26" ry="15" transform="rotate(-30 52 126)" />
        <ellipse cx="96" cy="80" rx="22" ry="13" transform="rotate(-62 96 80)" />
        <ellipse cx="140" cy="42" rx="24" ry="14" transform="rotate(-38 140 42)" />
      </g>
    </svg>
  );
}
