import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { statusBadge } from '@/lib/order-status';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your orders', robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Your orders</h2>

      {orders.length === 0 ? (
        <div className="mt-6 border border-line bg-white p-10 text-center">
          <p className="text-ink-3">You have not placed an order yet.</p>
          <Link
            href="/seeds"
            className="mt-4 inline-block bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
          >
            Browse seeds
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const badge = statusBadge(order.status);
            return (
              <li key={order.id} className="border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="font-medium text-ink hover:text-leaf"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-3">
                      Placed{' '}
                      {order.createdAt.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="font-medium tabular-nums text-ink">
                      {formatINR(order.grandTotal)}
                    </span>
                  </div>
                </div>

                <ul className="divide-y divide-line">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl ?? '/img/ph/default.svg'}
                        alt=""
                        className="h-12 w-12 border border-line object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="text-sm text-ink hover:text-leaf"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-ink-3">
                          {item.variantLabel} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm tabular-nums text-ink-2">
                        {formatINR(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
                  {order.awbNumber ? (
                    <p className="text-sm text-ink-3">
                      {order.courierName} · AWB{' '}
                      <span className="font-medium text-ink-2">{order.awbNumber}</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-sm font-medium text-leaf hover:underline"
                  >
                    Order detail →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
