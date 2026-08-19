import type { Prisma, ProductType } from '@/generated/prisma';
import { prisma } from './prisma';
import { availableQtyMany } from './stock';
import { toNumber } from './money';

export type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';

export type ProductFilters = {
  q?: string;
  type?: ProductType;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  /** Product ids to leave out — used to stop home-page sections repeating. */
  excludeIds?: string[];
  minRating?: number;
  /** Horticultural facets, e.g. { difficulty: ['Easy'], light: ['Full sun'] } (SRCH-04). */
  attributes?: Record<string, string[]>;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  botanicalName: string | null;
  type: ProductType;
  shortDescription: string | null;
  image: string;
  imageAlt: string;
  minPrice: number;
  maxPrice: number;
  compareAtPrice: number | null;
  ratingAvg: number;
  ratingCount: number;
  available: number;
  variantCount: number;
};

const PER_PAGE = 12;

/** Category ids for a slug, including its descendants. */
async function categoryIdsFor(slug: string): Promise<string[]> {
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, children: { select: { id: true } } },
  });
  if (!cat) return [];
  return [cat.id, ...cat.children.map((c) => c.id)];
}

export async function listProducts(filters: ProductFilters): Promise<{
  items: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? PER_PAGE;

  const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.type) where.type = filters.type;
  if (filters.featuredOnly) where.featured = true;
  if (filters.excludeIds?.length) where.id = { notIn: filters.excludeIds };

  // SRCH-01 — name, description, SKU, tags and botanical names.
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { botanicalName: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
      ],
    });
  }

  if (filters.categorySlug) {
    const ids = await categoryIdsFor(filters.categorySlug);
    if (ids.length === 0) return { items: [], total: 0, page, perPage, pages: 0 };
    and.push({ categories: { some: { categoryId: { in: ids } } } });
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    and.push({
      variants: {
        some: {
          isActive: true,
          price: {
            ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
          },
        },
      },
    });
  }

  if (filters.minRating) and.push({ ratingAvg: { gte: filters.minRating } });

  // Facets combine with AND across attributes, OR within one (SRCH-05).
  for (const [key, values] of Object.entries(filters.attributes ?? {})) {
    if (values.length === 0) continue;
    and.push({
      attributes: { some: { attribute: { key }, value: { in: values } } },
    });
  }

  if (and.length) where.AND = and;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (filters.sort) {
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'rating':
        return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
      case 'price_asc':
      case 'price_desc':
        return [{ createdAt: 'desc' }]; // re-sorted below on the derived price
      default:
        return [{ featured: 'desc' }, { ratingCount: 'desc' }, { createdAt: 'desc' }];
    }
  })();

  const priceSort = filters.sort === 'price_asc' || filters.sort === 'price_desc';

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      // Price sorting depends on the variant aggregate, so fetch the matching
      // set and order in memory. Catalogs of this size make that cheaper than
      // a denormalised price column that can drift.
      ...(priceSort ? {} : { skip: (page - 1) * perPage, take: perPage }),
      select: {
        id: true, slug: true, name: true, botanicalName: true, type: true,
        shortDescription: true, ratingAvg: true, ratingCount: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        variants: {
          where: { isActive: true },
          select: { id: true, price: true, compareAtPrice: true },
        },
      },
    }),
  ]);

  const variantIds = rows.flatMap((r) => r.variants.map((v) => v.id));
  const availability = await availableQtyMany(variantIds);

  let items: ProductCard[] = rows.map((r) => {
    const prices = r.variants.map((v) => toNumber(v.price));
    const compare = r.variants
      .map((v) => (v.compareAtPrice ? toNumber(v.compareAtPrice) : null))
      .find((v) => v != null) ?? null;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      botanicalName: r.botanicalName,
      type: r.type,
      shortDescription: r.shortDescription,
      image: r.images[0]?.url ?? '/img/ph/default.svg',
      imageAlt: r.images[0]?.alt ?? r.name,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      compareAtPrice: compare,
      ratingAvg: r.ratingAvg,
      ratingCount: r.ratingCount,
      available: r.variants.reduce((sum, v) => sum + (availability.get(v.id) ?? 0), 0),
      variantCount: r.variants.length,
    };
  });

  // CAT-03 — sold-out products stay listed, so this only filters when asked.
  if (filters.inStockOnly) items = items.filter((i) => i.available > 0);

  if (priceSort) {
    items.sort((a, b) =>
      filters.sort === 'price_asc' ? a.minPrice - b.minPrice : b.maxPrice - a.maxPrice,
    );
    items = items.slice((page - 1) * perPage, page * perPage);
  }

  const effectiveTotal = filters.inStockOnly ? items.length : total;
  return {
    items,
    total: effectiveTotal,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(effectiveTotal / perPage)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
      attributes: { include: { attribute: true }, orderBy: { attribute: { position: 'asc' } } },
      faqs: { orderBy: { position: 'asc' } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!product) return null;

  const availability = await availableQtyMany(product.variants.map((v) => v.id));
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      price: toNumber(v.price),
      compareAtPrice: v.compareAtPrice ? toNumber(v.compareAtPrice) : null,
      available: availability.get(v.id) ?? 0,
    })),
  };
}

