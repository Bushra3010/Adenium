import Link from 'next/link';
import { getCategoryTree, listProducts } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { wishlistedIds } from '@/lib/wishlist';
import { prisma } from '@/lib/prisma';
import { ProductCardItem } from '@/components/product-card';

export const dynamic = 'force-dynamic';

const TRUST = [
  { title: 'Raised from seed', body: 'Most of what we sell is grown here, not imported and resold.' },
  { title: 'Germination tested', body: 'Every seed lot is trialled before it is listed. Rates are published.' },
  { title: 'Packed for transit', body: 'Plants ship Monday to Wednesday so nothing waits in a hub.' },
  { title: 'Care support', body: 'Guides on every product page, and a reply within a working day.' },
];

export default async function HomePage() {
  const [tree, featured, guides, user] = await Promise.all([
    getCategoryTree(),
    listProducts({ sort: 'relevance', featuredOnly: true, perPage: 8 }),
    prisma.guide.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { slug: true, title: true, excerpt: true, coverImage: true },
    }),
    getCurrentUser(),
  ]);

  // Keep the two product rails distinct — otherwise the newest products, which
  // sort high on relevance too, appear twice on one page.
  const newest = await listProducts({
    sort: 'newest',
    perPage: 4,
    excludeIds: featured.items.map((p) => p.id),
  });
  const saved = await wishlistedIds();

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-bone-2">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-leaf">
              Desert roses · Caudex · Rare cacti
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              Seed that germinates.
              <br />
              Plants with a base worth growing.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-2">
              We raise adenium, euphorbia and astrophytum from seed and sell what we would
              keep. Every listing carries the germination data and care notes we use
              ourselves — because a plant you can grow is worth more than one you can only buy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/seeds"
                className="bg-leaf px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-leaf-2"
              >
                Shop seeds
              </Link>
              <Link
                href="/plants"
                className="border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Shop plants
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {featured.items.slice(0, 4).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className={`block overflow-hidden border border-line bg-white ${
                    i % 3 === 0 ? 'row-span-2' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-px bg-line px-5 py-0 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="bg-bone p-6">
              <h2 className="font-display text-lg text-ink">{t.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="font-display text-3xl text-ink">Browse the catalog</h2>
        <p className="mt-2 max-w-xl text-ink-3">
          Two ways in — start from seed and grow it yourself, or take on a plant that already
          has a few seasons behind it.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {tree.map((parent) => (
            <div key={parent.id} className="border border-line bg-white p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl text-ink">{parent.name}</h3>
                <Link
                  href={`/${parent.slug}`}
                  className="text-sm font-medium text-leaf hover:underline"
                >
                  View all →
                </Link>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">{parent.description}</p>
              <ul className="mt-5 grid grid-cols-2 gap-2">
                {parent.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/${parent.slug}/${child.slug}`}
                      className="block border border-line px-3 py-2 text-sm text-ink-2 transition-colors hover:border-leaf hover:text-leaf"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="border-t border-line bg-bone-2">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl text-ink">Picked this season</h2>
            <Link href="/search" className="text-sm font-medium text-leaf hover:underline">
              All products →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.slice(0, 8).map((p) => (
              <ProductCardItem
                key={p.id}
                product={p}
                wishlisted={saved.has(p.id)}
                signedIn={Boolean(user)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="font-display text-3xl text-ink">Just listed</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {newest.items.map((p) => (
            <ProductCardItem
              key={p.id}
              product={p}
              wishlisted={saved.has(p.id)}
              signedIn={Boolean(user)}
            />
          ))}
        </div>
      </section>

      {/* Guides */}
      <section className="border-t border-line bg-bone-2">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl text-ink">Growing guides</h2>
            <Link href="/guides" className="text-sm font-medium text-leaf hover:underline">
              All guides →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group block border border-line bg-white"
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
                <div className="p-5">
                  <h3 className="font-display text-lg leading-snug text-ink group-hover:text-leaf">
                    {g.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-3">{g.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
