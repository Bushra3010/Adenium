'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('saving');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setState('done');
      setMessage(data.message ?? 'Thanks — you are on the list.');
    } else {
      setState('error');
      setMessage(data.error ?? 'That did not work. Try again.');
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-xl text-ink">Growing notes, once a month</h2>
        <p className="mt-1 text-sm text-ink-3">
          Sowing windows, care reminders and new arrivals. No noise.
        </p>
      </div>

      {state === 'done' ? (
        <p className="text-sm font-medium text-leaf">{message}</p>
      ) : (
        <form onSubmit={submit} className="flex w-full max-w-md gap-2">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-w-0 flex-1 border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
          />
          <button
            type="submit"
            disabled={state === 'saving'}
            className="bg-leaf px-4 py-2 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
          >
            {state === 'saving' ? 'Adding…' : 'Subscribe'}
          </button>
        </form>
      )}
      {state === 'error' && <p className="text-sm text-clay">{message}</p>}
    </div>
  );
}
