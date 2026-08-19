import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { registerAction } from '@/actions/auth';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm, Field } from '@/components/auth-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Create an account', robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: PageProps<'/register'>) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : '';
  if (user) redirect(next || '/account');

  return (
    <AuthShell
      title="Create an account"
      intro="Keeps your order history, addresses and wishlist in one place."
    >
      <AuthForm
        action={registerAction}
        submitLabel="Create account"
        footer={
          <p className="text-center text-sm text-ink-3">
            Already have an account?{' '}
            <Link href="/login" className="text-leaf hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <input type="hidden" name="next" value={next} />
        <Field label="Full name" name="name" autoComplete="name" />
        <Field label="Email address" name="email" type="email" autoComplete="email" />
        <Field
          label="Mobile number"
          name="phone"
          type="tel"
          required={false}
          inputMode="tel"
          autoComplete="tel"
          hint="For delivery updates. 10 digits, no country code."
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
        />
      </AuthForm>
    </AuthShell>
  );
}
