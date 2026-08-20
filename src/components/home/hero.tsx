import Link from 'next/link';
import type { ProductCard } from '@/lib/catalog';
import { ArrowRight, ChevronRight, PottedPlant, Sprout, Star } from '../icons';
import { LeafDecor } from './leaf-decor';

/**
 * Hero: a claim on the left, and a three-card collage on the right whose
 * images come from whatever the shop is actually featuring.
 */
export function Hero({
  feature,
  seedCard,
  cactusCard,
}: {
  feature: ProductCard | null;
  seedCard: ProductCard | null;
  cactusCard: ProductCard | null;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-bone">
      <LeafDecor className="-left-10 top-0 h-[320px] w-[280px]" opacity={0.22} />
      <LeafDecor className="-right-16 bottom-0 h-[340px] w-[300px]" flip opacity={0.18} />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:py-20 xl:px-10">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-ink-3">
            Desert Roses <span className="text-leaf">•</span> Caudex{' '}
            <span className="text-leaf">•</span> Rare Cacti
          </p>

          <h1 className="mt-5 font-display text-[42px] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[54px] lg:text-[58px]">
            Seed that germinates.
            <br />
            Plants with a base
            <br />
            worth growing.
          </h1>

          <div className="mt-7 h-px w-16 bg-line-2" />

          <p className="mt-6 max-w-[46ch] text-[15px] leading-[1.75] text-ink-2">
            We raise adenium, euphorbia and astrophytum from seed and sell what we would keep.
            Every listing carries the germination data and care notes we use ourselves — because
            a plant you can grow is worth more than one you can only buy.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/seeds"
              className="inline-flex items-center gap-2 rounded-lg bg-leaf px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-leaf-2"
            >
              <Sprout size={18} />
              Shop Seeds
            </Link>
            <Link
              href="/plants"
              className="inline-flex items-center gap-2 rounded-lg border border-ink/25 bg-white px-7 py-3.5 text-[15px] font-medium text-ink transition-colors hover:border-leaf hover:text-leaf"
            >
              <PottedPlant size={18} />
              Shop Plants
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.05fr_1fr]">
          {/* Feature card */}
          <Link
            href={feature ? `/product/${feature.slug}` : '/plants'}
            className="group relative overflow-hidden rounded-2xl bg-sage"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={feature?.image ?? '/img/ph/hero-feature.svg'}
              alt={feature?.imageAlt ?? ''}
              className="h-full min-h-[340px] w-full object-contain p-6 pb-24 transition-transform duration-700 group-hover:scale-[1.03] sm:min-h-[440px]"
            />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-leaf px-3.5 py-1.5 text-[12px] font-medium text-white">
              <Star size={13} filled={false} />
              Best Seller
            </span>

            <span className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white/95 p-3 backdrop-blur">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-3 text-leaf">
                <Sprout size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-ink">High Germination Rate</span>
                <span className="block text-[13px] text-leaf">Tested &amp; trusted seeds</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-ink-3" />
            </span>
          </Link>

          <div className="grid gap-4">
            <PromoCard
              href="/seeds/adenium-seeds"
              title="Adenium Seeds"
              body="Handpicked. High germination."
              image="/Images/Seeds.png"
              tone="bg-sage"
            />
            <PromoCard
              href="/plants/cacti"
              title="Rare Cacti"
              body={'Unique shapes.\nExceptional collection.'}
              image={bareArt(cactusCard?.image, 'promo-cacti')}
              tone="bg-blush"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Placeholder art renders a background of its own; drop it on tinted cards. */
function bareArt(url: string | undefined, fallback: string): string {
  const src = url ?? `/img/ph/${fallback}.svg`;
  return src.startsWith('/img/ph/') ? `${src}?bare=1` : src;
}

function PromoCard({
  href,
  title,
  body,
  image,
  tone,
}: {
  href: string;
  title: string;
  body: string;
  image: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[180px] items-center overflow-hidden rounded-2xl ${tone} p-6 sm:min-h-[212px]`}
    >
      <div className="relative z-10 max-w-[56%]">
        <h2 className="font-display text-[24px] leading-tight text-ink">{title}</h2>
        <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-2">
          {body}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/25 bg-white/70 px-4 py-2 text-[13px] font-medium text-ink transition-colors group-hover:border-leaf group-hover:text-leaf">
          Explore
          <ArrowRight size={15} />
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute -right-2 top-1/2 h-[88%] w-[46%] -translate-y-1/2 object-contain transition-transform duration-500 group-hover:scale-105"
      />
    </Link>
  );
}
