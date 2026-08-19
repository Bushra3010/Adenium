import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Regenerated hourly rather than frozen at build time, so newly published
// products and guides appear without a redeploy (SEO-05).
export const revalidate = 3600;

/** SEO-05 — regenerated from the catalog, so it never goes stale. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, guides, pages] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, parent: { select: { slug: true } } },
    }),
    prisma.guide.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/seeds`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/plants`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/guides`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: c.parent ? `${SITE}/${c.parent.slug}/${c.slug}` : `${SITE}/${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...guides.map((g) => ({
      url: `${SITE}/guides/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...pages.map((p) => ({
      url: `${SITE}/pages/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];

  // The Seeds and Plants landing pages are both static routes and top-level
  // categories; a sitemap must list each URL once.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
