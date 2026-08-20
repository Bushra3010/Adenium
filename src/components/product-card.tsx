import Link from 'next/link';
import type { ProductCard as Card } from '@/lib/catalog';
import { formatINR, formatPriceRange } from '@/lib/money';
import { Star } from './icons';
import { WishlistButton } from './wishlist-button';
import { AddToCartButton } from './add-to-cart-button';

export function ProductCardItem({
  product,
  wishlisted = false,
  signedIn = false,
}: {
  product: Card;
  wishlisted?: boolean;
  signedIn?: boolean;
}) {
  const soldOut = product.available <= 0;
  const discount = product.discountPercent;
  const onSale = discount > 0;
  // Only strike a price out when it is that exact price that came down.
  const wasPrice = product.compareAtPrice;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_12px_40px_-18px_rgba(22,33,28,0.35)]">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-sage/55 to-bone-2">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.imageAlt}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        <div className="pointer-events-none absolute left-0 top-0 flex flex-col items-start gap-1.5 p-3">
          {soldOut ? (
            <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Sold out
            </span>
          ) : onSale ? (
            <span className="rounded-r-full bg-clay px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Save {discount}%
            </span>
          ) : null}
          {!soldOut && product.available > 0 && product.available <= 3 && (
            <span className="rounded-full bg-sun-2 px-3 py-1 text-[11px] font-medium text-sun">
              Only {product.available} left
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton
            productId={product.id}
            initiallyWishlisted={wishlisted}
            signedIn={signedIn}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-[17px] leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-leaf">
            <span className="absolute inset-0" aria-hidden="true" />
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-1 text-[13px] text-ink-3">
          {product.botanicalName ?? product.shortDescription}
        </p>

        {product.ratingCount > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-ink-3">
            <Star size={13} className="text-sun" />
            {product.ratingAvg.toFixed(1)}
            <span className="text-ink-3">({product.ratingCount})</span>
          </span>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <div className="flex items-baseline gap-2">
            <span className={`font-medium ${wasPrice ? 'text-clay' : 'text-ink'}`}>
              {formatPriceRange(product.minPrice, product.maxPrice)}
            </span>
            {wasPrice != null && (
              <span className="text-[13px] text-ink-3 line-through">{formatINR(wasPrice)}</span>
            )}
          </div>

          <AddToCartButton
            variantId={product.defaultVariantId}
            productSlug={product.slug}
            variantCount={product.variantCount}
            soldOut={soldOut}
          />
        </div>
      </div>
    </article>
  );
}
