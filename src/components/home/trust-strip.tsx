import { Headset, Shield, Sprout, Truck } from '../icons';

const ITEMS = [
  {
    Icon: Sprout,
    title: 'High Germination Rate',
    body: 'Every lot is trialled before listing, and the rate is published.',
  },
  {
    Icon: Shield,
    title: 'Quality Assured',
    body: 'Raised here from seed, not imported and resold.',
  },
  {
    Icon: Truck,
    title: 'Fast & Safe Delivery',
    body: 'Plants dispatched Mon–Wed so nothing waits in a hub.',
  },
  {
    Icon: Headset,
    title: 'Plant Care Support',
    body: 'Care notes on every product, and a reply within a working day.',
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
        className="pointer-events-none absolute -left-8 top-0 h-[78%] max-w-[30%] select-none object-contain object-left-top opacity-70 lg:top-1/2 lg:h-[165%] lg:max-w-none lg:-translate-y-1/2 lg:object-contain lg:opacity-90"
      />
      <img
        src="/Images/background image right.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 bottom-0 h-[80%] max-w-[32%] select-none object-contain object-right-bottom opacity-70 lg:bottom-auto lg:top-1/2 lg:-right-10 lg:h-[165%] lg:max-w-none lg:-translate-y-1/2 lg:opacity-90"
      />
      {/* eslint-enable @next/next/no-img-element */}

      {/* Phone: a scrolling row framed by the foliage, inset so the first and
          last item clear the leaves. */}
      <div className="relative py-5 lg:hidden">
        <ul className="rail relative flex gap-4 overflow-x-auto px-[56px]">
          {ITEMS.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="flex w-[196px] shrink-0 items-start gap-2.5"
            >
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
