import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { Stars } from '@/components/stars';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My reviews', robots: { index: false, follow: false } };

const STATUS_COPY = {
  PENDING: { label: 'Awaiting moderation', className: 'bg-sun-2 text-sun' },
  APPROVED: { label: 'Published', className: 'bg-leaf-3 text-leaf' },
  REJECTED: { label: 'Not published', className: 'bg-bone-3 text-ink-3' },
} as const;

export default async function MyReviewsPage() {
  const user = await requireUser();
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true, slug: true } } },
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">My reviews</h2>

      {reviews.length === 0 ? (
        <p className="mt-6 border border-line bg-white p-10 text-center text-ink-3">
          You have not written a review yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => {
            const status = STATUS_COPY[r.status];
            return (
              <li key={r.id} className="border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/product/${r.product.slug}`}
                    className="font-medium text-ink hover:text-leaf"
                  >
                    {r.product.name}
                  </Link>
                  <span className={`px-2.5 py-1 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <div className="mt-2">
                  <Stars rating={r.rating} showCount={false} />
                </div>
                {r.title && <p className="mt-2 font-medium text-ink">{r.title}</p>}
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{r.body}</p>
                <p className="mt-2 text-xs text-ink-3">
                  {r.createdAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
