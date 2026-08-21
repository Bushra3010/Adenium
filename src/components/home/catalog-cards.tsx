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
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-5 lg:py-16 xl:px-10">
      <h2 className="font-display text-[26px] leading-tight text-ink lg:text-[34px]">Browse the catalog</h2>
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
              className={`relative overflow-hidden rounded-2xl border border-line p-5 sm:p-7 ${
                card.tone === 'sage' ? 'bg-sage/60' : 'bg-bone-2'
              }`}
            >
              {/* Heading row spans the card so "View all" never sits under the
                  photograph; only the copy is inset to clear it. */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-leaf shadow-sm sm:h-12 sm:w-12">
                    <Icon size={22} className="sm:hidden" />
                    <Icon size={24} className="hidden sm:block" />
                  </span>
                  <h3 className="font-display text-[23px] leading-none text-ink sm:text-[27px]">
                    {card.name}
                  </h3>
                </div>

                <Link
                  href={`/${card.slug}`}
                  className="inline-flex shrink-0 items-center gap-1.5 pt-1 text-[13.5px] font-medium text-leaf hover:underline sm:text-[14px]"
                >
                  View all
                  <ArrowRight size={15} />
                </Link>
              </div>

              <p className="relative z-10 mt-4 max-w-[62%] text-[13.5px] leading-relaxed text-ink-2 sm:text-[14px]">
                {card.description}
              </p>

              <ul className="relative z-10 mt-6 grid grid-cols-2 gap-2.5 sm:max-w-[64%]">
                {card.children.map((child, i) => {
                  const ChildIcon = CHILD_ICONS[i % CHILD_ICONS.length];
                  return (
                    <li key={child.id}>
                      <Link
                        href={`/${card.slug}/${child.slug}`}
                        className="flex items-center gap-1.5 rounded-xl border border-line bg-white/85 px-2.5 py-2.5 text-[11.5px] text-ink-2 transition-colors hover:border-leaf hover:text-leaf sm:gap-2.5 sm:px-3.5 sm:py-3 sm:text-[13.5px]"
                      >
                        <ChildIcon size={15} className="shrink-0 text-leaf" />
                        <span className="truncate">{child.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image.startsWith('/img/ph/') ? `${card.image}?bare=1` : card.image}
                alt=""
                className={`pointer-events-none absolute right-1 max-w-[34%] object-contain sm:right-2 sm:max-w-[30%] ${
                  card.slug === 'seeds'
                    ? 'top-[86px] h-[30%] sm:top-1/2 sm:h-[72%] sm:-translate-y-1/2'
                    : 'top-[86px] h-[32%] object-top sm:bottom-3 sm:top-auto sm:h-[70%] sm:object-bottom'
                }`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
