import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CatalogView } from '@/components/catalog-view';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: PageProps<'/search'>): Promise<Metadata> {
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q : '';
  return {
    title: query ? `Search results for “${query}”` : 'All products',
    // SEO-06 — search and filter permutations must not be indexed.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const sp = await searchParams;
  const query = typeof sp.q === 'string' ? sp.q : '';

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: query ? `Search: ${query}` : 'All products' }]}
      />
      <header className="mt-6">
        <h1 className="font-display text-4xl leading-tight text-ink">
          {query ? `Results for “${query}”` : 'All products'}
        </h1>
      </header>
      <div className="mt-10">
        <CatalogView searchParams={sp} emptyQuery={query} />
      </div>
    </div>
  );
}
