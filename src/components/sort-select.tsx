'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest first' },
  { value: 'rating', label: 'Best rated' },
];

/** CAT-04. */
export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-ink-3">
        Sort
      </label>
      <select
        id="sort"
        value={params.get('sort') ?? 'relevance'}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set('sort', e.target.value);
          next.delete('page');
          router.push(`${pathname}?${next.toString()}`, { scroll: false });
        }}
        className="border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-leaf focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
