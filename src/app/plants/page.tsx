import { CategoryPage, categoryMetadata } from '@/lib/category-page';

export const dynamic = 'force-dynamic';
export const generateMetadata = () => categoryMetadata('plants');

export default async function PlantsPage({ searchParams }: PageProps<'/plants'>) {
  return <CategoryPage slug="plants" type="PLANT" searchParams={await searchParams} />;
}
