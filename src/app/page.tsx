import Link from 'next/link';
import { getCategoryTree, listProducts } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { wishlistedIds } from '@/lib/wishlist';
import { prisma } from '@/lib/prisma';
import { safely } from '@/lib/db-status';
import { Hero } from '@/components/home/hero';
import { TrustStrip } from '@/components/home/trust-strip';
import { CategoryCircles, type CircleItem } from '@/components/home/category-circles';
import { CatalogCards, type CatalogCard } from '@/components/home/catalog-cards';
import { ProductRail } from '@/components/home/product-rail';
import { ArrowRight } from '@/components/icons';

export const dynamic = 'force-dynamic';

const EMPTY = { items: [], total: 0, page: 1, perPage: 0, pages: 0 };

export default async function HomePage() {
  const [tree, featured, user] = await Promise.all([
    safely(() => getCategoryTree(), [], 'home categories'),
    safely(() => listProducts({ sort: 'relevance', featuredOnly: true, perPage: 8 }), EMPTY, 'featured'),
    safely(() => getCurrentUser(), null, 'home session'),
  ]);

  // Keep the two rails distinct — the newest products sort high on relevance too.
  const [newest, guides, saved, counts] = await Promise.all([
    safely(
      () => listProducts({ sort: 'newest', perPage: 8, excludeIds: featured.items.map((p) => p.id) }),
      EMPTY,
      'newest',
    ),
    safely(
      () =>
        prisma.guide.findMany({
          where: { isPublished: true },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: { slug: true, title: true, excerpt: true, coverImage: true },
        }),
      [],
      'guides',
    ),
    safely(() => wishlistedIds(), new Set<string>(), 'wishlist'),
    safely(
      () =>
        prisma.productCategory.groupBy({
          by: ['categoryId'],
          _count: true,
          where: { product: { status: 'ACTIVE' } },
        }),
      [] as { categoryId: string; _count: number }[],
      'category counts',
    ),
  ]);

  const countFor = (slug: string) => {
    const all = tree.flatMap((p) => [p, ...p.children]);
    const match = all.find((c) => c.slug === slug);
    if (!match) return 0;
    return counts.find((c) => c.categoryId === match.id)?._count ?? 0;
  };

  const seedFeature = featured.items.find((p) => p.type === 'SEED') ?? newest.items[0] ?? null;
  const plantFeature = featured.items.find((p) => p.type === 'PLANT') ?? null;
  const cactusFeature =
    [...featured.items, ...newest.items].find((p) =>
      /cact|astrophytum|echino/i.test(`${p.name} ${p.botanicalName ?? ''}`),
    ) ?? null;

  const circles: CircleItem[] = [
    {
      href: '/seeds/adenium-seeds',
      label: 'Adenium Seeds',
      sub: `${countFor('adenium-seeds')} varieties`,
      icon: 'seeds',
    },
    {
      href: '/plants/adenium-caudex',
      label: 'Adenium Plants',
      sub: 'Hand grown',
      icon: 'plant',
    },
    {
      href: '/plants/cacti',
      label: 'Cactus & Succulents',
      sub: 'Rare collection',
      icon: 'cactus',
    },
    {
      href: '/seeds/succulent-seeds',
      label: 'Euphorbia',
      sub: 'Unique varieties',
      icon: 'flower',
    },
    { href: '/guides', label: 'Guides & Care', sub: 'Learn & grow', icon: 'book' },
  ];

  const catalogCards: CatalogCard[] = tree.map((parent, i) => ({
    slug: parent.slug,
    name: parent.name,
    description: parent.description,
    image:
      parent.slug === 'plants'
        ? '/Images/Adanium Plant Image.png'
        : '/Images/seeds and leaves.png',
    tone: i === 0 ? 'sage' : 'sand',
    children: parent.children.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  }));

  return (
    /* Phones follow the app layout — categories and products first, supporting
       detail after. Desktop keeps the editorial order. Same markup, reordered. */
    <div className="flex flex-col">
      <div className="order-1">
        <Hero
          feature={plantFeature ?? featured.items[0] ?? null}
          seedCard={seedFeature}
          cactusCard={cactusFeature}
        />
      </div>

      <div className="order-2 lg:order-5">
        <CategoryCircles items={circles} />
      </div>

      {featured.items.length > 0 && (
        <div className="order-3 lg:order-4">
          <ProductRail
            title="Picked this season"
            href="/search"
            products={featured.items}
            wishlisted={[...saved]}
            signedIn={Boolean(user)}
          />
        </div>
      )}

      <div className="order-4 lg:order-2">
        <TrustStrip />
      </div>

      {newest.items.length > 0 && (
        <div className="order-5 lg:order-6">
          <ProductRail
            title="New arrivals"
            href="/search?sort=newest"
            linkLabel="See everything"
            products={newest.items}
            wishlisted={[...saved]}
            signedIn={Boolean(user)}
          />
        </div>
      )}

      <div className="order-6 lg:order-3">
        <CatalogCards cards={catalogCards} />
      </div>

      {guides.length > 0 && (
        <section className="order-7 border-t border-line bg-bone-2">
          <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-5 lg:py-16 xl:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-[26px] leading-tight text-ink lg:text-[34px]">
                  Growing guides
                </h2>
                <div className="mt-3 h-px w-14 bg-line-2" />
              </div>
              <Link
                href="/guides"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-leaf hover:underline"
              >
                All guides
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_12px_40px_-18px_rgba(22,33,28,0.35)]"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gradient-to-b from-sage/55 to-bone-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.coverImage ?? '/img/ph/guide.svg'}
                      alt=""
                      width={480}
                      height={300}
                      loading="lazy"
                      className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-[19px] leading-snug text-ink group-hover:text-leaf">
                      {g.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-3">
                      {g.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
