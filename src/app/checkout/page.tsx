import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { resolveCart } from '@/lib/cart';
import { gatewayConfigured, simulationEnabled } from '@/lib/razorpay';
import { formatINR } from '@/lib/money';
import { CheckoutForm } from '@/components/checkout-form';
import { OrderSummary } from '@/components/order-summary';
import { Breadcrumbs } from '@/components/breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cart = await resolveCart();
  if (cart.lines.length === 0) redirect('/cart');

  const user = await getCurrentUser();
  const addresses = user
    ? await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {gatewayConfigured && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}

      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]}
      />
      <h1 className="mt-6 font-display text-4xl text-ink">Checkout</h1>

      {!user && (
        <p className="mt-4 border border-line bg-white px-4 py-3 text-sm text-ink-2">
          Checking out as a guest.{' '}
          <Link href="/login?next=/checkout" className="font-medium text-leaf hover:underline">
            Sign in
          </Link>{' '}
          to use a saved address and keep this order in your history.
        </p>
      )}

      {cart.notices.length > 0 && (
        <div className="mt-4 border-l-2 border-sun bg-sun-2 px-4 py-3">
          <p className="text-sm font-medium text-sun">Your cart changed</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-2">
            {cart.notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <Link href="/cart" className="mt-2 inline-block text-sm font-medium text-sun underline">
            Review your cart
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          addresses={addresses}
          signedIn={Boolean(user)}
          defaultEmail={user?.email ?? ''}
          simulated={simulationEnabled}
        />

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="border border-line bg-white p-6">
            <h2 className="font-display text-xl text-ink">Your order</h2>

            <ul className="mt-4 divide-y divide-line border-y border-line">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.image}
                    alt=""
                    className="h-14 w-14 shrink-0 border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate text-ink">{line.productName}</p>
                    <p className="text-xs text-ink-3">
                      {line.variantLabel} · Qty {line.quantity}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-ink-2">
                    {formatINR(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <OrderSummary totals={cart.totals} />
            </div>

            <Link
              href="/cart"
              className="mt-5 inline-block text-sm font-medium text-leaf hover:underline"
            >
              ← Edit cart
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
