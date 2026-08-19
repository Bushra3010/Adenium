import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { statusBadge } from '@/lib/order-status';
import { OrderTimeline } from '@/components/order-timeline';
import { CancelOrderButton } from '@/components/cancel-order-button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Order detail', robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params }: PageProps<'/account/orders/[id]'>) {
  const { id } = await params;
  const user = await requireUser();

  // Scoped by userId — one customer cannot read another's order.
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, events: { orderBy: { createdAt: 'asc' } } },
  });
  if (!order) notFound();

  const badge = statusBadge(order.status);
  const canCancel = order.status === 'CONFIRMED';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-leaf hover:underline">
            ← All orders
          </Link>
          <h2 className="mt-2 font-display text-2xl text-ink">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-ink-3">
            Placed{' '}
            {order.createdAt.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <span className={`px-3 py-1.5 text-sm font-medium ${badge.className}`}>{badge.label}</span>
      </div>

      {order.awbNumber && (
        <div className="border-l-2 border-leaf bg-leaf-3 px-4 py-3">
          <p className="text-sm text-leaf">
            Shipped with <span className="font-medium">{order.courierName}</span> · AWB{' '}
            <span className="font-medium">{order.awbNumber}</span>
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section>
            <h3 className="font-display text-lg text-ink">Items</h3>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl ?? '/img/ph/default.svg'}
                    alt=""
                    className="h-16 w-16 border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="text-ink hover:text-leaf"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-ink-3">{item.variantLabel}</p>
                    <p className="text-xs text-ink-3">
                      SKU {item.sku} · {formatINR(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="tabular-nums text-ink">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-display text-lg text-ink">Progress</h3>
            <div className="mt-4">
              <OrderTimeline status={order.status} events={order.events} />
            </div>
          </section>

          {canCancel && (
            <section className="border border-line bg-white p-5">
              <h3 className="font-display text-lg text-ink">Need to cancel?</h3>
              <p className="mt-1 text-sm text-ink-3">
                You can cancel while the order is still being prepared. Once it is packed we
                can no longer stop it.
              </p>
              <div className="mt-4">
                <CancelOrderButton orderId={order.id} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border border-line bg-white p-5">
            <h3 className="font-display text-lg text-ink">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-3">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-leaf">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                  <dd className="tabular-nums">−{formatINR(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-3">Shipping</dt>
                <dd className="tabular-nums">
                  {Number(order.shippingTotal) === 0 ? 'Free' : formatINR(order.shippingTotal)}
                </dd>
              </div>
              {Number(order.taxTotal) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-3">Tax</dt>
                  <dd className="tabular-nums">{formatINR(order.taxTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(order.grandTotal)}</dd>
              </div>
            </dl>
            {order.gatewayPaymentId && (
              <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">
                Payment reference
                <br />
                <span className="text-ink-2">{order.gatewayPaymentId}</span>
              </p>
            )}
          </div>

          <div className="border border-line bg-white p-5">
            <h3 className="font-display text-lg text-ink">Delivery address</h3>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-2">
              {order.shipFullName}
              <br />
              {order.shipLine1}
              {order.shipLine2 && (
                <>
                  <br />
                  {order.shipLine2}
                </>
              )}
              {order.shipLandmark && (
                <>
                  <br />
                  {order.shipLandmark}
                </>
              )}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPincode}
              <br />
              {order.shipPhone}
            </address>
          </div>
        </aside>
      </div>
    </div>
  );
}
