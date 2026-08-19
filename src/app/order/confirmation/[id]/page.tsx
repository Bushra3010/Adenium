import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatINR } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: PageProps<'/order/confirmation/[id]'>) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  const user = await getCurrentUser();
  const isOwner = order.userId ? order.userId === user?.id : true;
  if (order.userId && !isOwner) notFound();

  const paid = order.paymentStatus === 'PAID';
  const hasPlants = order.items.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="border border-line bg-white p-8 sm:p-12">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
            paid ? 'bg-leaf-3 text-leaf' : 'bg-sun-2 text-sun'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {paid ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 8v5M12 17h.01" />}
          </svg>
        </div>

        <h1 className="mt-6 font-display text-3xl text-ink">
          {paid ? 'Thank you — your order is confirmed' : 'Your order is awaiting payment'}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-2">
          {paid ? (
            <>
              Order <span className="font-medium text-ink">{order.orderNumber}</span> is with us.
              A receipt is on its way to {order.email}.
            </>
          ) : (
            <>
              We have not received payment for {order.orderNumber} yet. If money left your
              account, it will either complete shortly or be returned automatically.
            </>
          )}
        </p>

        <dl className="mt-8 grid gap-4 border-y border-line py-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-3">Order number</dt>
            <dd className="mt-1 font-medium text-ink">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-3">Total</dt>
            <dd className="mt-1 font-medium tabular-nums text-ink">{formatINR(order.grandTotal)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-3">Delivering to</dt>
            <dd className="mt-1 text-sm text-ink-2">
              {order.shipCity}, {order.shipState} {order.shipPincode}
            </dd>
          </div>
        </dl>

        <ul className="mt-6 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl ?? '/img/ph/default.svg'}
                alt=""
                className="h-12 w-12 border border-line object-cover"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-ink">{item.productName}</p>
                <p className="text-xs text-ink-3">
                  {item.variantLabel} · Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm tabular-nums text-ink-2">{formatINR(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        {paid && hasPlants && (
          <div className="mt-8 border-l-2 border-leaf bg-leaf-3 px-4 py-3">
            <p className="text-sm text-leaf">
              We will email you again with a tracking number the moment your order leaves us.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {order.userId ? (
            <Link
              href={`/account/orders/${order.id}`}
              className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
            >
              Track this order
            </Link>
          ) : (
            <Link
              href="/track"
              className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
            >
              Track this order
            </Link>
          )}
          <Link
            href="/guides"
            className="border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            Read the growing guides
          </Link>
        </div>
      </div>
    </div>
  );
}
