'use client';

import { useActionState } from 'react';
import { changePasswordAction, updateProfileAction } from '@/actions/profile';
import { Field } from './auth-form';
import type { FormState } from '@/actions/auth';

function Notice({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="border-l-2 border-clay bg-clay-2 px-3 py-2 text-sm text-clay">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="border-l-2 border-leaf bg-leaf-3 px-3 py-2 text-sm text-leaf">
        {state.success}
      </p>
    );
  }
  return null;
}

export function ProfileForms({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, {});
  const [pwState, pwAction, pwPending] = useActionState(changePasswordAction, {});

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={profileAction} className="space-y-4 border border-line bg-white p-6">
        <h3 className="font-display text-lg text-ink">Your details</h3>
        <Notice state={profileState} />

        <div>
          <label className="block text-sm font-medium text-ink-2">Email address</label>
          <p className="mt-1.5 border border-line bg-bone-2 px-3 py-2.5 text-sm text-ink-3">
            {email}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Contact us if you need to change the email on your account.
          </p>
        </div>

        <Field label="Full name" name="name" defaultValue={name} autoComplete="name" />
        <Field
          label="Mobile number"
          name="phone"
          type="tel"
          required={false}
          defaultValue={phone}
          inputMode="tel"
          autoComplete="tel"
          hint="Used for delivery updates."
        />

        <button
          type="submit"
          disabled={profilePending}
          className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
        >
          {profilePending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form action={pwAction} className="space-y-4 border border-line bg-white p-6">
        <h3 className="font-display text-lg text-ink">Change password</h3>
        <Notice state={pwState} />

        <Field label="Current password" name="current" type="password" autoComplete="current-password" />
        <Field
          label="New password"
          name="next"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
        />
        <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" />

        <button
          type="submit"
          disabled={pwPending}
          className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
        >
          {pwPending ? 'Updating…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
