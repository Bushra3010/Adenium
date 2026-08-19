import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { statusBadge } from '@/lib/order-status';

export const dynamic = 'force-dynamic';

export default async function AccountOverviewPage() {
  const user = await requireUser();

  const [recentOrders, orderCount, addressCount, wishlistCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { items: { take: 3 } },
    }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
  ]);

  const stats = [
    { label: 'Orders placed', value: orderCount, href: '/account/orders' },
    { label: 'Saved addresses', value: addressCount, href: '/account/addresses' },
    { label: 'Wishlist items', value: wishlistCount, href: '/account/wishlist' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-line bg-white p-5 transition-colors hover:border-leaf"
          >
            <p className="font-display text-3xl tabular-nums text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-ink-3">{s.label}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Recent orders</h2>
          {orderCount > 0 && (
            <Link href="/account/orders" className="text-sm font-medium text-leaf hover:underline">
              View all →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="mt-4 border border-line bg-white p-8 text-center">
            <p className="text-ink-3">No orders yet.</p>
            <Link
              href="/seeds"
              className="mt-4 inline-block bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentOrders.map((order) => {
              const badge = statusBadge(order.status);
              return (
                <li key={order.id} className="border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="font-medium text-ink hover:text-leaf"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-3">
                        {order.createdAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}{' '}
                        · {order.items.length} item{order.items.length === 1 ? '' : 's'}
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
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
