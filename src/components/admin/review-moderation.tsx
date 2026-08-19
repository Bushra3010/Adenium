'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moderateReviewAction } from '@/actions/admin-catalog';

export function ReviewModeration({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  function moderate(status: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const res = await moderateReviewAction(reviewId, status);
      setDone(res.message ?? null);
      router.refresh();
    });
  }

  if (done) return <p className="text-sm text-leaf">{done}</p>;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => moderate('APPROVED')}
        className="bg-leaf px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-50"
      >
        Publish
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => moderate('REJECTED')}
        className="border border-clay px-3 py-1.5 text-sm font-medium text-clay hover:bg-clay hover:text-white disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
