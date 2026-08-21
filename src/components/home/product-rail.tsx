'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCard } from '@/lib/catalog';
import { ProductCardItem } from '../product-card';
import { ArrowLeft, ArrowRight, ChevronRight } from '../icons';

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
    <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-5 lg:py-12 xl:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[26px] leading-tight text-ink lg:text-[34px]">{title}</h2>
          <div className="mt-3 h-px w-14 bg-line-2" />
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[14px] font-medium text-leaf hover:underline"
        >
          {linkLabel}
          <ChevronRight size={16} className="lg:hidden" />
          <ArrowRight size={15} className="hidden lg:block" />
        </Link>
      </div>

      <div className="relative mt-8">
        <div
          ref={railRef}
          onScroll={measure}
          className="scroll-fade rail -mx-4 grid auto-cols-[62%] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:auto-cols-[46%] sm:gap-5 sm:px-0 lg:auto-cols-[31%] xl:auto-cols-[23.5%]"
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
          <>
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, page - 1))}
              disabled={page === 0}
              aria-label="Previous products"
              className="absolute -left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-2 bg-white text-ink-2 shadow-md transition-colors hover:border-leaf hover:text-leaf disabled:opacity-0 lg:flex xl:-left-5"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(pages - 1, page + 1))}
              disabled={page >= pages - 1}
              aria-label="Next products"
              className="absolute -right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-2 bg-white text-ink-2 shadow-md transition-colors hover:border-leaf hover:text-leaf disabled:opacity-0 lg:flex xl:-right-5"
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to products ${i + 1} of ${pages}`}
              aria-current={i === page}
              className={`h-2.5 rounded-full transition-all ${
                i === page ? 'w-2.5 bg-leaf' : 'w-2.5 bg-line-2 hover:bg-ink-3'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
