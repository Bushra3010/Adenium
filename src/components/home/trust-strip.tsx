import { Box, Headset, Shield, Sprout } from '../icons';
import { LeafDecor } from './leaf-decor';

const ITEMS = [
  {
    Icon: Sprout,
    title: 'Raised from seed',
    body: 'Most of what we sell is grown here, not imported and resold.',
  },
  {
    Icon: Shield,
    title: 'Germination tested',
    body: 'Every seed lot is trialled before it is listed. Rates are published.',
  },
  {
    Icon: Box,
    title: 'Packed for transit',
    body: 'Plants ship Monday to Wednesday so nothing waits in a hub.',
  },
  {
    Icon: Headset,
    title: 'Care support',
    body: 'Guides on every product page, and a reply within a working day.',
  },
];

export function TrustStrip() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-bone-2">
      <LeafDecor className="-left-12 -top-6 h-[200px] w-[180px]" opacity={0.16} />
      <LeafDecor className="-right-12 -bottom-8 h-[220px] w-[200px]" flip opacity={0.16} />

      <div className="relative mx-auto grid max-w-[1440px] gap-x-8 gap-y-7 px-5 py-9 sm:grid-cols-2 lg:grid-cols-4 xl:px-10">
        {ITEMS.map(({ Icon, title, body }, i) => (
          <div
            key={title}
            className={`flex items-start gap-3.5 ${
              i > 0 ? 'lg:border-l lg:border-line lg:pl-8' : ''
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf-3 text-leaf">
              <Icon size={21} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-semibold text-ink">{title}</h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
