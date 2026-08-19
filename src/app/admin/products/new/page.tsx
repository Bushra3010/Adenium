import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { loadEditorReferenceData, BLANK_PRODUCT } from '@/lib/editor-data';
import { PageHeading } from '@/components/admin/ui';
import { ProductEditor } from '@/components/admin/product-editor';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireStaff();
  const reference = await loadEditorReferenceData();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-leaf hover:underline">
        ← All products
      </Link>
      <PageHeading title="Add a product" description="Saved as a draft until you publish it." />
      <ProductEditor initial={BLANK_PRODUCT} {...reference} />
    </>
  );
}
