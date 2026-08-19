'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelOrderAction } from '@/actions/order';

/** ACC-07 — cancellable only while the order is still CONFIRMED. */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="border border-clay px-4 py-2 text-sm font-medium text-clay hover:bg-clay hover:text-white"
      >
        Cancel this order
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-2">
        Cancel this order? The stock goes back on sale and any payment is refunded to the
        original method.
      </p>
      {error && <p className="text-sm text-clay">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelOrderAction(orderId);
              if (!res.ok) setError(res.message ?? 'Could not cancel.');
              else router.refresh();
            })
          }
          className="bg-clay px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="border border-line px-4 py-2 text-sm text-ink-2 hover:bg-bone-2"
        >
          Keep the order
        </button>
      </div>
    </div>
  );
}
