import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { formatINR, toNumber } from '@/lib/money';
import { PageHeading, Panel, Table, Badge } from '@/components/admin/ui';
import type { Prisma } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

export default async function CustomersPage({ searchParams }: PageProps<'/admin/customers'>) {
  await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  const where: Prisma.UserWhereInput = {
    role: 'CUSTOMER',
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const customers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: 'PAID' },
        select: { grandTotal: true, createdAt: true },
      },
    },
  });

  return (
    <>
      <PageHeading title="Customers" description={`${customers.length} shown`} />

      <form method="GET" action="/admin/customers" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name, email or phone"
          aria-label="Search customers"
          className="w-full max-w-sm border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
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
          head={['Customer', 'Contact', 'Orders', 'Spent', 'Last order', 'Joined']}
          empty="No customers match."
        >
          {customers.map((c) => {
            const spent = c.orders.reduce((s, o) => s + toNumber(o.grandTotal), 0);
            const last = c.orders
              .map((o) => o.createdAt)
              .sort((a, b) => b.getTime() - a.getTime())[0];
            return (
              <tr key={c.id} className="hover:bg-bone-2">
                <td className="px-3 py-2.5">
                  <span className="font-medium text-ink">{c.name}</span>
                  {!c.emailVerified && (
                    <Badge className="ml-2 bg-sun-2 text-sun">Unverified</Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-3">
                  <a href={`mailto:${c.email}`} className="hover:text-leaf">
                    {c.email}
                  </a>
                  {c.phone && <span className="block text-xs">{c.phone}</span>}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/orders?q=${encodeURIComponent(c.email)}`}
                    className="tabular-nums text-leaf hover:underline"
                  >
                    {c._count.orders}
                  </Link>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-ink-2">{formatINR(spent)}</td>
                <td className="px-3 py-2.5 text-ink-3">
                  {last
                    ? last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                    : '—'}
                </td>
                <td className="px-3 py-2.5 text-ink-3">
                  {c.createdAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })}
                </td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}
