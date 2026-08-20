'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { addToCart } from '@/actions/cart';
import { CartPlus } from './icons';

/**
 * Card-level add to cart. Adds the cheapest in-stock variant; products with
 * several options still get a link to the product page, because choosing a pot
 * size for someone is a guess they did not ask for.
 */
export function AddToCartButton({
  variantId,
  productSlug,
  variantCount,
  soldOut,
}: {
  variantId: string | null;
  productSlug: string;
  variantCount: number;
  soldOut: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  if (soldOut || !variantId) {
    return (
      <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-bone-3 px-4 py-2 text-[13px] font-medium text-ink-3">
        Sold out
      </span>
    );
  }

  if (variantCount > 1) {
    return (
      <Link
        href={`/product/${productSlug}`}
        className="relative z-10 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-leaf px-4 py-2 text-[13px] font-medium text-leaf transition-colors hover:bg-leaf hover:text-white"
      >
        Options
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          const result = await addToCart({ variantId, quantity: 1 });
          if (result.ok) {
            setAdded(true);
            router.refresh();
            setTimeout(() => setAdded(false), 2200);
          }
        });
      }}
      className="relative z-10 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-leaf px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-leaf-2 disabled:opacity-60"
    >
      <CartPlus size={15} />
      {pending ? 'Adding…' : added ? 'Added' : 'Add to cart'}
    </button>
  );
}
