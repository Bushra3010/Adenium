import { Box, Headset, Shield, Sprout } from '../icons';

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
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src="/Images/background image left.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 top-1/2 hidden h-[165%] -translate-y-1/2 select-none object-contain opacity-90 lg:block"
      />
      <img
        src="/Images/background image right.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/2 hidden h-[165%] -translate-y-1/2 select-none object-contain opacity-90 lg:block"
      />
      {/* eslint-enable @next/next/no-img-element */}

      <div className="relative mx-auto grid max-w-[1200px] gap-x-8 gap-y-7 px-5 py-9 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ Icon, title, body }, i) => (
          <div
            key={title}
            className={`flex items-start gap-3.5 ${
              i > 0 ? 'lg:border-l lg:border-line-2/70 lg:pl-8' : ''
            }`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-3 text-leaf">
              <Icon size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
