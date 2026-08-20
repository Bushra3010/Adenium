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
    <section className="relative overflow-hidden bg-bone lg:border-b lg:border-line lg:bg-bone-2">
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

      {/* Phone: one scrollable card */}
      <div className="px-4 py-4 lg:hidden">
        <ul className="rail flex gap-3 overflow-x-auto rounded-2xl bg-bone-2 p-4">
          {ITEMS.map(({ Icon, title, body }) => (
            <li key={title} className="flex w-[210px] shrink-0 items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-3 text-leaf">
                <Icon size={17} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[12.5px] font-semibold leading-snug text-ink">{title}</h2>
                <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto hidden max-w-[1200px] gap-x-8 gap-y-7 px-5 py-9 lg:grid lg:grid-cols-4">
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
