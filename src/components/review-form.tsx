'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { submitReview } from '@/actions/review';

/** REV-01 — submitted by registered customers, held for moderation (REV-02). */
export function ReviewForm({ productId, signedIn }: { productId: string; signedIn: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!signedIn) {
    return (
      <div className="border border-line bg-bone-2 p-6">
        <h3 className="font-display text-xl text-ink">Grown this one?</h3>
        <p className="mt-1.5 text-sm text-ink-3">
          Reviews come from signed-in customers, so people know who they are reading.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
        >
          Sign in to write a review
        </Link>
      </div>
    );
  }

  if (result?.ok) {
    return (
      <div className="border border-leaf bg-leaf-3 p-6">
        <p className="font-medium text-leaf">{result.message}</p>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setResult({ ok: false, message: 'Choose a star rating first.' });
      return;
    }
    startTransition(async () => {
      const res = await submitReview({ productId, rating, title, body });
      setResult({ ok: res.ok, message: res.message ?? '' });
    });
  }

  return (
    <form onSubmit={submit} className="border border-line bg-white p-6">
      <h3 className="font-display text-xl text-ink">Write a review</h3>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink-2">Your rating</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              aria-pressed={rating === n}
              className="p-0.5 text-sun"
            >
              <svg width="26" height="26" viewBox="0 0 20 20" fill={(hover || rating) >= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.1">
                <path d="M10 1.6l2.5 5.1 5.6.8-4 3.9 1 5.6L10 14.4 4.9 17l1-5.6-4-3.9 5.6-.8z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="review-title" className="block text-sm font-medium text-ink-2">
          Headline <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <input
          id="review-title"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="review-body" className="block text-sm font-medium text-ink-2">
          Your review
        </label>
        <textarea
          id="review-body"
          required
          rows={5}
          minLength={10}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="How did it germinate? How is it growing now?"
          className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
      </div>

      {result && !result.ok && <p className="mt-3 text-sm text-clay">{result.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Submit review'}
      </button>
      <p className="mt-3 text-xs text-ink-3">
        Reviews are checked before they appear, usually within a working day.
      </p>
    </form>
  );
}
