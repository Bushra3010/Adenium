import { CategoryPage, categoryMetadata } from '@/lib/category-page';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/seeds/[category]'>) {
  const { category } = await params;
  return categoryMetadata(category);
}

export default async function SeedCategoryPage({
  params,
  searchParams,
}: PageProps<'/seeds/[category]'>) {
  const { category } = await params;
  return <CategoryPage slug={category} type="SEED" searchParams={await searchParams} />;
}
