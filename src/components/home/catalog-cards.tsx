import Link from 'next/link';
import { ArrowRight, Cactus, Flower, PottedPlant, Seeds, Sprout } from '../icons';

export type CatalogCard = {
  slug: string;
  name: string;
  description: string | null;
  image: string;
  tone: 'sage' | 'sand';
  children: { id: string; name: string; slug: string }[];
};

const CHILD_ICONS = [Sprout, Cactus, Flower, PottedPlant];

/** The two ways into the catalog: seed you grow, or a plant with a head start. */
export function CatalogCards({ cards }: { cards: CatalogCard[] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 xl:px-10">
      <h2 className="font-display text-[34px] leading-tight text-ink">Browse the catalog</h2>
      <div className="mt-3 h-px w-14 bg-line-2" />
      <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">
        Two ways in — start from seed and grow it yourself, or take on a plant that already has a
        few seasons behind it.
      </p>

      <div className="mt-9 grid gap-6 lg:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.slug === 'seeds' ? Seeds : PottedPlant;
          return (
            <div
              key={card.slug}
              className={`relative overflow-hidden rounded-2xl border border-line p-7 ${
                card.tone === 'sage' ? 'bg-sage/60' : 'bg-bone-2'
              }`}
            >
              <div className="relative z-10 max-w-[64%] sm:max-w-[62%]">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-leaf shadow-sm">
                    <Icon size={24} />
                  </span>
                  <h3 className="font-display text-[27px] leading-none text-ink">{card.name}</h3>
                </div>

                <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{card.description}</p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {card.children.map((child, i) => {
                    const ChildIcon = CHILD_ICONS[i % CHILD_ICONS.length];
                    return (
                      <li key={child.id}>
                        <Link
                          href={`/${card.slug}/${child.slug}`}
                          className="flex items-center gap-2.5 rounded-xl border border-line bg-white/85 px-3.5 py-3 text-[13.5px] text-ink-2 transition-colors hover:border-leaf hover:text-leaf"
                        >
                          <ChildIcon size={17} className="shrink-0 text-leaf" />
                          <span className="truncate">{child.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Link
                href={`/${card.slug}`}
                className="absolute right-7 top-7 z-10 inline-flex items-center gap-1.5 text-[14px] font-medium text-leaf hover:underline"
              >
                View all
                <ArrowRight size={15} />
              </Link>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image.startsWith('/img/ph/') ? `${card.image}?bare=1` : card.image}
                alt=""
                className={`pointer-events-none absolute right-1 ${
                  card.slug === 'seeds'
                    ? 'top-1/2 h-[72%] -translate-y-1/2'
                    : 'bottom-3 h-[70%] object-bottom'
                } max-w-[40%] object-contain`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
