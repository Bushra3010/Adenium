import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { loginAction } from '@/actions/auth';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm, Field } from '@/components/auth-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : '';
  if (user) redirect(next || '/account');

  return (
    <AuthShell title="Sign in" intro="Order history, saved addresses and your wishlist.">
      {sp.reset === '1' && (
        <p className="mb-4 border-l-2 border-leaf bg-leaf-3 px-3 py-2 text-sm text-leaf">
          Password updated. Sign in with your new password.
        </p>
      )}
      {sp.verified === '1' && (
        <p className="mb-4 border-l-2 border-leaf bg-leaf-3 px-3 py-2 text-sm text-leaf">
          Email confirmed. Thanks.
        </p>
      )}

      <AuthForm
        action={loginAction}
        submitLabel="Sign in"
        footer={
          <div className="space-y-2 text-center text-sm">
            <p>
              <Link href="/forgot-password" className="text-leaf hover:underline">
                Forgotten your password?
              </Link>
            </p>
            <p className="text-ink-3">
              New here?{' '}
              <Link
                href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}
                className="text-leaf hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        }
      >
        <input type="hidden" name="next" value={next} />
        <Field label="Email address" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
      </AuthForm>
    </AuthShell>
  );
}
