'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export type Facet = { key: string; label: string; values: { value: string; count: number }[] };

/**
 * Category and search filters (SRCH-03/04/05). Every choice is written to the
 * URL, so filtered views are shareable and survive back/refresh.
 */
export function FilterRail({
  facets,
  priceBounds,
}: {
  facets: Facet[];
  priceBounds: { min: number; max: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const [minPrice, setMinPrice] = useState(params.get('min') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('max') ?? '');

  const push = useCallback(
    (next: URLSearchParams) => {
      next.delete('page');
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const toggleValue = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = next.getAll(key);
      next.delete(key);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of updated) next.append(key, v);
      push(next);
    },
    [params, push],
  );

  const setFlag = useCallback(
    (key: string, on: boolean) => {
      const next = new URLSearchParams(params.toString());
      if (on) next.set(key, '1');
      else next.delete(key);
      push(next);
    },
    [params, push],
  );

  function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (minPrice) next.set('min', minPrice);
    else next.delete('min');
    if (maxPrice) next.set('max', maxPrice);
    else next.delete('max');
    push(next);
  }

  const activeCount =
    [...params.entries()].filter(([k]) => !['sort', 'page', 'q'].includes(k)).length;

  function clearAll() {
    const next = new URLSearchParams();
    const q = params.get('q');
    const sort = params.get('sort');
    if (q) next.set('q', q);
    if (sort) next.set('sort', sort);
    setMinPrice('');
    setMaxPrice('');
    push(next);
  }

  const body = (
    <div className="space-y-7">
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-medium text-clay hover:underline"
        >
          Clear all filters ({activeCount})
        </button>
      )}

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Availability
        </legend>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={params.get('instock') === '1'}
            onChange={(e) => setFlag('instock', e.target.checked)}
            className="h-4 w-4 accent-[#1f5c40]"
          />
          In stock only
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Price
        </legend>
        <form onSubmit={applyPrice} className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="min-price">Minimum price</label>
          <input
            id="min-price"
            type="number"
            inputMode="numeric"
            min={priceBounds.min}
            max={priceBounds.max}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder={`₹${priceBounds.min}`}
            className="w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-leaf focus:outline-none"
          />
          <span className="text-ink-3">–</span>
          <label className="sr-only" htmlFor="max-price">Maximum price</label>
          <input
            id="max-price"
            type="number"
            inputMode="numeric"
            min={priceBounds.min}
            max={priceBounds.max}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={`₹${priceBounds.max}`}
            className="w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-leaf focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 border border-ink px-3 py-1.5 text-sm text-ink hover:bg-ink hover:text-white"
          >
            Go
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Rating
        </legend>
        <div className="mt-3 space-y-1.5">
          {[4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
              <input
                type="radio"
                name="rating"
                checked={params.get('rating') === String(r)}
                onChange={() => {
                  const next = new URLSearchParams(params.toString());
                  next.set('rating', String(r));
                  push(next);
                }}
                className="h-4 w-4 accent-[#1f5c40]"
              />
              {r} stars &amp; up
            </label>
          ))}
        </div>
      </fieldset>

      {facets.map((facet) => (
        <fieldset key={facet.key}>
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
            {facet.label}
          </legend>
          <div className="mt-3 space-y-1.5">
            {facet.values.map((v) => (
              <label
                key={v.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink-2"
              >
                <input
                  type="checkbox"
                  checked={params.getAll(facet.key).includes(v.value)}
                  onChange={() => toggleValue(facet.key, v.value)}
                  className="h-4 w-4 accent-[#1f5c40]"
                />
                <span className="flex-1">{v.value}</span>
                <span className="text-xs text-ink-3">{v.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenOnMobile((v) => !v)}
        className="mb-4 w-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink lg:hidden"
        aria-expanded={openOnMobile}
      >
        {openOnMobile ? 'Hide filters' : `Filters${activeCount ? ` (${activeCount})` : ''}`}
      </button>

      <div className={`${openOnMobile ? 'block' : 'hidden'} lg:block`}>{body}</div>
    </>
  );
}
