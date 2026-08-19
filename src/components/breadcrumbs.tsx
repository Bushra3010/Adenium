import Link from 'next/link';

export type Crumb = { label: string; href?: string };

/** CAT-05, plus the BreadcrumbList payload for SEO-04. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${siteUrl}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-ink-3">
          {items.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {c.href ? (
                <Link href={c.href} className="hover:text-leaf hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink-2">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
