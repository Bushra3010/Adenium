import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';

const LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/reviews', label: 'My reviews' },
  { href: '/account/profile', label: 'Profile' },
];

export default async function AccountLayout({ children }: LayoutProps<'/account'>) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account');

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="border-b border-line pb-6">
        <h1 className="font-display text-4xl text-ink">Your account</h1>
        <p className="mt-1.5 text-sm text-ink-3">
          Signed in as {user.name} · {user.email}
          {!user.emailVerified && (
            <span className="ml-2 bg-sun-2 px-2 py-0.5 text-xs text-sun">Email not confirmed</span>
          )}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Account" className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block whitespace-nowrap border-l-2 border-transparent px-3 py-2 text-sm text-ink-2 hover:border-leaf hover:bg-bone-2 hover:text-leaf"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="lg:mt-4 lg:border-t lg:border-line lg:pt-3">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full whitespace-nowrap px-3 py-2 text-left text-sm text-clay hover:underline"
                >
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}
