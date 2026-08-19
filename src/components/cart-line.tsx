'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeCartItem, updateCartItem } from '@/actions/cart';
import { formatINR } from '@/lib/money';
import type { CartLine } from '@/lib/cart';

export function CartLineRow({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function change(quantity: number) {
    setError(null);
    startTransition(async () => {
      const res = await updateCartItem(line.id, quantity);
      if (!res.ok && res.message) setError(res.message);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItem(line.id);
      router.refresh();
    });
  }

  return (
    <li className={`flex gap-4 py-6 ${pending ? 'opacity-60' : ''}`}>
      <Link
        href={`/product/${line.productSlug}`}
        className="block h-24 w-24 shrink-0 overflow-hidden border border-line bg-bone-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={line.image} alt="" className="h-full w-full object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-snug text-ink">
              <Link href={`/product/${line.productSlug}`} className="hover:text-leaf">
                {line.productName}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-ink-3">{line.variantLabel}</p>
            <p className="mt-0.5 text-xs text-ink-3">SKU {line.sku}</p>
          </div>
          <p className="font-medium text-ink">{formatINR(line.unitPrice * line.quantity)}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center border border-line bg-white">
            <button
              type="button"
              onClick={() => change(line.quantity - 1)}
              disabled={pending || line.quantity <= 1}
              className="px-3 py-1.5 text-ink-2 hover:bg-bone-2 disabled:opacity-40"
              aria-label={`Decrease quantity of ${line.productName}`}
            >
              −
            </button>
            <span className="w-10 border-x border-line py-1.5 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => change(line.quantity + 1)}
              disabled={pending || line.quantity >= line.available}
              className="px-3 py-1.5 text-ink-2 hover:bg-bone-2 disabled:opacity-40"
              aria-label={`Increase quantity of ${line.productName}`}
            >
              +
            </button>
          </div>

          <span className="text-sm text-ink-3">{formatINR(line.unitPrice)} each</span>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-sm text-clay hover:underline"
          >
            Remove
          </button>

          {line.available <= 3 && (
            <span className="text-sm text-sun">Only {line.available} left</span>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
      </div>
    </li>
  );
}
