'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStockAction } from '@/actions/admin-catalog';

/** ADM-03 — inline stock edit, saved on blur or Enter. */
export function StockInput({ variantId, value }: { variantId: string; value: number }) {
  const [draft, setDraft] = useState(String(value));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const router = useRouter();

  function commit() {
    const next = Number(draft);
    if (next === value) return;
    startTransition(async () => {
      const res = await updateStockAction(variantId, next);
      if (!res.ok) {
        setError(true);
        setDraft(String(value));
      } else {
        setError(false);
        router.refresh();
      }
    });
  }

  return (
    <input
      type="number"
      min={0}
      value={draft}
      disabled={pending}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      aria-label="Stock quantity"
      className={`w-20 border px-2 py-1 text-sm tabular-nums focus:outline-none ${
        error ? 'border-clay' : 'border-line focus:border-leaf'
      } ${pending ? 'opacity-50' : ''}`}
    />
  );
}
