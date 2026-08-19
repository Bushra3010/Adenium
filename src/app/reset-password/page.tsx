import type { Metadata } from 'next';
import Link from 'next/link';
import { resetPasswordAction } from '@/actions/auth';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm, Field } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : '';

  if (!token) {
    return (
      <AuthShell title="Link not valid">
        <p className="text-sm text-ink-2">
          That reset link is missing or incomplete.{' '}
          <Link href="/forgot-password" className="text-leaf hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <AuthForm action={resetPasswordAction} submitLabel="Save new password">
        <input type="hidden" name="token" value={token} />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
        />
        <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" />
      </AuthForm>
    </AuthShell>
  );
}
