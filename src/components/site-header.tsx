import Link from 'next/link';
import { getCategoryTree } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth';
import { cartItemCount } from '@/lib/cart';
import { SearchBox } from './search-box';
import { MobileNav } from './mobile-nav';

export async function SiteHeader() {
  const [tree, user, count] = await Promise.all([
    getCategoryTree(),
    getCurrentUser(),
    cartItemCount(),
  ]);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bone/95 backdrop-blur">
      <p className="bg-leaf px-5 py-2 text-center text-xs tracking-wide text-white">
        Free shipping on orders above ₹1,200 · Plants despatched Mon–Wed
      </p>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4">
        <MobileNav tree={tree} />

        <Link href="/" className="font-display text-2xl leading-none text-ink">
          Adenium
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-7 lg:flex">
          {tree.map((parent) => (
            <div key={parent.id} className="group relative">
              <Link
                href={`/${parent.slug}`}
                className="py-2 text-sm font-medium text-ink-2 transition-colors hover:text-leaf"
              >
                {parent.name}
              </Link>
              <div className="invisible absolute left-0 top-full w-60 border border-line bg-bone opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
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
          <Link href="/guides" className="py-2 text-sm font-medium text-ink-2 hover:text-leaf">
            Guides
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <div className="hidden md:block">
            <SearchBox />
          </div>

          <Link
            href={user ? '/account/wishlist' : '/login?next=/account/wishlist'}
            className="rounded p-2 text-ink-2 hover:bg-bone-2 hover:text-leaf"
            aria-label="Wishlist"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </Link>

          <Link
            href={user ? '/account' : '/login'}
            className="rounded p-2 text-ink-2 hover:bg-bone-2 hover:text-leaf"
            aria-label={user ? 'Your account' : 'Sign in'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          <Link
            href="/cart"
            className="relative rounded p-2 text-ink-2 hover:bg-bone-2 hover:text-leaf"
            aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          {isStaff && (
            <Link
              href="/admin"
              className="ml-1 hidden rounded border border-leaf px-3 py-1.5 text-xs font-medium text-leaf hover:bg-leaf hover:text-white sm:block"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-line px-5 py-2 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
