'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { applyCoupon, removeCoupon } from '@/actions/cart';

/** CART-05 / CPN-04. */
export function CouponBox({ appliedCode }: { appliedCode: string | null }) {
  const [code, setCode] = useState('');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    startTransition(async () => {
      const res = await applyCoupon(code);
      setMessage({ ok: res.ok, text: res.message ?? '' });
      if (res.ok) setCode('');
      router.refresh();
    });
  }

  function clear() {
    startTransition(async () => {
      await removeCoupon();
      setMessage(null);
      router.refresh();
    });
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 border border-leaf bg-leaf-3 px-3 py-2.5">
        <p className="text-sm text-leaf">
          Code <span className="font-semibold">{appliedCode}</span> applied
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="text-sm text-leaf underline hover:no-underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">
          Discount code
        </label>
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Discount code"
          className="min-w-0 flex-1 border border-line bg-white px-3 py-2 text-sm uppercase focus:border-leaf focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Apply'}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-sm ${message.ok ? 'text-leaf' : 'text-clay'}`}>{message.text}</p>
      )}
    </div>
  );
}
