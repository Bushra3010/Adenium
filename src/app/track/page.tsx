import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/money';
import { statusBadge } from '@/lib/order-status';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { OrderTimeline } from '@/components/order-timeline';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Look up an order with its number and the email or phone used at checkout.',
  robots: { index: false, follow: true },
};

/** ORD-05 — guest tracking by order number plus a matching contact detail. */
export default async function TrackPage({ searchParams }: PageProps<'/track'>) {
  const sp = await searchParams;
  const orderNumber = typeof sp.order === 'string' ? sp.order.trim() : '';
  const contact = typeof sp.contact === 'string' ? sp.contact.trim() : '';
  const searched = Boolean(orderNumber && contact);

  const order = searched
    ? await prisma.order.findFirst({
        where: {
          orderNumber: { equals: orderNumber, mode: 'insensitive' },
          // The contact detail is the shared secret — without it, an order
          // number alone reveals nothing.
          OR: [{ email: { equals: contact, mode: 'insensitive' } }, { phone: contact }],
        },
        include: { items: true, events: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Track an order' }]} />

      <h1 className="mt-6 font-display text-4xl text-ink">Track your order</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
        Enter your order number along with the email address or phone number you used at
        checkout.
      </p>

      <form method="GET" action="/track" className="mt-8 space-y-4 border border-line bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-ink-2">
              Order number
            </label>
            <input
              id="order"
              name="order"
              required
              defaultValue={orderNumber}
              placeholder="ADN-100001"
              className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 font-mono text-sm focus:border-leaf focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-ink-2">
              Email or phone
            </label>
            <input
              id="contact"
              name="contact"
              required
              defaultValue={contact}
              className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-leaf px-6 py-3 text-sm font-medium text-white hover:bg-leaf-2"
        >
          Find my order
        </button>
      </form>

      {searched && !order && (
        <div className="mt-8 border-l-2 border-clay bg-clay-2 px-5 py-4">
          <p className="text-sm text-clay">
            No order matches those details. Check the order number and that the contact detail
            is the one used at checkout.
          </p>
        </div>
      )}

      {order && (
        <section className="mt-8 border border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="font-display text-2xl text-ink">{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-ink-3">
                Placed{' '}
                {order.createdAt.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <span className={`px-3 py-1.5 text-sm font-medium ${statusBadge(order.status).className}`}>
              {statusBadge(order.status).label}
            </span>
          </div>

          {order.awbNumber && (
            <p className="mt-4 border-l-2 border-leaf bg-leaf-3 px-4 py-3 text-sm text-leaf">
              Shipped with <span className="font-medium">{order.courierName}</span> · AWB{' '}
              <span className="font-medium">{order.awbNumber}</span>
            </p>
          )}

          <ul className="mt-6 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl ?? '/img/ph/default.svg'}
                  alt=""
                  className="h-12 w-12 border border-line object-cover"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <Link href={`/product/${item.productSlug}`} className="text-ink hover:text-leaf">
                    {item.productName}
                  </Link>
                  <p className="text-xs text-ink-3">
                    {item.variantLabel} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-ink-2">{formatINR(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between text-sm">
            <span className="text-ink-3">Order total</span>
            <span className="font-medium tabular-nums text-ink">{formatINR(order.grandTotal)}</span>
          </div>

          <div className="mt-8">
            <h3 className="font-display text-lg text-ink">Progress</h3>
            <div className="mt-4">
              <OrderTimeline status={order.status} events={order.events} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
