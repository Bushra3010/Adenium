import { CategoryPage, categoryMetadata } from '@/lib/category-page';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/plants/[category]'>) {
  const { category } = await params;
  return categoryMetadata(category);
}

export default async function PlantCategoryPage({
  params,
  searchParams,
}: PageProps<'/plants/[category]'>) {
  const { category } = await params;
  return <CategoryPage slug={category} type="PLANT" searchParams={await searchParams} />;
}
