export function Stars({
  rating,
  count,
  size = 14,
  showCount = true,
}: {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1.5" title={`${rating.toFixed(1)} out of 5`}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 20 20" className="text-sun">
              <defs>
                <linearGradient id={`half-${i}-${size}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.6l2.5 5.1 5.6.8-4 3.9 1 5.6L10 14.4 4.9 17l1-5.6-4-3.9 5.6-.8z"
                fill={fill === 1 ? 'currentColor' : fill === 0.5 ? `url(#half-${i}-${size})` : 'none'}
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
          );
        })}
      </span>
      <span className="sr-only">{rating.toFixed(1)} out of 5</span>
      {showCount && count != null && (
        <span className="text-xs text-ink-3">
          {count > 0 ? `(${count})` : 'No reviews yet'}
        </span>
      )}
    </span>
  );
}
