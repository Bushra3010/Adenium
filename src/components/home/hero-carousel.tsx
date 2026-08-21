'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCard } from '@/lib/catalog';
import { ArrowRight, Star } from '../icons';

type Slide = {
  eyebrow?: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  secondary?: { href: string; label: string };
  image: string | null;
  imageAlt: string;
  tone: string;
  badge?: string;
};

/**
 * The phone hero. Native scroll-snap rather than a carousel library, so it
 * stays swipeable and keyboard-reachable, with dots reflecting real position.
 */
export function HeroCarousel({
  feature,
  cactusCard,
}: {
  feature: ProductCard | null;
  cactusCard: ProductCard | null;
}) {
  const slides: Slide[] = [
    {
      eyebrow: 'Desert Roses • Caudex • Rare Cacti',
      title: 'Seed that germinates. Plants with a base worth growing.',
      body: 'Handpicked seeds with a high germination rate, and care you can trust.',
      href: '/seeds',
      cta: 'Shop Seeds',
      secondary: { href: '/plants', label: 'Shop Plants' },
      image: feature?.image ?? null,
      imageAlt: feature?.imageAlt ?? '',
      tone: 'bg-sage/70',
      badge: 'Best Seller',
    },
    {
      title: 'Adenium Seeds',
      body: 'Handpicked lots with published germination rates.',
      href: '/seeds/adenium-seeds',
      cta: 'Explore',
      image: '/Images/Seeds.png',
      imageAlt: '',
      tone: 'bg-sage/70',
    },
    {
      title: 'Rare Cacti',
      body: 'Unique shapes from an exceptional collection.',
      href: '/plants/cacti',
      cta: 'Explore',
      image: cactusCard?.image ?? null,
      imageAlt: '',
      tone: 'bg-blush',
    },
  ];

  const railRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el || el.clientWidth === 0) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="py-4">
      <div ref={railRef} onScroll={measure} className="rail flex overflow-x-auto">
        {slides.map((slide) => (
          <div key={slide.title} className="w-full shrink-0 px-4">
            <div className={`relative min-h-[300px] overflow-hidden rounded-2xl ${slide.tone} p-5`}>
              {slide.badge && (
                <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 text-[11.5px] font-medium text-white">
                  <Star size={12} filled={false} />
                  {slide.badge}
                </span>
              )}

              <div className="relative z-10 max-w-[56%]">
                {slide.eyebrow && (
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3">
                    {slide.eyebrow}
                  </p>
                )}
                <h1 className="mt-2.5 font-display text-[25px] leading-[1.14] tracking-[-0.01em] text-ink">
                  {slide.title}
                </h1>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-2">{slide.body}</p>
              </div>

              {slide.image && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="pointer-events-none absolute right-0 top-[14%] h-[58%] w-[44%] object-contain"
                />
              )}

              <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-leaf px-4 py-2.5 text-[13px] font-medium text-white"
                >
                  {slide.cta}
                  {!slide.secondary && <ArrowRight size={14} />}
                </Link>
                {slide.secondary && (
                  <Link
                    href={slide.secondary.href}
                    className="rounded-lg border border-ink/25 bg-white px-4 py-2.5 text-[13px] font-medium text-ink"
                  >
                    {slide.secondary.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => {
              const el = railRef.current;
              if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
            }}
            aria-label={`Show slide ${i + 1} of ${slides.length}`}
            aria-current={i === page}
            className={`h-2 rounded-full transition-all ${
              i === page ? 'w-5 bg-leaf' : 'w-2 bg-line-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
