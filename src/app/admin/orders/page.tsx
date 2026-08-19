import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { STATUS_LABEL, statusBadge } from '@/lib/order-status';
import { PageHeading, Panel, Table, Badge } from '@/components/admin/ui';
import type { OrderStatus, Prisma } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];
const PER_PAGE = 25;

export default async function AdminOrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  await requireStaff();
  const sp = await searchParams;

  const status = typeof sp.status === 'string' ? (sp.status as OrderStatus) : undefined;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (status && STATUSES.includes(status)) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { shipFullName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { awbNumber: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hrefFor = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    if (params.status ?? status) next.set('status', params.status ?? status!);
    if (params.q ?? q) next.set('q', params.q ?? q);
    if (params.page) next.set('page', params.page);
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : '/admin/orders';
  };

  return (
    <>
      <PageHeading title="Orders" description={`${total} order${total === 1 ? '' : 's'}`} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/orders"
          className={`border px-3 py-1.5 text-sm ${!status ? 'border-leaf bg-leaf text-white' : 'border-line bg-white text-ink-2 hover:border-leaf'}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={hrefFor({ status: s })}
            className={`border px-3 py-1.5 text-sm ${status === s ? 'border-leaf bg-leaf text-white' : 'border-line bg-white text-ink-2 hover:border-leaf'}`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <form method="GET" action="/admin/orders" className="mb-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="order-search" className="sr-only">
          Search orders
        </label>
        <input
          id="order-search"
          name="q"
          defaultValue={q}
          placeholder="Order number, name, email, phone or AWB"
          className="w-full max-w-md border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
        <button
          type="submit"
          className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
        >
          Search
        </button>
      </form>

      <Panel>
        <Table
          head={['Order', 'Placed', 'Customer', 'Items', 'Status', 'Payment', 'Total']}
          empty="No orders match."
        >
          {orders.map((o) => {
            const badge = statusBadge(o.status);
            return (
              <tr key={o.id} className="hover:bg-bone-2">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:text-leaf">
                    {o.orderNumber}
                  </Link>
                  {o.awbNumber && (
                    <span className="block font-mono text-xs text-ink-3">{o.awbNumber}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-3">
                  {o.createdAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })}
                </td>
                <td className="px-3 py-2.5 text-ink-2">
                  {o.shipFullName}
                  <span className="block text-xs text-ink-3">
                    {o.shipCity}, {o.shipState}
                  </span>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-ink-3">{o._count.items}</td>
                <td className="px-3 py-2.5">
                  <Badge className={badge.className}>{badge.label}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  <Badge
                    className={
                      o.paymentStatus === 'PAID'
                        ? 'bg-leaf-3 text-leaf'
                        : o.paymentStatus === 'FAILED'
                          ? 'bg-clay-2 text-clay'
                          : 'bg-bone-3 text-ink-3'
                    }
                  >
                    {o.paymentStatus}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-ink">{formatINR(o.grandTotal)}</td>
              </tr>
            );
          })}
        </Table>
      </Panel>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={hrefFor({ page: String(page - 1) })}
              className="border border-line bg-white px-3 py-2 text-sm hover:border-leaf"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-ink-3">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link
              href={hrefFor({ page: String(page + 1) })}
              className="border border-line bg-white px-3 py-2 text-sm hover:border-leaf"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
