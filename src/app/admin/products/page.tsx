import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { formatPriceRange, toNumber } from '@/lib/money';
import { PageHeading, Panel, Table, Badge } from '@/components/admin/ui';
import type { Prisma, ProductStatus } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

const PER_PAGE = 25;
const STATUS_TONE: Record<ProductStatus, string> = {
  ACTIVE: 'bg-leaf-3 text-leaf',
  DRAFT: 'bg-sun-2 text-sun',
  ARCHIVED: 'bg-bone-3 text-ink-3',
};

export default async function AdminProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  await requireStaff();
  const sp = await searchParams;

  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? (sp.status as ProductStatus) : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.ProductWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { botanicalName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        variants: { where: { isActive: true }, select: { price: true, stockQty: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        categories: { include: { category: { select: { name: true, parentId: true } } } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeading
        title="Products"
        description={`${total} product${total === 1 ? '' : 's'}`}
        action={
          <Link
            href="/admin/products/new"
            className="bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
          >
            Add a product
          </Link>
        }
      />

      <form method="GET" action="/admin/products" className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name, SKU or botanical name"
          aria-label="Search products"
          className="w-full max-w-sm border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          aria-label="Filter by status"
          className="border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        >
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
        >
          Filter
        </button>
      </form>

      <Panel>
        <Table
          head={['', 'Product', 'Type', 'SKU', 'Variants', 'Price', 'Stock', 'Status']}
          empty="No products match."
        >
          {products.map((p) => {
            const prices = p.variants.map((v) => toNumber(v.price));
            const stock = p.variants.reduce((s, v) => s + v.stockQty, 0);
            return (
              <tr key={p.id} className="hover:bg-bone-2">
                <td className="px-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]?.url ?? '/img/ph/default.svg'}
                    alt=""
                    className="h-10 w-10 border border-line object-cover"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-leaf">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-ink-3">
                    {p.categories.map((c) => c.category.name).join(' · ')}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-ink-3">{p.type === 'SEED' ? 'Seeds' : 'Plant'}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-3">{p.sku}</td>
                <td className="px-3 py-2.5 tabular-nums text-ink-2">{p.variants.length}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-ink-2">
                  {prices.length
                    ? formatPriceRange(Math.min(...prices), Math.max(...prices))
                    : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <Badge className={stock === 0 ? 'bg-clay-2 text-clay' : stock <= 3 ? 'bg-sun-2 text-sun' : 'bg-bone-3 text-ink-2'}>
                    {stock}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <Badge className={STATUS_TONE[p.status]}>{p.status}</Badge>
                </td>
              </tr>
            );
          })}
        </Table>
      </Panel>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={`/admin/products?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${status ? `&status=${status}` : ''}`}
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
              href={`/admin/products?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${status ? `&status=${status}` : ''}`}
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
