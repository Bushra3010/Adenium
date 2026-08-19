import type { Metadata } from 'next';
import Link from 'next/link';
import { resolveCart } from '@/lib/cart';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CartLineRow } from '@/components/cart-line';
import { CouponBox } from '@/components/coupon-box';
import { OrderSummary } from '@/components/order-summary';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await resolveCart();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
      <h1 className="mt-6 font-display text-4xl text-ink">Your cart</h1>

      {/* CART-04 — say plainly what changed and why. */}
      {cart.notices.length > 0 && (
        <div className="mt-6 border-l-2 border-sun bg-sun-2 px-4 py-3">
          <p className="text-sm font-medium text-sun">Your cart was updated</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-2">
            {cart.notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {cart.lines.length === 0 ? (
        <div className="mt-10 border border-line bg-white p-12 text-center">
          <h2 className="font-display text-2xl text-ink">Nothing in the cart yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-3">
            Start with seed if you want to grow it yourself, or a plant if you would rather
            skip the first two seasons.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/seeds" className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2">
              Shop seeds
            </Link>
            <Link href="/plants" className="border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white">
              Shop plants
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <section aria-label="Cart items">
            <ul className="divide-y divide-line border-y border-line">
              {cart.lines.map((line) => (
                <CartLineRow key={line.id} line={line} />
              ))}
            </ul>
            <Link
              href="/search"
              className="mt-6 inline-block text-sm font-medium text-leaf hover:underline"
            >
              ← Continue shopping
            </Link>
          </section>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="border border-line bg-white p-6">
              <h2 className="font-display text-xl text-ink">Order summary</h2>

              <div className="mt-5">
                <CouponBox appliedCode={cart.totals.couponCode} />
              </div>
              {cart.totals.couponMessage && (
                <p className="mt-2 text-sm text-clay">{cart.totals.couponMessage}</p>
              )}

              <div className="mt-6">
                <OrderSummary totals={cart.totals} />
              </div>

              <Link
                href="/checkout"
                className="mt-6 block bg-leaf px-6 py-3.5 text-center text-sm font-medium text-white transition-colors hover:bg-leaf-2"
              >
                Proceed to checkout
              </Link>

              <p className="mt-3 text-center text-xs text-ink-3">
                Shipping is calculated from the items in your cart.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
