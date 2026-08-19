import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { reservedQty } from '@/lib/stock';
import { formatINR } from '@/lib/money';
import { PageHeading, Panel, Table, Badge } from '@/components/admin/ui';
import { StockInput } from '@/components/admin/stock-input';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({ searchParams }: PageProps<'/admin/inventory'>) {
  await requireStaff();
  const sp = await searchParams;
  const lowOnly = sp.low === '1';
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  const settings = await getSettings();

  const variants = await prisma.variant.findMany({
    where: {
      isActive: true,
      ...(lowOnly ? { stockQty: { lte: settings.lowStockThreshold } } : {}),
      ...(q
        ? {
            OR: [
              { sku: { contains: q, mode: 'insensitive' } },
              { product: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    orderBy: [{ stockQty: 'asc' }, { sku: 'asc' }],
    include: { product: { select: { id: true, name: true, type: true, status: true } } },
    take: 200,
  });

  const reserved = await reservedQty(variants.map((v) => v.id));

  return (
    <>
      <PageHeading
        title="Inventory"
        description="Stock is held while an order awaits payment; available is what a shopper can actually buy."
      />

      <form method="GET" action="/admin/inventory" className="mb-4 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Product name or SKU"
          aria-label="Search inventory"
          className="w-full max-w-sm border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            name="low"
            value="1"
            defaultChecked={lowOnly}
            className="h-4 w-4 accent-[#1f5c40]"
          />
          Low stock only (≤ {settings.lowStockThreshold})
        </label>
        <button
          type="submit"
          className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
        >
          Apply
        </button>
      </form>

      <Panel>
        <Table
          head={['Product', 'Variant', 'SKU', 'Price', 'In stock', 'Held', 'Available', '']}
          empty="No variants match."
        >
          {variants.map((v) => {
            const held = reserved.get(v.id) ?? 0;
            const available = Math.max(0, v.stockQty - held);
            return (
              <tr key={v.id} className="hover:bg-bone-2">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/products/${v.product.id}`} className="text-ink hover:text-leaf">
                    {v.product.name}
                  </Link>
                  {v.product.status !== 'ACTIVE' && (
                    <Badge className="ml-2 bg-bone-3 text-ink-3">{v.product.status}</Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-3">
                  {Object.values((v.optionValues ?? {}) as Record<string, string>).join(' · ') ||
                    'Standard'}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-3">{v.sku}</td>
                <td className="px-3 py-2.5 tabular-nums text-ink-2">{formatINR(v.price)}</td>
                <td className="px-3 py-2.5">
                  <StockInput variantId={v.id} value={v.stockQty} />
                </td>
                <td className="px-3 py-2.5 tabular-nums text-ink-3">{held || '—'}</td>
                <td className="px-3 py-2.5">
                  <Badge
                    className={
                      available === 0
                        ? 'bg-clay-2 text-clay'
                        : available <= settings.lowStockThreshold
                          ? 'bg-sun-2 text-sun'
                          : 'bg-leaf-3 text-leaf'
                    }
                  >
                    {available}
                  </Badge>
                </td>
                <td className="px-3 py-2.5" />
              </tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}
