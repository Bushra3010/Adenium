import { CategoryPage, categoryMetadata } from '@/lib/category-page';

export const dynamic = 'force-dynamic';
export const generateMetadata = () => categoryMetadata('seeds');

export default async function SeedsPage({ searchParams }: PageProps<'/seeds'>) {
  return <CategoryPage slug="seeds" type="SEED" searchParams={await searchParams} />;
}
