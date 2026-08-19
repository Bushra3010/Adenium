import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/import', label: 'Bulk import' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/settings', label: 'Settings', adminOnly: true },
];

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const user = await getCurrentUser();

  // AUTH-05 — every admin route is authorised on the server.
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') redirect('/');

  const links = NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-bone-2">
      <div className="mx-auto max-w-[1400px] px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-baseline gap-3">
            <Link href="/admin" className="font-display text-2xl text-ink">
              Adenium
            </Link>
            <span className="border border-line px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-3">
              {user.role === 'ADMIN' ? 'Admin' : 'Staff'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-ink-2 hover:text-leaf">
              View storefront →
            </Link>
            <span className="text-ink-3">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-clay hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="mt-6 grid gap-8 lg:grid-cols-[180px_1fr]">
          <nav aria-label="Admin" className="lg:sticky lg:top-6 lg:self-start">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block whitespace-nowrap border-l-2 border-transparent px-3 py-2 text-sm text-ink-2 hover:border-leaf hover:bg-bone hover:text-leaf"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* The root layout already provides the page's <main> landmark. */}
          <div className="min-w-0 pb-16">{children}</div>
        </div>
      </div>
    </div>
  );
}
