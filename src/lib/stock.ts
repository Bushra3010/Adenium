import type { Prisma } from '@/generated/prisma';
import { prisma } from './prisma';

/**
 * Availability = physical stock − live reservations held by unpaid orders.
 *
 * Reservations are created when an order enters PENDING_PAYMENT (CHK-07) and
 * released on payment success (converted to a real decrement, ORD-07), on
 * failure, or on expiry.
 */
export async function reservedQty(
  variantIds: string[],
  tx: Prisma.TransactionClient = prisma,
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const rows = await tx.stockReservation.groupBy({
    by: ['variantId'],
    where: { variantId: { in: variantIds }, expiresAt: { gt: new Date() } },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.variantId, r._sum.quantity ?? 0]));
}

export async function availableQty(
  variantId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<number> {
  const variant = await tx.variant.findUnique({
    where: { id: variantId },
    select: { stockQty: true },
  });
  if (!variant) return 0;
  const reserved = (await reservedQty([variantId], tx)).get(variantId) ?? 0;
  return Math.max(0, variant.stockQty - reserved);
}

/** Availability for many variants at once — used by cart and listing pages. */
export async function availableQtyMany(
  variantIds: string[],
  tx: Prisma.TransactionClient = prisma,
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const [variants, reserved] = await Promise.all([
    tx.variant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, stockQty: true },
    }),
    reservedQty(variantIds, tx),
  ]);
  return new Map(
    variants.map((v) => [v.id, Math.max(0, v.stockQty - (reserved.get(v.id) ?? 0))]),
  );
}

/** Deletes reservations whose hold has lapsed and fails their orders. */
export async function sweepExpiredReservations(): Promise<number> {
  const expired = await prisma.stockReservation.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { orderId: true },
    distinct: ['orderId'],
  });
  if (expired.length === 0) return 0;
  const orderIds = expired.map((e) => e.orderId);

  await prisma.$transaction([
    prisma.stockReservation.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.order.updateMany({
      where: { id: { in: orderIds }, status: 'PENDING_PAYMENT' },
      data: { status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' },
    }),
    prisma.orderEvent.createMany({
      data: orderIds.map((orderId) => ({
        orderId,
        status: 'PAYMENT_FAILED' as const,
        message: 'Payment not completed in time; stock released.',
        actor: 'system',
      })),
    }),
  ]);
  return orderIds.length;
}
