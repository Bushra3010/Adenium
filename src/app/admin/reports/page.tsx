import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { formatINR, toNumber } from '@/lib/money';
import { PageHeading, Panel, StatTile, Table } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({ searchParams }: PageProps<'/admin/reports'>) {
  await requireStaff();
  const sp = await searchParams;

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const from = typeof sp.from === 'string' && sp.from ? sp.from : isoDay(defaultFrom);
  const to = typeof sp.to === 'string' && sp.to ? sp.to : isoDay(new Date());

  const range = { gte: new Date(from), lte: new Date(`${to}T23:59:59.999`) };
  const paidInRange = { paymentStatus: 'PAID' as const, paidAt: range };

  const [agg, orders, topItems] = await Promise.all([
    prisma.order.aggregate({
      where: paidInRange,
      _sum: { grandTotal: true, discountTotal: true, shippingTotal: true },
      _count: true,
      _avg: { grandTotal: true },
    }),
    prisma.order.findMany({
      where: paidInRange,
      orderBy: { paidAt: 'desc' },
      select: { id: true, orderNumber: true, paidAt: true, grandTotal: true, shipCity: true },
      take: 50,
    }),
    prisma.orderItem.groupBy({
      by: ['productName', 'sku'],
      where: { order: paidInRange },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 10,
    }),
  ]);

  const exportHref = (type: string) =>
    `/api/admin/export?type=${type}&from=${from}&to=${to}`;

  return (
    <>
      <PageHeading title="Reports" description={`Paid orders between ${from} and ${to}.`} />

      <form method="GET" action="/admin/reports" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-ink-2">
            From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1.5 border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-ink-2">
            To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1.5 border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
        >
          Apply
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Revenue" value={formatINR(toNumber(agg._sum.grandTotal ?? 0))} />
        <StatTile label="Paid orders" value={agg._count} />
        <StatTile
          label="Average order"
          value={formatINR(toNumber(agg._avg.grandTotal ?? 0))}
        />
        <StatTile
          label="Discounts given"
          value={formatINR(toNumber(agg._sum.discountTotal ?? 0))}
        />
      </div>

      <div className="mt-6">
        <Panel title="Export">
          <div className="flex flex-wrap gap-3">
            <a
              href={exportHref('orders')}
              className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
            >
              Orders CSV
            </a>
            <a
              href={exportHref('items')}
              className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
            >
              Sold items CSV
            </a>
            <a
              href="/api/admin/export?type=products"
              className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
            >
              Full catalog CSV
            </a>
          </div>
          <p className="mt-3 text-xs text-ink-3">
            Order exports respect the date range above. The catalog export covers everything.
          </p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Best sellers">
          <Table head={['Product', 'SKU', 'Units', 'Revenue']} empty="No sales in this range.">
            {topItems.map((item) => (
              <tr key={item.sku} className="hover:bg-bone-2">
                <td className="px-3 py-2.5 text-ink">{item.productName}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-3">{item.sku}</td>
                <td className="px-3 py-2.5 tabular-nums text-ink-2">{item._sum.quantity ?? 0}</td>
                <td className="px-3 py-2.5 tabular-nums text-ink">
                  {formatINR(toNumber(item._sum.lineTotal ?? 0))}
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Paid orders">
          <Table head={['Order', 'Paid', 'City', 'Total']} empty="No paid orders in this range.">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-bone-2">
                <td className="px-3 py-2.5">
                  <a href={`/admin/orders/${o.id}`} className="text-ink hover:text-leaf">
                    {o.orderNumber}
                  </a>
                </td>
                <td className="px-3 py-2.5 text-ink-3">
                  {o.paidAt?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-ink-3">{o.shipCity}</td>
                <td className="px-3 py-2.5 tabular-nums text-ink">{formatINR(o.grandTotal)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
