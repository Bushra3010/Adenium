import type { Metadata } from 'next';
import Link from 'next/link';
import { requestPasswordResetAction } from '@/actions/auth';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm, Field } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro="Enter your email address and we will send a link to set a new password."
    >
      <AuthForm
        action={requestPasswordResetAction}
        submitLabel="Send reset link"
        footer={
          <p className="text-center text-sm text-ink-3">
            <Link href="/login" className="text-leaf hover:underline">
              Back to sign in
            </Link>
          </p>
        }
      >
        <Field label="Email address" name="email" type="email" autoComplete="email" />
      </AuthForm>
    </AuthShell>
  );
}
