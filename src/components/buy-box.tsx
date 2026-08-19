'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/actions/cart';
import { formatINR } from '@/lib/money';

export type BuyBoxVariant = {
  id: string;
  optionValues: Record<string, string>;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  available: number;
  imageUrl: string | null;
};

/**
 * Variant selection and add-to-cart (PDP-02, PDP-03, PDP-04).
 * Price, stock and SKU update live; impossible combinations are disabled
 * rather than hidden, so the shopper can see what exists.
 */
export function BuyBox({
  variants,
  optionLabels,
  onVariantImage,
}: {
  variants: BuyBoxVariant[];
  optionLabels: Record<string, string>;
  onVariantImage?: (url: string | null) => void;
}) {
  const optionKeys = useMemo(() => {
    const keys: string[] = [];
    for (const v of variants) {
      for (const k of Object.keys(v.optionValues)) if (!keys.includes(k)) keys.push(k);
    }
    return keys;
  }, [variants]);

  const defaultVariant = useMemo(
    () => variants.find((v) => v.available > 0) ?? variants[0],
    [variants],
  );

  const [selection, setSelection] = useState<Record<string, string>>(
    () => defaultVariant?.optionValues ?? {},
  );
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  const selected = useMemo(
    () =>
      variants.find((v) =>
        optionKeys.every((k) => v.optionValues[k] === selection[k]),
      ) ?? null,
    [variants, optionKeys, selection],
  );

  const valuesFor = (key: string) => {
    const seen: string[] = [];
    for (const v of variants) {
      const value = v.optionValues[key];
      if (value && !seen.includes(value)) seen.push(value);
    }
    return seen;
  };

  /** A value is offered when some variant matches it plus the other picks. */
  const isCombinable = (key: string, value: string) =>
    variants.some(
      (v) =>
        v.optionValues[key] === value &&
        optionKeys.every((k) => k === key || v.optionValues[k] === selection[k]),
    );

  function choose(key: string, value: string) {
    const next = { ...selection, [key]: value };
    // Repair the other axes so the selection always lands on a real variant.
    for (const k of optionKeys) {
      if (k === key) continue;
      const stillValid = variants.some(
        (v) => v.optionValues[key] === value && v.optionValues[k] === next[k],
      );
      if (!stillValid) {
        const fallback = variants.find((v) => v.optionValues[key] === value);
        if (fallback) next[k] = fallback.optionValues[k];
      }
    }
    setSelection(next);
    setFeedback(null);
    setQuantity(1);

    const match = variants.find((v) => optionKeys.every((k) => v.optionValues[k] === next[k]));
    onVariantImage?.(match?.imageUrl ?? null);
  }

  const available = selected?.available ?? 0;
  const soldOut = available <= 0;

  function submit() {
    if (!selected || soldOut) return;
    startTransition(async () => {
      const result = await addToCart({ variantId: selected.id, quantity });
      setFeedback({ ok: result.ok, message: result.message ?? '' });
      if (result.ok) router.refresh();
    });
  }

  if (!selected && variants.length === 0) {
    return <p className="text-sm text-ink-3">This product is not currently for sale.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-3xl text-ink">
          {formatINR(selected?.price ?? 0)}
        </span>
        {selected?.compareAtPrice != null && selected.compareAtPrice > selected.price && (
          <>
            <span className="text-lg text-ink-3 line-through">
              {formatINR(selected.compareAtPrice)}
            </span>
            <span className="bg-clay-2 px-2 py-0.5 text-xs font-medium text-clay">
              Save {Math.round((1 - selected.price / selected.compareAtPrice) * 100)}%
            </span>
          </>
        )}
      </div>

      {optionKeys.map((key) => (
        <fieldset key={key}>
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
            {optionLabels[key] ?? key.replace(/_/g, ' ')}
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {valuesFor(key).map((value) => {
              const combinable = isCombinable(key, value);
              const active = selection[key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => choose(key, value)}
                  disabled={!combinable}
                  aria-pressed={active}
                  className={`border px-3.5 py-2 text-sm transition-colors ${
                    active
                      ? 'border-leaf bg-leaf text-white'
                      : combinable
                        ? 'border-line bg-white text-ink-2 hover:border-leaf hover:text-leaf'
                        : 'cursor-not-allowed border-line bg-bone-2 text-ink-3 line-through opacity-60'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-4 text-sm">
        <span className="text-ink-3">
          SKU <span className="font-medium text-ink-2">{selected?.sku ?? '—'}</span>
        </span>
        {soldOut ? (
          <span className="font-medium text-clay">Sold out</span>
        ) : available <= 3 ? (
          <span className="font-medium text-sun">Only {available} left</span>
        ) : (
          <span className="font-medium text-leaf">In stock</span>
        )}
      </div>

      {!soldOut && (
        <div className="flex items-center gap-3">
          <label htmlFor="qty" className="text-sm text-ink-3">
            Quantity
          </label>
          <div className="flex items-center border border-line bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-ink-2 hover:bg-bone-2 disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              id="qty"
              type="number"
              min={1}
              max={available}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.min(available, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-14 border-x border-line py-2 text-center text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(available, q + 1))}
              className="px-3 py-2 text-ink-2 hover:bg-bone-2 disabled:opacity-40"
              disabled={quantity >= available}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={soldOut || pending || !selected}
        className="w-full bg-leaf px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-leaf-2 disabled:cursor-not-allowed disabled:bg-ink-3"
      >
        {soldOut ? 'Sold out' : pending ? 'Adding…' : 'Add to cart'}
      </button>

      {feedback && (
        <p
          role="status"
          className={`text-sm ${feedback.ok ? 'text-leaf' : 'text-clay'}`}
        >
          {feedback.message}{' '}
          {feedback.ok && (
            <a href="/cart" className="font-medium underline">
              View cart
            </a>
          )}
        </p>
      )}
    </div>
  );
}