export async function getRelatedProducts(productId: string, categoryIds: string[], take = 4) {
  const rows = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: productId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    take,
    orderBy: [{ featured: 'desc' }, { ratingCount: 'desc' }],
    select: {
      id: true, slug: true, name: true, botanicalName: true, type: true,
      shortDescription: true, ratingAvg: true, ratingCount: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
      variants: { where: { isActive: true }, select: { id: true, price: true, compareAtPrice: true } },
    },
  });

  const availability = await availableQtyMany(rows.flatMap((r) => r.variants.map((v) => v.id)));
  return rows.map((r): ProductCard => {
    const prices = r.variants.map((v) => toNumber(v.price));
    return {
      id: r.id, slug: r.slug, name: r.name, botanicalName: r.botanicalName, type: r.type,
      shortDescription: r.shortDescription,
      image: r.images[0]?.url ?? '/img/ph/default.svg',
      imageAlt: r.images[0]?.alt ?? r.name,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      compareAtPrice: null,
      ratingAvg: r.ratingAvg, ratingCount: r.ratingCount,
      available: r.variants.reduce((s, v) => s + (availability.get(v.id) ?? 0), 0),
      variantCount: r.variants.length,
    };
  });
}

export async function getCategoryTree() {
  return prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { position: 'asc' },
    include: {
      children: { where: { isActive: true }, orderBy: { position: 'asc' } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { where: { isActive: true }, orderBy: { position: 'asc' } },
    },
  });
}

/** Facet values available for a category, for the filter rail (SRCH-04). */
export async function getFacets(categorySlug?: string, type?: ProductType) {
  const ids = categorySlug ? await categoryIdsFor(categorySlug) : null;
  const rows = await prisma.productAttribute.findMany({
    where: {
      attribute: { filterable: true, ...(type ? { appliesTo: { in: [type, 'BOTH'] } } : {}) },
      product: {
        status: 'ACTIVE',
        ...(type ? { type } : {}),
        ...(ids ? { categories: { some: { categoryId: { in: ids } } } } : {}),
      },
    },
    select: { value: true, attribute: { select: { key: true, label: true, position: true } } },
  });

  const grouped = new Map<string, { key: string; label: string; position: number; values: Map<string, number> }>();
  for (const r of rows) {
    const g = grouped.get(r.attribute.key) ?? {
      key: r.attribute.key,
      label: r.attribute.label,
      position: r.attribute.position,
      values: new Map<string, number>(),
    };
    g.values.set(r.value, (g.values.get(r.value) ?? 0) + 1);
    grouped.set(r.attribute.key, g);
  }

  return [...grouped.values()]
    .sort((a, b) => a.position - b.position)
    .map((g) => ({
      key: g.key,
      label: g.label,
      values: [...g.values.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    }));
}

export async function getPriceBounds(categorySlug?: string, type?: ProductType) {
  const ids = categorySlug ? await categoryIdsFor(categorySlug) : null;
  const agg = await prisma.variant.aggregate({
    where: {
      isActive: true,
      product: {
        status: 'ACTIVE',
        ...(type ? { type } : {}),
        ...(ids ? { categories: { some: { categoryId: { in: ids } } } } : {}),
      },
    },
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: agg._min.price ? Math.floor(toNumber(agg._min.price)) : 0,
    max: agg._max.price ? Math.ceil(toNumber(agg._max.price)) : 5000,
  };
}
