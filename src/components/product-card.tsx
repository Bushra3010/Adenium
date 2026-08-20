import Link from 'next/link';
import type { ProductCard as Card } from '@/lib/catalog';
import { formatINR } from '@/lib/money';
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
  const wasPrice = product.compareAtPrice;
  // Several variants means several prices; naming one of them flat would be a
  // quote the shopper cannot hold us to.
  const ranged = product.variantCount > 1 && product.maxPrice > product.minPrice;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_14px_44px_-20px_rgba(22,33,28,0.4)]">
      <div className="relative aspect-[4/3.4] overflow-hidden bg-gradient-to-b from-sage/55 to-bone-2">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.imageAlt}
            loading="lazy"
            width={400}
            height={340}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        {soldOut ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white lg:left-0 lg:rounded-l-none lg:rounded-r-full">
            Sold out
          </span>
        ) : discount > 0 ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-leaf px-3 py-1.5 text-[11px] font-semibold text-white lg:left-0 lg:rounded-l-none lg:rounded-r-full lg:bg-clay lg:uppercase lg:tracking-wide">
            {discount}% OFF
          </span>
        ) : null}

        {!soldOut && product.available > 0 && product.available <= 3 && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-sun-2 px-3 py-1 text-[11px] font-medium text-sun">
            Only {product.available} left
          </span>
        )}

        <div className="absolute right-3 top-3">
          <WishlistButton
            productId={product.id}
            initiallyWishlisted={wishlisted}
            signedIn={signedIn}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[16.5px] leading-snug text-ink line-clamp-2">
            <Link href={`/product/${product.slug}`} className="transition-colors hover:text-leaf">
              <span className="absolute inset-0" aria-hidden="true" />
              {product.name}
            </Link>
          </h3>

          <span className="shrink-0 text-right">
            {ranged && (
              <span className="block text-[10.5px] uppercase tracking-wide text-ink-3">from</span>
            )}
            <span
              className={`whitespace-nowrap text-[16px] font-semibold ${
                wasPrice ? 'text-clay' : 'text-ink'
              }`}
            >
              {formatINR(product.minPrice)}
            </span>
            {wasPrice != null && (
              <span className="ml-1.5 whitespace-nowrap text-[13px] text-ink-3 line-through">
                {formatINR(wasPrice)}
              </span>
            )}
          </span>
        </div>

        <div className="mt-auto pt-2.5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-ink-3">
                {product.shortDescription ?? product.botanicalName}
              </p>
              {product.ratingCount > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 text-[12px] text-ink-3">
                  <Star size={13} className="text-sun" />
                  {product.ratingAvg.toFixed(1)}
                  <span>({product.ratingCount})</span>
                </span>
              )}
            </div>

            <span className="hidden lg:block">
              <AddToCartButton
                variantId={product.defaultVariantId}
                productSlug={product.slug}
                variantCount={product.variantCount}
                soldOut={soldOut}
              />
            </span>
          </div>

          <div className="mt-3 lg:hidden">
            <AddToCartButton
              variantId={product.defaultVariantId}
              productSlug={product.slug}
              variantCount={product.variantCount}
              soldOut={soldOut}
              fullWidth
            />
          </div>
        </div>
      </div>
    </article>
  );
}
