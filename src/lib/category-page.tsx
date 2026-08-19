import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/lib/catalog';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CatalogView, type SearchParams } from '@/components/catalog-view';
import type { ProductType } from '@/generated/prisma';
import Link from 'next/link';

export async function categoryMetadata(slug: string): Promise<Metadata> {
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const title = category.metaTitle ?? `${category.name} — buy online in India`;
  const description =
    category.metaDescription ?? category.description ?? `Shop ${category.name} at Adenium.`;
  const path = category.parent ? `/${category.parent.slug}/${category.slug}` : `/${category.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'website' },
  };
}

export async function CategoryPage({
  slug,
  searchParams,
  type,
}: {
  slug: string;
  searchParams: SearchParams;
  type: ProductType;
}) {
  const category = await getCategoryBySlug(slug);
  if (!category || !category.isActive) notFound();

  const crumbs = category.parent
    ? [
        { label: 'Home', href: '/' },
        { label: category.parent.name, href: `/${category.parent.slug}` },
        { label: category.name },
      ]
    : [{ label: 'Home', href: '/' }, { label: category.name }];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <Breadcrumbs items={crumbs} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-4xl leading-tight text-ink">{category.name}</h1>
        {category.description && (
          <p className="mt-3 leading-relaxed text-ink-2">{category.description}</p>
        )}
      </header>

      {category.children.length > 0 && (
        <nav aria-label="Subcategories" className="mt-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/${category.slug}/${child.slug}`}
              className="border border-line bg-white px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-leaf hover:text-leaf"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-10">
        <CatalogView searchParams={searchParams} categorySlug={slug} type={type} />
      </div>
    </div>
  );
}
