import Link from 'next/link';
import { getCategoryTree } from '@/lib/catalog';
import { NewsletterForm } from './newsletter-form';

export async function SiteFooter() {
  const tree = await getCategoryTree();

  return (
    <footer className="mt-24 border-t border-line bg-bone-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl text-ink">Adenium</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-3">
            Desert roses, caudex plants and rare cacti — most of it raised from seed rather
            than imported.
          </p>
        </div>

        {tree.map((parent) => (
          <div key={parent.id}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
              {parent.name}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {parent.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/${parent.slug}/${child.slug}`}
                    className="text-ink-2 hover:text-leaf hover:underline"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
            Help
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/guides" className="text-ink-2 hover:text-leaf hover:underline">Growing guides</Link></li>
            <li><Link href="/track" className="text-ink-2 hover:text-leaf hover:underline">Track an order</Link></li>
            <li><Link href="/pages/shipping" className="text-ink-2 hover:text-leaf hover:underline">Shipping &amp; delivery</Link></li>
            <li><Link href="/pages/returns" className="text-ink-2 hover:text-leaf hover:underline">Returns &amp; refunds</Link></li>
            <li><Link href="/pages/contact" className="text-ink-2 hover:text-leaf hover:underline">Contact us</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Adenium. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/pages/privacy" className="hover:text-leaf hover:underline">Privacy</Link>
            <Link href="/pages/terms" className="hover:text-leaf hover:underline">Terms</Link>
            <Link href="/pages/about" className="hover:text-leaf hover:underline">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
