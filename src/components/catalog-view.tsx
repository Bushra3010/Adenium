import type { ProductType } from '@/generated/prisma';
import {
  getFacets,
  getPriceBounds,
  listProducts,
  type ProductFilters,
  type SortKey,
} from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { wishlistedIds } from '@/lib/wishlist';
import { prisma } from '@/lib/prisma';
import { FilterRail } from './filter-rail';
import { SortSelect } from './sort-select';
import { EmptyResults, Pagination, ProductGrid } from './product-grid';

export type SearchParams = Record<string, string | string[] | undefined>;

function asArray(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function buildFilters(
  searchParams: SearchParams,
  facetKeys: string[],
  base: Partial<ProductFilters>,
): ProductFilters {
  const attributes: Record<string, string[]> = {};
  for (const key of facetKeys) {
    const values = asArray(searchParams[key]);
    if (values.length) attributes[key] = values;
  }

  const num = (v: string | string[] | undefined) => {
    const raw = Array.isArray(v) ? v[0] : v;
    const n = raw != null ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    ...base,
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    minPrice: num(searchParams.min),
    maxPrice: num(searchParams.max),
    inStockOnly: searchParams.instock === '1',
    minRating: num(searchParams.rating),
    attributes,
    sort: (Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) as SortKey,
    page: num(searchParams.page) ?? 1,
  };
}

export async function CatalogView({
  searchParams,
  categorySlug,
  type,
  emptyQuery,
}: {
  searchParams: SearchParams;
  categorySlug?: string;
  type?: ProductType;
  emptyQuery?: string;
}) {
  const [facets, priceBounds] = await Promise.all([
    getFacets(categorySlug, type),
    getPriceBounds(categorySlug, type),
  ]);

  const filters = buildFilters(searchParams, facets.map((f) => f.key), {
    categorySlug,
    type,
  });

  const [result, user] = await Promise.all([listProducts(filters), getCurrentUser()]);
  const saved = await wishlistedIds();

  const makeHref = (page: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === 'page') continue;
      for (const one of asArray(v)) next.append(k, one);
    }
    next.set('page', String(page));
    return `?${next.toString()}`;
  };

  const suggestions =
    result.items.length === 0
      ? (
          await prisma.category.findMany({
            where: { parentId: { not: null }, isActive: true },
            take: 6,
            orderBy: { position: 'asc' },
            select: { name: true, slug: true, parent: { select: { slug: true } } },
          })
        ).map((c) => ({ name: c.name, slug: c.slug, parentSlug: c.parent!.slug }))
      : [];

  const from = (result.page - 1) * result.perPage + 1;
  const to = Math.min(result.page * result.perPage, result.total);

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside aria-label="Filters" className="lg:sticky lg:top-32 lg:self-start">
        <FilterRail facets={facets} priceBounds={priceBounds} />
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-sm text-ink-3">
            {result.total === 0
              ? 'No products'
              : `Showing ${from}–${to} of ${result.total} product${result.total === 1 ? '' : 's'}`}
          </p>
          <SortSelect />
        </div>

        {result.items.length === 0 ? (
          <EmptyResults query={emptyQuery} suggestions={suggestions} />
        ) : (
          <>
            <ProductGrid items={result.items} wishlisted={saved} signedIn={Boolean(user)} />
            <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
          </>
        )}
      </div>
    </div>
  );
}
