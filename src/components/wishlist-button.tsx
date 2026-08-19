'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

/** PDP-09 / ACC-05. Guests are sent to sign-in rather than silently failing. */
export function WishlistButton({
  productId,
  initiallyWishlisted,
  signedIn,
  withLabel = false,
}: {
  productId: string;
  initiallyWishlisted: boolean;
  signedIn: boolean;
  withLabel?: boolean;
}) {
  const [on, setOn] = useState(initiallyWishlisted);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await fetch('/api/wishlist', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) setOn(!next);
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`relative z-10 inline-flex items-center gap-2 border border-line bg-white/90 p-2 backdrop-blur transition-colors hover:border-clay ${
        withLabel ? 'px-3 py-2 text-sm' : ''
      } ${on ? 'text-clay' : 'text-ink-3'}`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {withLabel && <span>{on ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
