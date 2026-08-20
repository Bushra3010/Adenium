import Link from 'next/link';

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 border border-line bg-white">
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  sub,
  href,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  tone?: 'default' | 'warn' | 'good';
}) {
  const toneClass = tone === 'warn' ? 'text-sun' : tone === 'good' ? 'text-leaf' : 'text-ink';
  const inner = (
    <>
      <p className="text-xs uppercase tracking-[0.12em] text-ink-3">{label}</p>
      <p className={`mt-2 font-display text-3xl tabular-nums ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-3">{sub}</p>}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="block border border-line bg-white p-5 transition-colors hover:border-leaf"
    >
      {inner}
    </Link>
  ) : (
    <div className="border border-line bg-white p-5">{inner}</div>
  );
}

export function Table({
  head,
  children,
  empty,
}: {
  head: string[];
  children: React.ReactNode;
  empty?: string;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={head.length} className="px-3 py-10 text-center text-ink-3">
                {empty ?? 'Nothing here yet.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({
  children,
  className = 'bg-bone-3 text-ink-2',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
