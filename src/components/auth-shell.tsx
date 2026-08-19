import Link from 'next/link';

export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-16">
      <Link href="/" className="text-center font-display text-3xl text-ink">
        Adenium
      </Link>
      <div className="mt-10 border border-line bg-white p-8">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        {intro && <p className="mt-2 text-sm leading-relaxed text-ink-3">{intro}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
