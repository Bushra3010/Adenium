'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Heart } from './icons';

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
      className={`relative z-10 inline-flex items-center gap-2 rounded-full border border-line bg-white/95 p-2.5 shadow-sm backdrop-blur transition-colors hover:border-clay ${
        withLabel ? 'px-4 py-2.5 text-sm' : ''
      } ${on ? 'text-clay' : 'text-ink-3'}`}
    >
      <Heart size={17} filled={on} />
      {withLabel && <span>{on ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
