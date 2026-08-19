import Link from 'next/link';
import type { ProductCard as Card } from '@/lib/catalog';
import { formatINR, formatPriceRange } from '@/lib/money';
import { Stars } from './stars';
import { WishlistButton } from './wishlist-button';

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
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.maxPrice;

  return (
    <article className="group relative flex flex-col border border-line bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-bone-2">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-2">
          {soldOut && (
            <span className="bg-ink px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
              Sold out
            </span>
          )}
          {!soldOut && onSale && (
            <span className="bg-clay px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
              Sale
            </span>
          )}
          {!soldOut && product.available > 0 && product.available <= 3 && (
            <span className="bg-sun-2 px-2 py-1 text-[11px] font-medium text-sun">
              Only {product.available} left
            </span>
          )}
        </div>

        <div className="absolute right-2 top-2">
          <WishlistButton
            productId={product.id}
            initiallyWishlisted={wishlisted}
            signedIn={signedIn}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-3">
          {product.type === 'SEED' ? 'Seeds' : 'Plant'}
        </span>

        <h3 className="mt-1.5 font-display text-[17px] leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="hover:text-leaf">
            <span className="absolute inset-0" aria-hidden="true" />
            {product.name}
          </Link>
        </h3>

        {product.botanicalName && (
          <p className="mt-0.5 text-xs italic text-ink-3">{product.botanicalName}</p>
        )}

        <div className="mt-2">
          <Stars rating={product.ratingAvg} count={product.ratingCount} />
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-ink">
              {formatPriceRange(product.minPrice, product.maxPrice)}
            </span>
            {onSale && product.compareAtPrice != null && (
              <span className="text-sm text-ink-3 line-through">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
          </div>
          {product.variantCount > 1 && (
            <p className="mt-1 text-xs text-ink-3">
              {product.variantCount} options
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
