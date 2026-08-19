import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { renderRichText } from '@/lib/rich-text';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContactForm } from '@/components/contact-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/pages/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, isPublished: true } });
  if (!page) return { title: 'Page not found' };
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `/pages/${page.slug}` },
  };
}

export default async function ContentPage({ params }: PageProps<'/pages/[slug]'>) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, isPublished: true } });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: page.title }]} />

      <article className="mt-8">
        <h1 className="font-display text-4xl leading-tight text-ink">{page.title}</h1>
        <div
          className="rich mt-8"
          dangerouslySetInnerHTML={{ __html: renderRichText(page.body) }}
        />
      </article>

      {page.slug === 'contact' && (
        <div className="mt-12 border-t border-line pt-10">
          <ContactForm />
        </div>
      )}
    </div>
  );
}
