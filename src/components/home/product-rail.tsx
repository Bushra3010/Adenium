'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCard } from '@/lib/catalog';
import { ProductCardItem } from '../product-card';
import { ArrowLeft, ArrowRight } from '../icons';

/**
 * Horizontal product rail. Uses native scroll-snap rather than a carousel
 * library, so it stays keyboard- and touch-native, and the dots reflect the
 * real scroll position instead of a separate index.
 */
export function ProductRail({
  title,
  href,
  linkLabel = 'All products',
  products,
  wishlisted,
  signedIn,
}: {
  title: string;
  href: string;
  linkLabel?: string;
  products: ProductCard[];
  wishlisted: string[];
  signedIn: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(total);
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    const el = railRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const scrollTo = (index: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  const saved = new Set(wishlisted);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-12 xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[34px] leading-tight text-ink">{title}</h2>
          <div className="mt-3 h-px w-14 bg-line-2" />
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-leaf hover:underline"
        >
          {linkLabel}
          <ArrowRight size={15} />
        </Link>
      </div>

      <div
        ref={railRef}
        onScroll={measure}
        className="rail mt-8 grid auto-cols-[85%] grid-flow-col gap-5 overflow-x-auto pb-2 sm:auto-cols-[46%] lg:auto-cols-[31%] xl:auto-cols-[23.5%]"
      >
        {products.map((product) => (
          <ProductCardItem
            key={product.id}
            product={product}
            wishlisted={saved.has(product.id)}
            signedIn={signedIn}
          />
        ))}
      </div>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => scrollTo(Math.max(0, page - 1))}
            disabled={page === 0}
            aria-label="Previous products"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-leaf hover:text-leaf disabled:opacity-35"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to products ${i + 1} of ${pages}`}
                aria-current={i === page}
                className={`h-2 rounded-full transition-all ${
                  i === page ? 'w-6 bg-leaf' : 'w-2 bg-line-2 hover:bg-ink-3'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollTo(Math.min(pages - 1, page + 1))}
            disabled={page >= pages - 1}
            aria-label="Next products"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-leaf hover:text-leaf disabled:opacity-35"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </section>
  );
}
