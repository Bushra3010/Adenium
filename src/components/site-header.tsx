import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryTree } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { cartItemCount } from '@/lib/cart';
import { safely } from '@/lib/db-status';
import { getSettings } from '@/lib/settings';
import { formatINR } from '@/lib/money';
import { SearchBox } from './search-box';
import { BadgeCheck, Heart, LogoMark, Search, Sprout, Trolley, User } from './icons';

export async function SiteHeader() {
  const [tree, user, count, settings] = await Promise.all([
    safely(() => getCategoryTree(), [], 'header categories'),
    safely(() => getCurrentUser(), null, 'header session'),
    safely(() => cartItemCount(), 0, 'header cart count'),
    safely(() => getSettings(), null, 'header settings'),
  ]);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const threshold = settings?.freeShippingThreshold ?? 0;
  const notice = (
    <>
      {threshold > 0 && <>Free shipping on orders above {formatINR(threshold)} &nbsp;•&nbsp; </>}
      Plants dispatched Mon–Wed
    </>
  );

  const cartBadge =
    count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-leaf px-1 text-[10px] font-semibold text-white">
        {count}
      </span>
    ) : null;

  return (
    <header className="sticky top-0 z-40 bg-bone">
      {/* Desktop announcement rail */}
      <p className="hidden items-center justify-center gap-2 bg-leaf px-5 py-2.5 text-center text-[13px] font-medium text-white lg:flex">
        <Sprout size={16} className="shrink-0 text-white/80" />
        <span>{notice}</span>
      </p>

      <div className="border-b border-line bg-bone/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5 lg:py-3.5 xl:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="font-display text-[23px] leading-none tracking-tight text-leaf sm:text-[28px]">
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

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-4 lg:gap-0">
            {/* Phones reach search through the field below, so this is a jump link. */}
            <a
              href="#site-search"
              className="rounded-full p-2 text-ink-2 transition-colors hover:bg-leaf-3 hover:text-leaf lg:hidden"
              aria-label="Search"
            >
              <Search size={21} />
            </a>

            <Link
              href={user ? '/account/wishlist' : '/login?next=/account/wishlist'}
              className="rounded-full p-2 text-ink-2 transition-colors hover:bg-leaf-3 hover:text-leaf sm:p-2.5"
              aria-label="Wishlist"
            >
              <Heart size={21} />
            </Link>

            <Link
              href={user ? '/account' : '/login'}
              className="hidden rounded-full p-2 text-ink-2 transition-colors hover:bg-leaf-3 hover:text-leaf sm:p-2.5 lg:block"
              aria-label={user ? 'Your account' : 'Sign in'}
            >
              <User size={20} />
            </Link>

            <Link
              href="/cart"
              className="relative rounded-full p-2 text-ink-2 transition-colors hover:text-leaf lg:ml-1 lg:border lg:border-line lg:bg-white lg:p-2.5 lg:hover:border-leaf"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <Trolley size={22} className="lg:hidden" />
              <span className="hidden lg:block">
                <Trolley size={20} />
              </span>
              {cartBadge}
            </Link>

            {isStaff && (
              <Link
                href="/admin"
                className="ml-2 hidden rounded-full border border-leaf px-4 py-2 text-xs font-medium text-leaf transition-colors hover:bg-leaf hover:text-white lg:block"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Phone: full-width search, then the shipping notice as a card */}
        <div className="space-y-2.5 px-4 pb-3 lg:hidden">
          <Suspense fallback={<div className="h-12 w-full rounded-xl border border-line bg-white" />}>
            <SearchBox mobile />
          </Suspense>

          <p className="flex items-center justify-center gap-2 rounded-xl bg-leaf-3/70 px-3 py-2.5 text-center text-[12.5px] font-medium text-leaf">
            <BadgeCheck size={16} className="shrink-0" />
            <span>{notice}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
