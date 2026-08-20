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
    <section className="relative overflow-hidden bg-bone-2">
      <LeafDecor className="-left-14 top-4 h-[240px] w-[210px]" opacity={0.15} />
      <LeafDecor className="-right-14 bottom-0 h-[260px] w-[230px]" flip opacity={0.15} />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] xl:px-10">
        <div>
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

        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.href} className="text-center">
                <Link href={item.href} className="group block">
                  <span className="mx-auto flex h-[104px] w-[104px] items-center justify-center rounded-full border border-line bg-white text-leaf shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-leaf group-hover:shadow-lg">
                    <Icon size={38} strokeWidth={1.3} />
                  </span>
                  <span className="mt-3.5 block text-[13.5px] font-medium text-ink transition-colors group-hover:text-leaf">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-3">{item.sub}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
