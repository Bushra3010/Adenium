import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { availableQtyMany } from '@/lib/stock';
import { toNumber } from '@/lib/money';
import { ProductGrid } from '@/components/product-grid';
import type { ProductCard } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your wishlist', robots: { index: false, follow: false } };

export default async function WishlistPage() {
  const user = await requireUser();

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true, slug: true, name: true, botanicalName: true, type: true,
          shortDescription: true, ratingAvg: true, ratingCount: true, status: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
          variants: { where: { isActive: true }, select: { id: true, price: true, compareAtPrice: true } },
        },
      },
    },
  });

  const active = rows.filter((r) => r.product.status === 'ACTIVE');
  const availability = await availableQtyMany(
    active.flatMap((r) => r.product.variants.map((v) => v.id)),
  );

  const items: ProductCard[] = active.map((r) => {
    const p = r.product;
    const prices = p.variants.map((v) => toNumber(v.price));
    return {
      id: p.id, slug: p.slug, name: p.name, botanicalName: p.botanicalName, type: p.type,
      shortDescription: p.shortDescription,
      image: p.images[0]?.url ?? '/img/ph/default.svg',
      imageAlt: p.images[0]?.alt ?? p.name,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      compareAtPrice: null,
      ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
      available: p.variants.reduce((s, v) => s + (availability.get(v.id) ?? 0), 0),
      variantCount: p.variants.length,
    };
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Your wishlist</h2>

      {items.length === 0 ? (
        <div className="mt-6 border border-line bg-white p-10 text-center">
          <p className="text-ink-3">Nothing saved yet.</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">
            Use the heart on any product to keep it here — useful for the one-off plants,
            which rarely come back once they go.
          </p>
          <Link
            href="/plants"
            className="mt-5 inline-block bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
          >
            Browse plants
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ProductGrid
            items={items}
            wishlisted={new Set(items.map((i) => i.id))}
            signedIn
          />
        </div>
      )}
    </div>
  );
}
