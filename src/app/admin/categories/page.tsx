import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { PageHeading } from '@/components/admin/ui';
import { CategoryManager, type CategoryRow } from '@/components/admin/category-manager';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  await requireStaff();

  const categories = await prisma.category.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  });

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    type: c.type,
    parentId: c.parentId,
    position: c.position,
    isActive: c.isActive,
    productCount: c._count.products,
  }));

  return (
    <>
      <PageHeading
        title="Categories"
        description="The storefront navigation. Nest categories under Seeds or Plants."
      />
      <CategoryManager categories={rows} />
    </>
  );
}
