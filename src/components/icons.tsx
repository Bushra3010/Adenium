/** Line icons drawn to one grid: 24px box, 1.5 stroke, round caps. */
type P = { className?: string; size?: number; strokeWidth?: number };

const base = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function Leaf({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9h7v7a9 9 0 0 1-9 9Z" />
      <path d="M4 20c3-6 7-9 12-11" />
    </svg>
  );
}

export function Sprout({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 20v-8" />
      <path d="M12 12C12 8 9 5 5 5c0 4 3 7 7 7Z" />
      <path d="M12 12c0-3.5 2.6-6.5 6.5-6.5 0 3.9-3 6.5-6.5 6.5Z" />
    </svg>
  );
}

export function Shield({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function Truck({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function HandLeaf({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 15c2-1 4-1 6 0l2 1h3a1.5 1.5 0 0 1 0 3H9" />
      <path d="M12 10c0-3 2-5 5-5 0 3-2 5-5 5Z" />
      <path d="M12 10c0-2.2-1.8-4-4-4 0 2.2 1.8 4 4 4Z" />
    </svg>
  );
}

export function Medal({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="14" r="5" />
      <path d="m9 9-2-6M15 9l2-6M12 12.5l.8 1.6 1.7.2-1.3 1.2.4 1.7-1.6-.9-1.6.9.4-1.7-1.3-1.2 1.7-.2Z" />
    </svg>
  );
}

export function Seeds({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <ellipse cx="9" cy="9" rx="3" ry="4" transform="rotate(-25 9 9)" />
      <ellipse cx="15.5" cy="14.5" rx="3" ry="4" transform="rotate(20 15.5 14.5)" />
    </svg>
  );
}

export function PottedPlant({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 14h12l-1.2 6H7.2L6 14Z" />
      <path d="M12 14V8" />
      <path d="M12 10C12 7 10 5 7 5c0 3 2 5 5 5Z" />
      <path d="M12 11c0-2.6 2-4.5 4.8-4.5C16.8 9 14.8 11 12 11Z" />
    </svg>
  );
}

export function Cactus({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M10 21V6a2 2 0 1 1 4 0v15" />
      <path d="M10 12H8a2 2 0 0 1-2-2V9M14 14h2a2 2 0 0 0 2-2v-2" />
      <path d="M8 21h8" />
    </svg>
  );
}

export function Flower({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5V6M12 14.5V18M9.5 12H6M14.5 12H18M10.2 10.2 7.8 7.8M13.8 10.2l2.4-2.4M10.2 13.8l-2.4 2.4M13.8 13.8l2.4 2.4" />
    </svg>
  );
}

export function Book({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
    </svg>
  );
}

export function Box({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
      <path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9" />
    </svg>
  );
}

export function Headset({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4ZM20 14h-2.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1v-4Z" />
    </svg>
  );
}

export function Search({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function Heart({
  className,
  size = 20,
  strokeWidth = 1.5,
  filled = false,
}: P & { filled?: boolean }) {
  return (
    <svg {...base(size, strokeWidth)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.4 5.6a4.7 4.7 0 0 0-6.7 0l-1.7 1.7-1.7-1.7a4.7 4.7 0 1 0-6.7 6.7l8.4 8.3 8.4-8.3a4.7 4.7 0 0 0 0-6.7Z" />
    </svg>
  );
}

export function User({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function Bag({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function CartPlus({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 4h2l2.2 9.5h9.4L19 7H6" />
      <circle cx="9" cy="18.5" r="1.4" />
      <circle cx="16" cy="18.5" r="1.4" />
    </svg>
  );
}

export function ArrowRight({ className, size = 18, strokeWidth = 1.6 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ className, size = 18, strokeWidth = 1.6 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRight({ className, size = 18, strokeWidth = 1.6 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function Star({ className, size = 14, filled = true }: P & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className={className}
    >
      <path d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8L12 3Z" />
    </svg>
  );
}

export function Home({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

export function Grid({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </svg>
  );
}

export function Sliders({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

export function Trolley({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M2.5 4h2.2l2.6 10.5h10.2L20 7H7" />
      <circle cx="9.5" cy="19" r="1.6" />
      <circle cx="17" cy="19" r="1.6" />
    </svg>
  );
}

export function BadgeCheck({ className, size = 20, strokeWidth = 1.5 }: P) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 3.2 14 5l2.6-.3.7 2.5 2.2 1.4-1.2 2.4 1.2 2.4-2.2 1.4-.7 2.5L14 19l-2 1.8L10 19l-2.6.3-.7-2.5-2.2-1.4L5.7 13 4.5 10.6l2.2-1.4.7-2.5L10 5l2-1.8Z" />
      <path d="m9.3 12 1.9 1.9 3.5-3.8" />
    </svg>
  );
}

/** Brand mark — a leaf in a filled roundel. Sized by class, so it can scale. */
export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-leaf text-white ${className}`}
      aria-hidden="true"
    >
      <svg
        className="h-[55%] w-[55%]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21V11" />
        <path d="M12 12C12 7.5 9 4 4.5 4 4.5 8.5 7.5 12 12 12Z" />
        <path d="M12 13c0-4 2.8-7 7-7 0 4-2.8 7-7 7Z" />
      </svg>
    </span>
  );
}
