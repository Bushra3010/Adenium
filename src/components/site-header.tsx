import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryTree } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { cartItemCount } from '@/lib/cart';
import { safely } from '@/lib/db-status';
import { getSettings } from '@/lib/settings';
import { formatINR } from '@/lib/money';
import { SearchBox } from './search-box';
import { MobileNav } from './mobile-nav';
import { Bag, Heart, LogoMark, Sprout, User } from './icons';

export async function SiteHeader() {
  const [tree, user, count, settings] = await Promise.all([
    safely(() => getCategoryTree(), [], 'header categories'),
    safely(() => getCurrentUser(), null, 'header session'),
    safely(() => cartItemCount(), 0, 'header cart count'),
    safely(() => getSettings(), null, 'header settings'),
  ]);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const threshold = settings?.freeShippingThreshold ?? 0;

  return (
    <header className="sticky top-0 z-40">
      <p className="flex items-center justify-center gap-2 bg-leaf px-5 py-2.5 text-center text-[13px] font-medium text-white">
        <Sprout size={16} className="hidden shrink-0 text-white/80 sm:block" />
        <span>
          {threshold > 0 && <>Free shipping on orders above {formatINR(threshold)} &nbsp;•&nbsp; </>}
          Plants dispatched Mon–Wed
        </span>
      </p>

      <div className="border-b border-line bg-bone/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-5 py-3.5 xl:px-10">
          <MobileNav tree={tree} />

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark size={40} />
            <span className="font-display text-[28px] leading-none tracking-tight text-leaf">
              Adenium
            </span>
          </Link>

          <nav aria-label="Main" className="ml-6 hidden items-center gap-7 lg:flex">
            {tree.map((parent) => (
              <div key={parent.id} className="group relative">
                <Link
                  href={`/${parent.slug}`}
                  className="py-2 text-[15px] text-ink-2 transition-colors hover:text-leaf"
                >
                  {parent.name}
                </Link>
                <div className="invisible absolute left-0 top-full w-60 overflow-hidden rounded-xl border border-line bg-white opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="py-2">
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/${parent.slug}/${child.slug}`}
                          className="block px-4 py-2 text-sm text-ink-2 hover:bg-leaf-3 hover:text-leaf"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            <Link href="/guides" className="py-2 text-[15px] text-ink-2 hover:text-leaf">
              Guides
            </Link>
            <Link href="/pages/about" className="py-2 text-[15px] text-ink-2 hover:text-leaf">
              About Us
            </Link>
          </nav>

          <div className="ml-auto hidden min-w-0 flex-1 justify-end lg:flex">
            <Suspense
              fallback={<div className="h-11 w-full max-w-[420px] rounded-full border border-line bg-white" />}
            >
              <SearchBox />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:ml-4">
            <Link
              href={user ? '/account/wishlist' : '/login?next=/account/wishlist'}
              className="rounded-full p-2.5 text-ink-2 transition-colors hover:bg-leaf-3 hover:text-leaf"
              aria-label="Wishlist"
            >
              <Heart size={21} />
            </Link>

            <Link
              href={user ? '/account' : '/login'}
              className="rounded-full p-2.5 text-ink-2 transition-colors hover:bg-leaf-3 hover:text-leaf"
              aria-label={user ? 'Your account' : 'Sign in'}
            >
              <User size={21} />
            </Link>

            <Link
              href="/cart"
              className="relative rounded-full border border-line bg-white p-2.5 text-ink-2 transition-colors hover:border-leaf hover:text-leaf"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <Bag size={21} />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-leaf px-1 text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>

            {isStaff && (
              <Link
                href="/admin"
                className="ml-2 hidden rounded-full border border-leaf px-4 py-2 text-xs font-medium text-leaf transition-colors hover:bg-leaf hover:text-white sm:block"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-line px-5 py-2.5 lg:hidden">
          <Suspense fallback={<div className="h-11 w-full rounded-full border border-line bg-white" />}>
            <SearchBox />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
