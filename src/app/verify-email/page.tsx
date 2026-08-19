import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyEmailAction } from '@/actions/auth';
import { AuthShell } from '@/components/auth-shell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({ searchParams }: PageProps<'/verify-email'>) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : '';
  const ok = token ? await verifyEmailAction(token) : false;

  return (
    <AuthShell title={ok ? 'Email confirmed' : 'That link did not work'}>
      <p className="text-sm leading-relaxed text-ink-2">
        {ok
          ? 'Thanks — your email address is confirmed. Order updates will reach you.'
          : 'The link has already been used or has expired. Sign in and we can send another.'}
      </p>
      <Link
        href="/login?verified=1"
        className="mt-6 inline-block bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
      >
        Continue to sign in
      </Link>
    </AuthShell>
  );
}
