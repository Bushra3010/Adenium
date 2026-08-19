import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { wishlistedIds } from '@/lib/wishlist';
import { prisma } from '@/lib/prisma';
import { renderRichText } from '@/lib/rich-text';
import { formatINR } from '@/lib/money';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductShowcase } from '@/components/product-showcase';
import { Tabs, Accordion } from '@/components/tabs';
import { Stars } from '@/components/stars';
import { ProductCardItem } from '@/components/product-card';
import { WishlistButton } from '@/components/wishlist-button';
import { ReviewForm } from '@/components/review-form';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };

  const title = product.metaTitle ?? product.name;
  const description = product.metaDescription ?? product.shortDescription ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/product/${product.slug}`,
      type: 'website',
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProductPage({ params }: PageProps<'/product/[slug]'>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const categoryIds = product.categories.map((c) => c.categoryId);
  const [related, user, optionTypes] = await Promise.all([
    getRelatedProducts(product.id, categoryIds, 4),
    getCurrentUser(),
    prisma.optionType.findMany(),
  ]);
  const saved = await wishlistedIds();

  const optionLabels = Object.fromEntries(optionTypes.map((o) => [o.key, o.label]));
  const leafCategory =
    product.categories.find((c) => c.category.parentId != null)?.category ??
    product.categories[0]?.category;
  const parentSlug = product.type === 'SEED' ? 'seeds' : 'plants';
  const parentName = product.type === 'SEED' ? 'Seeds' : 'Plants';

  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));
  const totalAvailable = product.variants.reduce((s, v) => s + v.available, 0);

  // SEO-04 — Product structured data with price, availability and rating.
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? undefined,
    sku: product.sku,
    image: product.images.map((i) => `${SITE}${i.url}`),
    brand: { '@type': 'Brand', name: 'Adenium' },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAvg.toFixed(1),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: product.variants.length,
      availability:
        totalAvailable > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE}/product/${product.slug}`,
    },
  };

  const specs = product.attributes.map((a) => ({
    label: a.attribute.label,
    value: a.attribute.unit ? `${a.value}` : a.value,
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: parentName, href: `/${parentSlug}` },
          ...(leafCategory && leafCategory.parentId
            ? [{ label: leafCategory.name, href: `/${parentSlug}/${leafCategory.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8">
        <ProductShowcase
          images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
          variants={product.variants.map((v) => ({
            id: v.id,
            optionValues: (v.optionValues ?? {}) as Record<string, string>,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            available: v.available,
            imageUrl: null,
          }))}
          optionLabels={optionLabels}
          header={
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-leaf">
                {product.type === 'SEED' ? 'Seeds' : 'Live plant'}
              </p>
              <h1 className="mt-2 font-display text-4xl leading-[1.15] text-ink">
                {product.name}
              </h1>
              {product.botanicalName && (
                <p className="mt-1.5 text-base italic text-ink-3">{product.botanicalName}</p>
              )}
              <div className="mt-4 flex items-center gap-4">
                <Stars rating={product.ratingAvg} count={product.ratingCount} />
                {product.ratingCount > 0 && (
                  <a href="#panel-reviews" className="text-sm text-ink-3 hover:text-leaf hover:underline">
                    Read reviews
                  </a>
                )}
              </div>
              {product.shortDescription && (
                <p className="mt-5 leading-relaxed text-ink-2">{product.shortDescription}</p>
              )}
            </div>
          }
          footer={
            <div className="mt-7 space-y-4 border-t border-line pt-6">
              <WishlistButton
                productId={product.id}
                initiallyWishlisted={saved.has(product.id)}
                signedIn={Boolean(user)}
                withLabel
              />
              <ul className="space-y-2 text-sm text-ink-3">
                <li className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  Free shipping on orders above {formatINR(1200)}
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  {product.type === 'PLANT'
                    ? 'Plants despatched Monday to Wednesday only'
                    : 'Seed orders despatched within 2 working days'}
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  Germination and care notes included on this page
                </li>
              </ul>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {product.tags.map((t) => (
                    <span
                      key={t.tagId}
                      className="border border-line px-2.5 py-1 text-xs text-ink-3"
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          }
        />
      </div>

      <div className="mt-16">
        <Tabs
          items={[
            {
              id: 'description',
              label: 'Description',
              content: (
                <div className="rich max-w-3xl">
                  <div dangerouslySetInnerHTML={{ __html: renderRichText(product.description ?? '') }} />
                </div>
              ),
            },
            ...(product.careGuide
              ? [
                  {
                    id: 'care',
                    label: product.type === 'SEED' ? 'Growing & germination' : 'Growing & care',
                    content: (
                      <div className="rich max-w-3xl">
                        <div dangerouslySetInnerHTML={{ __html: renderRichText(product.careGuide) }} />
                      </div>
                    ),
                  },
                ]
              : []),
            ...(specs.length > 0
              ? [
                  {
                    id: 'specs',
                    label: 'Specifications',
                    content: (
                      <div className="max-w-2xl overflow-x-auto">
                        <table className="w-full border border-line bg-white text-sm">
                          <tbody>
                            {specs.map((s) => (
                              <tr key={s.label} className="border-b border-line last:border-b-0">
                                <th scope="row" className="w-1/2 px-4 py-3 text-left font-medium text-ink">
                                  {s.label}
                                </th>
                                <td className="px-4 py-3 text-ink-2">{s.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ),
                  },
                ]
              : []),
            {
              id: 'reviews',
              label: 'Reviews',
              count: product.reviews.length,
              content: (
                <div className="max-w-3xl space-y-8">
                  {product.reviews.length === 0 ? (
                    <p className="text-ink-3">
                      No reviews yet. If you have grown this, we would like to hear how it went.
                    </p>
                  ) : (
                    <ul className="space-y-6">
                      {product.reviews.map((r) => (
                        <li key={r.id} className="border-b border-line pb-6 last:border-b-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <Stars rating={r.rating} showCount={false} />
                            <span className="font-medium text-ink">{r.user.name}</span>
                            {r.verifiedOrderId && (
                              <span className="bg-leaf-3 px-2 py-0.5 text-[11px] font-medium text-leaf">
                                Verified purchase
                              </span>
                            )}
                            <span className="text-xs text-ink-3">
                              {r.createdAt.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {r.title && <p className="mt-2 font-medium text-ink">{r.title}</p>}
                          <p className="mt-1.5 leading-relaxed text-ink-2">{r.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <ReviewForm productId={product.id} signedIn={Boolean(user)} />
                </div>
              ),
            },
            ...(product.faqs.length > 0
              ? [
                  {
                    id: 'faq',
                    label: 'FAQ',
                    content: (
                      <div className="max-w-3xl">
                        <Accordion items={product.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
                      </div>
                    ),
                  },
                ]
              : []),
            {
              id: 'shipping',
              label: 'Shipping',
              content: (
                <div className="rich max-w-3xl">
                  <h2>Despatch</h2>
                  <p>
                    {product.type === 'PLANT'
                      ? 'Live plants are despatched Monday to Wednesday only, so that nothing sits in a transit hub over a weekend. Some leaf drop on arrival is normal and is not damage.'
                      : 'Seed orders are despatched within two working days and travel by standard post.'}
                  </p>
                  <h2>Charges</h2>
                  <p>
                    Shipping is charged at a flat rate calculated at checkout, and is free on
                    orders above {formatINR(1200)}.
                  </p>
                  <p>
                    Full detail is on the{' '}
                    <Link href="/pages/shipping" className="text-leaf underline">
                      shipping and delivery
                    </Link>{' '}
                    page.
                  </p>
                </div>
              ),
            },
          ]}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="font-display text-3xl text-ink">You might also like</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCardItem
                key={p.id}
                product={p}
                wishlisted={saved.has(p.id)}
                signedIn={Boolean(user)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
