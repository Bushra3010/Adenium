import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Breadcrumbs } from '@/components/breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Growing guides',
  description:
    'Sowing, germination, caudex building and monsoon care — the notes we use ourselves.',
  alternates: { canonical: '/guides' },
};

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides' }]} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-4xl leading-tight text-ink">Growing guides</h1>
        <p className="mt-3 leading-relaxed text-ink-2">
          What actually works, written from our own benches — sowing windows, germination
          temperatures, caudex work and the monsoon weeks that undo most collections.
        </p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {guides.map((g) => (
          <Link
            key={g.id}
            href={`/guides/${g.slug}`}
            className="group flex flex-col border border-line bg-white"
          >
            <div className="aspect-[16/9] overflow-hidden bg-bone-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.coverImage ?? '/img/ph/guide.svg'}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h2 className="font-display text-xl leading-snug text-ink group-hover:text-leaf">
                {g.title}
              </h2>
              {g.excerpt && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-3">{g.excerpt}</p>
              )}
              <span className="mt-4 text-sm font-medium text-leaf">Read the guide →</span>
            </div>
          </Link>
        ))}
      </div>

      {guides.length === 0 && (
        <p className="mt-10 border border-line bg-white p-10 text-center text-ink-3">
          No guides published yet.
        </p>
      )}
    </div>
  );
}
