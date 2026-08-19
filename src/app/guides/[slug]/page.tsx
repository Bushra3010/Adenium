import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { renderRichText } from '@/lib/rich-text';
import { Breadcrumbs } from '@/components/breadcrumbs';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/guides/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const guide = await prisma.guide.findFirst({ where: { slug, isPublished: true } });
  if (!guide) return { title: 'Guide not found' };

  const title = guide.metaTitle ?? guide.title;
  const description = guide.metaDescription ?? guide.excerpt ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title, description, type: 'article', url: `/guides/${guide.slug}` },
  };
}

export default async function GuidePage({ params }: PageProps<'/guides/[slug]'>) {
  const { slug } = await params;
  const guide = await prisma.guide.findFirst({ where: { slug, isPublished: true } });
  if (!guide) notFound();

  const more = await prisma.guide.findMany({
    where: { isPublished: true, id: { not: guide.id } },
    orderBy: { publishedAt: 'desc' },
    take: 2,
    select: { slug: true, title: true, excerpt: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Guides', href: '/guides' },
          { label: guide.title },
        ]}
      />

      <article className="mt-8">
        <header>
          <h1 className="font-display text-4xl leading-[1.15] text-ink">{guide.title}</h1>
          {guide.excerpt && (
            <p className="mt-4 font-display text-lg leading-relaxed text-ink-2">{guide.excerpt}</p>
          )}
          {guide.publishedAt && (
            <p className="mt-4 text-sm text-ink-3">
              {guide.publishedAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </header>

        <div className="mt-8 aspect-[21/9] overflow-hidden border border-line bg-bone-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={guide.coverImage ?? '/img/ph/guide.svg'}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div
          className="rich mt-10"
          dangerouslySetInnerHTML={{ __html: renderRichText(guide.body) }}
        />
      </article>

      <aside className="mt-16 border-t border-line pt-10">
        <h2 className="font-display text-2xl text-ink">Keep reading</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {more.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="border border-line bg-white p-5 hover:border-leaf">
              <h3 className="font-display text-lg leading-snug text-ink">{g.title}</h3>
              {g.excerpt && <p className="mt-2 text-sm text-ink-3">{g.excerpt}</p>}
            </Link>
          ))}
        </div>
        <Link href="/seeds" className="mt-8 inline-block bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2">
          Shop seeds
        </Link>
      </aside>
    </div>
  );
}
