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
  fullWidth = false,
}: {
  variantId: string | null;
  productSlug: string;
  variantCount: number;
  soldOut: boolean;
  /** Phones give the action its own full-width row beneath the price. */
  fullWidth?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const shape = fullWidth
    ? 'w-full justify-center rounded-xl px-4 py-2.5 text-[13.5px]'
    : 'shrink-0 rounded-full px-4 py-2 text-[13px]';

  if (soldOut || !variantId) {
    return (
      <span className={`inline-flex items-center whitespace-nowrap bg-bone-3 font-medium text-ink-3 ${shape}`}>
        Sold out
      </span>
    );
  }

  if (variantCount > 1) {
    return (
      <Link
        href={`/product/${productSlug}`}
        className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap border border-leaf font-medium text-leaf transition-colors hover:bg-leaf hover:text-white ${shape}`}
      >
        {fullWidth ? 'Choose options' : 'Options'}
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
      className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:opacity-60 ${
        fullWidth ? 'bg-leaf-3 text-leaf hover:bg-leaf hover:text-white' : 'bg-leaf text-white hover:bg-leaf-2'
      } ${shape}`}
    >
      <CartPlus size={15} />
      {pending ? 'Adding…' : added ? 'Added' : 'Add to cart'}
    </button>
  );
}
