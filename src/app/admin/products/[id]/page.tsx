import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { loadEditorReferenceData, loadProductForEditor } from '@/lib/editor-data';
import { PageHeading } from '@/components/admin/ui';
import { ProductEditor } from '@/components/admin/product-editor';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  await requireStaff();
  const { id } = await params;

  const [product, reference] = await Promise.all([
    loadProductForEditor(id),
    loadEditorReferenceData(),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-leaf hover:underline">
        ← All products
      </Link>
      <PageHeading
        title={product.name}
        description={`SKU ${product.sku}`}
        action={
          <Link
            href={`/product/${product.slug}`}
            className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            View on storefront →
          </Link>
        }
      />
      <ProductEditor initial={product} {...reference} />
    </>
  );
}
