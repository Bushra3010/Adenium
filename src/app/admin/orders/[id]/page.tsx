import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { NEXT_STATUSES, statusBadge } from '@/lib/order-status';
import { PageHeading, Panel, Table, Badge } from '@/components/admin/ui';
import { OrderActions } from '@/components/admin/order-actions';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: PageProps<'/admin/orders/[id]'>) {
  const staff = await requireStaff();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'desc' } },
      user: { select: { id: true, name: true, email: true } },
      reservations: true,
    },
  });
  if (!order) notFound();

  const badge = statusBadge(order.status);

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-leaf hover:underline">
        ← All orders
      </Link>

      <PageHeading
        title={order.orderNumber}
        description={`Placed ${order.createdAt.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}`}
        action={
          <div className="flex items-center gap-2">
            <Badge className={badge.className}>{badge.label}</Badge>
            <Badge
              className={
                order.paymentStatus === 'PAID' ? 'bg-leaf-3 text-leaf' : 'bg-bone-3 text-ink-3'
              }
            >
              {order.paymentStatus}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Items">
            <Table head={['Product', 'Variant', 'SKU', 'Unit', 'Qty', 'Total']}>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2.5">
                    <Link href={`/product/${item.productSlug}`} className="text-ink hover:text-leaf">
                      {item.productName}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-ink-3">{item.variantLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-3">{item.sku}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-2">{formatINR(item.unitPrice)}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-2">{item.quantity}</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink">{formatINR(item.lineTotal)}</td>
                </tr>
              ))}
            </Table>

            <dl className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-3">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-leaf">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                  <dd className="tabular-nums">−{formatINR(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-3">Shipping</dt>
                <dd className="tabular-nums">
                  {Number(order.shippingTotal) === 0 ? 'Free' : formatINR(order.shippingTotal)}
                </dd>
              </div>
              {Number(order.taxTotal) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-3">Tax</dt>
                  <dd className="tabular-nums">{formatINR(order.taxTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-1.5 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(order.grandTotal)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="History">
            <ol className="space-y-4">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-leaf" aria-hidden="true" />
                  <div>
                    <p className="text-ink">{e.message}</p>
                    <p className="text-xs text-ink-3">
                      {e.createdAt.toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      · {e.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Update">
            <OrderActions
              orderId={order.id}
              status={order.status}
              allowed={NEXT_STATUSES[order.status]}
              courierName={order.courierName}
              awbNumber={order.awbNumber}
              adminNote={order.adminNote}
              paymentStatus={order.paymentStatus}
              isAdmin={staff.role === 'ADMIN'}
            />
          </Panel>

          <Panel title="Customer">
            <div className="space-y-3 text-sm">
              <p className="text-ink">{order.shipFullName}</p>
              <p>
                <a href={`mailto:${order.email}`} className="text-leaf hover:underline">
                  {order.email}
                </a>
              </p>
              <p>
                <a href={`tel:${order.phone}`} className="text-ink-2 hover:text-leaf">
                  {order.phone}
                </a>
              </p>
              {order.user ? (
                <p className="text-xs text-ink-3">
                  Registered customer ·{' '}
                  <Link href={`/admin/customers?q=${order.user.email}`} className="text-leaf hover:underline">
                    view
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-ink-3">Guest checkout</p>
              )}
            </div>

            <address className="mt-4 border-t border-line pt-4 text-sm not-italic leading-relaxed text-ink-2">
              {order.shipLine1}
              {order.shipLine2 && (
                <>
                  <br />
                  {order.shipLine2}
                </>
              )}
              {order.shipLandmark && (
                <>
                  <br />
                  {order.shipLandmark}
                </>
              )}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPincode}
            </address>

            {order.customerNote && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-xs uppercase tracking-wide text-ink-3">Delivery note</p>
                <p className="mt-1 text-sm text-ink-2">{order.customerNote}</p>
              </div>
            )}
          </Panel>

          <Panel title="Payment">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-3">Gateway order</dt>
                <dd className="font-mono text-xs break-all text-ink-2">
                  {order.gatewayOrderId ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-3">Payment reference</dt>
                <dd className="font-mono text-xs break-all text-ink-2">
                  {order.gatewayPaymentId ?? '—'}
                </dd>
              </div>
              {order.paidAt && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-3">Paid at</dt>
                  <dd className="text-ink-2">
                    {order.paidAt.toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </dd>
                </div>
              )}
              {order.reservations.length > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-3">Stock held until</dt>
                  <dd className="text-sun">
                    {order.reservations[0].expiresAt.toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
