import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { formatINR, toNumber } from '@/lib/money';
import { statusBadge } from '@/lib/order-status';
import { PageHeading, Panel, StatTile, Table, Badge } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/** ADM-01 — what an operator needs on opening the shop each morning. */
export default async function AdminOverviewPage() {
  await requireStaff();
  const settings = await getSettings();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const paid = { paymentStatus: 'PAID' as const };

  const [
    todayAgg,
    monthAgg,
    toShip,
    pendingReviews,
    lowStock,
    recentOrders,
    productCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { ...paid, paidAt: { gte: startOfToday } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { ...paid, paidAt: { gte: startOfMonth } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PACKED'] } } }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.variant.findMany({
      where: { isActive: true, stockQty: { lte: settings.lowStockThreshold } },
      orderBy: { stockQty: 'asc' },
      take: 8,
      include: { product: { select: { name: true, slug: true, id: true } } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, orderNumber: true, status: true, grandTotal: true,
        shipFullName: true, createdAt: true, shipCity: true,
      },
    }),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
  ]);

  return (
    <>
      <PageHeading
        title="Overview"
        description="Today at a glance, and anything waiting on you."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Revenue today"
          value={formatINR(toNumber(todayAgg._sum.grandTotal ?? 0))}
          sub={`${todayAgg._count} paid order${todayAgg._count === 1 ? '' : 's'}`}
        />
        <StatTile
          label="Revenue this month"
          value={formatINR(toNumber(monthAgg._sum.grandTotal ?? 0))}
          sub={`${monthAgg._count} paid order${monthAgg._count === 1 ? '' : 's'}`}
        />
        <StatTile
          label="Waiting to ship"
          value={toShip}
          sub="Confirmed or packed"
          href="/admin/orders?status=CONFIRMED"
          tone={toShip > 0 ? 'warn' : 'default'}
        />
        <StatTile
          label="Reviews to moderate"
          value={pendingReviews}
          href="/admin/reviews"
          tone={pendingReviews > 0 ? 'warn' : 'default'}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent orders"
          action={
            <Link href="/admin/orders" className="text-sm font-medium text-leaf hover:underline">
              All orders →
            </Link>
          }
        >
          <Table head={['Order', 'Customer', 'Status', 'Total']} empty="No orders yet.">
            {recentOrders.map((o) => {
              const badge = statusBadge(o.status);
              return (
                <tr key={o.id} className="hover:bg-bone-2">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:text-leaf">
                      {o.orderNumber}
                    </Link>
                    <span className="block text-xs text-ink-3">
                      {o.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">
                    {o.shipFullName}
                    <span className="block text-xs text-ink-3">{o.shipCity}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink">{formatINR(o.grandTotal)}</td>
                </tr>
              );
            })}
          </Table>
        </Panel>

        <Panel
          title="Low stock"
          action={
            <Link href="/admin/inventory" className="text-sm font-medium text-leaf hover:underline">
              Inventory →
            </Link>
          }
        >
          <Table head={['Product', 'Variant', 'SKU', 'In stock']} empty="Nothing running low.">
            {lowStock.map((v) => (
              <tr key={v.id} className="hover:bg-bone-2">
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/products/${v.product.id}`}
                    className="text-ink hover:text-leaf"
                  >
                    {v.product.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-ink-3">
                  {Object.values((v.optionValues ?? {}) as Record<string, string>).join(' · ') ||
                    'Standard'}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-3">{v.sku}</td>
                <td className="px-3 py-2.5">
                  <Badge className={v.stockQty === 0 ? 'bg-clay-2 text-clay' : 'bg-sun-2 text-sun'}>
                    {v.stockQty}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>

      <p className="mt-6 text-sm text-ink-3">
        {productCount} active product{productCount === 1 ? '' : 's'} in the catalog.
      </p>
    </>
  );
}
