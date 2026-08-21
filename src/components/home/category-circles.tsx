import Link from 'next/link';
import { Book, Cactus, Flower, PottedPlant, Seeds } from '../icons';
import { LeafDecor } from './leaf-decor';

export type CircleItem = {
  href: string;
  label: string;
  sub: string;
  icon: 'seeds' | 'plant' | 'cactus' | 'flower' | 'book';
};

const ICONS = {
  seeds: Seeds,
  plant: PottedPlant,
  cactus: Cactus,
  flower: Flower,
  book: Book,
};

export function CategoryCircles({ items }: { items: CircleItem[] }) {
  return (
    <section className="relative overflow-hidden bg-bone lg:bg-bone-2">
      <LeafDecor className="-left-14 top-4 hidden h-[240px] w-[210px] lg:block" opacity={0.15} />
      <LeafDecor className="-right-14 bottom-0 hidden h-[260px] w-[230px] lg:block" flip opacity={0.15} />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-6 px-4 py-6 sm:px-5 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:gap-10 lg:py-14 xl:px-10">
        <div className="hidden lg:block">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.18em] text-ink-3">
            Shop by category
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-[1.15] text-ink">
            Find what you&rsquo;re
            <br />
            growing today
          </h2>
          <div className="mt-5 h-px w-14 bg-line-2" />
        </div>

        <ul className="scroll-fade rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.href} className="w-[74px] shrink-0 text-center lg:w-auto">
                <Link href={item.href} className="group block">
                  <span className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-leaf-3/60 text-leaf transition-all duration-300 group-hover:-translate-y-1 lg:h-[104px] lg:w-[104px] lg:border lg:border-line lg:bg-white lg:shadow-sm lg:group-hover:border-leaf lg:group-hover:shadow-lg">
                    <Icon size={28} strokeWidth={1.3} className="lg:hidden" />
                    <Icon size={38} strokeWidth={1.3} className="hidden lg:block" />
                  </span>
                  <span className="mt-2 block text-[11.5px] font-medium leading-tight text-ink transition-colors group-hover:text-leaf lg:mt-3.5 lg:text-[13.5px]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 hidden text-[12px] text-ink-3 lg:block">{item.sub}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
