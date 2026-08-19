import Link from 'next/link';
import type { ProductCard } from '@/lib/catalog';
import { ProductCardItem } from './product-card';

export function ProductGrid({
  items,
  wishlisted,
  signedIn,
}: {
  items: ProductCard[];
  wishlisted: Set<string>;
  signedIn: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <ProductCardItem
          key={p.id}
          product={p}
          wishlisted={wishlisted.has(p.id)}
          signedIn={signedIn}
        />
      ))}
    </div>
  );
}

/** SRCH-06 — a zero-result page that offers a way forward. */
export function EmptyResults({
  query,
  suggestions,
}: {
  query?: string;
  suggestions: { name: string; slug: string; parentSlug: string }[];
}) {
  return (
    <div className="border border-line bg-white p-10 text-center">
      <h2 className="font-display text-2xl text-ink">
        {query ? `Nothing matched “${query}”` : 'Nothing matches those filters'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-3">
        Try a broader search, or clear a filter or two. Botanical names work as well as
        common ones — try &ldquo;adenium&rdquo;, &ldquo;euphorbia&rdquo; or
        &ldquo;astrophytum&rdquo;.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <Link
            key={s.slug}
            href={`/${s.parentSlug}/${s.slug}`}
            className="border border-line px-3 py-1.5 text-sm text-ink-2 hover:border-leaf hover:text-leaf"
          >
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;
  const window = 2;
  const numbers: (number | '…')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= window) numbers.push(i);
    else if (numbers[numbers.length - 1] !== '…') numbers.push('…');
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={makeHref(page - 1)}
          className="border border-line px-3 py-2 text-sm text-ink-2 hover:border-leaf hover:text-leaf"
        >
          Previous
        </Link>
      )}
      {numbers.map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-ink-3">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={makeHref(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`min-w-10 border px-3 py-2 text-center text-sm ${
              n === page
                ? 'border-leaf bg-leaf text-white'
                : 'border-line text-ink-2 hover:border-leaf hover:text-leaf'
            }`}
          >
            {n}
          </Link>
        ),
      )}
      {page < pages && (
        <Link
          href={makeHref(page + 1)}
          className="border border-line px-3 py-2 text-sm text-ink-2 hover:border-leaf hover:text-leaf"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
