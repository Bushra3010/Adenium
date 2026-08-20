'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid, Heart, Home, Leaf, User } from './icons';

const TABS = [
  { href: '/', label: 'Home', Icon: Home, match: (p: string) => p === '/' },
  { href: '/search', label: 'Shop', Icon: Grid, match: (p: string) => p.startsWith('/search') },
  {
    href: '/plants',
    label: 'Categories',
    Icon: Leaf,
    match: (p: string) => p.startsWith('/plants') || p.startsWith('/seeds'),
  },
  {
    href: '/account/wishlist',
    label: 'Wishlist',
    Icon: Heart,
    match: (p: string) => p.startsWith('/account/wishlist'),
  },
  {
    href: '/account',
    label: 'Account',
    Icon: User,
    match: (p: string) => p.startsWith('/account') && !p.startsWith('/account/wishlist'),
  },
];

/**
 * App-style bottom navigation for phones. The header keeps only brand and
 * cart on small screens, so this is the primary way around the store there.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  // The admin console has its own navigation and is not a shopper surface.
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-colors ${
                  active ? 'text-leaf' : 'text-ink-3'
                }`}
              >
                <Icon size={21} strokeWidth={active ? 1.9 : 1.5} />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
