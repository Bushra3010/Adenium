import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** SEO-05. Private and transactional areas stay out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/api/', '/cart', '/checkout', '/order/', '/search'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
