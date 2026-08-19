import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { PageHeading, Panel, Badge } from '@/components/admin/ui';
import { Stars } from '@/components/stars';
import { ReviewModeration } from '@/components/admin/review-moderation';
import type { ReviewStatus } from '@/generated/prisma';

export const dynamic = 'force-dynamic';

const TABS: { status: ReviewStatus; label: string }[] = [
  { status: 'PENDING', label: 'Awaiting moderation' },
  { status: 'APPROVED', label: 'Published' },
  { status: 'REJECTED', label: 'Rejected' },
];

export default async function AdminReviewsPage({ searchParams }: PageProps<'/admin/reviews'>) {
  await requireStaff();
  const sp = await searchParams;
  const status = (typeof sp.status === 'string' ? sp.status : 'PENDING') as ReviewStatus;

  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.review.groupBy({ by: ['status'], _count: true }),
  ]);

  const countFor = (s: ReviewStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeading
        title="Reviews"
        description="Nothing appears on the storefront until it is published here."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin/reviews?status=${tab.status}`}
            className={`border px-3 py-1.5 text-sm ${
              status === tab.status
                ? 'border-leaf bg-leaf text-white'
                : 'border-line bg-white text-ink-2 hover:border-leaf'
            }`}
          >
            {tab.label} ({countFor(tab.status)})
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <Panel>
          <p className="py-8 text-center text-ink-3">Nothing in this queue.</p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Panel key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars rating={r.rating} showCount={false} />
                    <Link
                      href={`/product/${r.product.slug}`}
                      className="font-medium text-ink hover:text-leaf"
                    >
                      {r.product.name}
                    </Link>
                    {r.verifiedOrderId && (
                      <Badge className="bg-leaf-3 text-leaf">Verified purchase</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-ink-3">
                    {r.user.name} · {r.user.email} ·{' '}
                    {r.createdAt.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {r.title && <p className="mt-3 font-medium text-ink">{r.title}</p>}
                  <p className="mt-1 leading-relaxed text-ink-2">{r.body}</p>
                </div>

                {r.status === 'PENDING' && (
                  <div className="shrink-0">
                    <ReviewModeration reviewId={r.id} />
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
