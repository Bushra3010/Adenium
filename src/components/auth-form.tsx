'use client';

import { useActionState } from 'react';
import type { FormState } from '@/actions/auth';

export function AuthForm({
  action,
  submitLabel,
  children,
  footer,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="border-l-2 border-clay bg-clay-2 px-3 py-2 text-sm text-clay">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="border-l-2 border-leaf bg-leaf-3 px-3 py-2 text-sm text-leaf">
          {state.success}
        </p>
      )}

      {children}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-leaf px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-leaf-2 disabled:opacity-60"
      >
        {pending ? 'Please wait…' : submitLabel}
      </button>

      {footer}
    </form>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  required = true,
  autoComplete,
  hint,
  defaultValue,
  pattern,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  defaultValue?: string;
  pattern?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
}) {
  const id = `field-${name}`;
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
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        pattern={pattern}
        inputMode={inputMode}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-3">
          {hint}
        </p>
      )}
    </div>
  );
}
