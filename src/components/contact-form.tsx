'use client';

import { useState } from 'react';

/** CMS-02. */
export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setState('sent');
      setMessage(data.message ?? 'Thanks — we will reply within a working day.');
    } else {
      setState('error');
      setMessage(data.error ?? 'That did not send. Try again in a moment.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="border-l-2 border-leaf bg-leaf-3 px-5 py-4">
        <p className="font-medium text-leaf">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-display text-2xl text-ink">Send us a message</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" />
        <Field label="Email address" name="email" type="email" />
        <Field label="Phone" name="phone" required={false} inputMode="tel" />
        <Field label="Subject" name="subject" required={false} />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-ink-2">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          minLength={10}
          maxLength={2000}
          className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
        />
      </div>

      {state === 'error' && <p className="text-sm text-clay">{message}</p>}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="bg-leaf px-6 py-3 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = true,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  inputMode?: 'text' | 'tel';
}) {
  const id = `contact-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label}
        {!required && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        inputMode={inputMode}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
      />
    </div>
  );
}
