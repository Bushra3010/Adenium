import 'server-only';
import type { OrderStatus, Prisma } from '@/generated/prisma';
import { prisma } from './prisma';
import { getSettings } from './settings';
import { availableQtyMany } from './stock';
import { computeTotals, type CartLine } from './cart';
import { evaluateCoupon } from './coupon';
import { round2 } from './money';

export type ShippingDetails = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  customerNote?: string | null;
};

export class OrderError extends Error {}

/**
 * ADN-100001 upward — short, human-quotable, and not a database id.
 * Derived from a count, so a concurrent insert can collide; the unique
 * constraint catches that and the caller retries.
 */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.order.count();
  return `ADN-${100001 + count}`;
}

/**
 * Creates a PENDING_PAYMENT order and reserves its stock (CHK-06, CHK-07).
 *
 * Pricing and coupon validation happen before the transaction opens: an
 * interactive transaction holds a pooled connection, and issuing unrelated
 * queries from inside it risks starving the pool and timing out. The
 * transaction does only what must be atomic — re-read availability, then write
 * the order, its items and its stock reservations — so two shoppers cannot both
 * claim the last plant.
 *
 * Totals are computed here from catalog prices; nothing from the browser is
 * trusted (PRD §9).
 */
export async function createOrderFromCart(input: {
  cartId: string;
  userId: string | null;
  lines: CartLine[];
  shipping: ShippingDetails;
  couponCode: string | null;
}) {
  if (input.lines.length === 0) throw new OrderError('Your cart is empty.');

  const settings = await getSettings();
  const expiresAt = new Date(Date.now() + settings.reservationMinutes * 60_000);

  const totals = await computeTotals(input.lines, input.couponCode);
  const coupon = input.couponCode
    ? await evaluateCoupon(
        input.couponCode,
        input.lines,
        totals.subtotal,
        input.userId,
        input.shipping.email,
      )
    : null;

  if (input.couponCode && !coupon?.valid) {
    throw new OrderError(coupon?.reason ?? 'That discount code can no longer be used.');
  }

  const orderData = {
    userId: input.userId,
    email: input.shipping.email.toLowerCase(),
    phone: input.shipping.phone,
    status: 'PENDING_PAYMENT' as const,
    paymentStatus: 'PENDING' as const,
    shipFullName: input.shipping.fullName,
    shipPhone: input.shipping.phone,
    shipLine1: input.shipping.line1,
    shipLine2: input.shipping.line2 ?? null,
    shipLandmark: input.shipping.landmark ?? null,
    shipCity: input.shipping.city,
    shipState: input.shipping.state,
    shipPincode: input.shipping.pincode,
    customerNote: input.shipping.customerNote ?? null,
    subtotal: totals.subtotal,
    discountTotal: totals.discount,
    shippingTotal: totals.shipping,
    taxTotal: totals.tax,
    grandTotal: totals.total,
    couponId: coupon?.valid ? coupon.couponId : null,
    couponCode: coupon?.valid ? input.couponCode?.toUpperCase() : null,
    items: {
      create: input.lines.map((line) => ({
        variantId: line.variantId,
        productId: line.productId,
        productName: line.productName,
        productSlug: line.productSlug,
        variantLabel: line.variantLabel,
        sku: line.sku,
        imageUrl: line.image,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: round2(line.unitPrice * line.quantity),
      })),
    },
    reservations: {
      create: input.lines.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
        expiresAt,
      })),
    },
    events: {
      create: {
        status: 'PENDING_PAYMENT' as const,
        message: 'Order created. Stock held while payment completes.',
        actor: 'system',
      },
    },
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const availability = await availableQtyMany(
          input.lines.map((l) => l.variantId),
          tx,
        );
        for (const line of input.lines) {
          const available = availability.get(line.variantId) ?? 0;
          if (available < line.quantity) {
            throw new OrderError(
              available === 0
                ? `${line.productName} sold out while you were checking out.`
                : `Only ${available} of ${line.productName} left — adjust your cart and try again.`,
            );
          }
        }

        return tx.order.create({
          data: { ...orderData, orderNumber: await nextOrderNumber(tx) },
          include: { items: true },
        });
      });
    } catch (error) {
      const collided =
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === 'P2002';
      if (!collided || attempt === 4) throw error;
      // Another order took that number; try the next one.
    }
  }
  throw new OrderError('Could not create your order. Please try again.');
}

/**
 * Marks an order paid: converts reservations into a real stock decrement
 * (ORD-07), records the coupon redemption, and logs the transition.
 * Idempotent — a repeated webhook delivery is a no-op (PAY-03).
 */
export async function confirmOrderPaid(input: {
  orderId: string;
  gatewayPaymentId?: string | null;
  gatewaySignature?: string | null;
}): Promise<{ alreadyConfirmed: boolean }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, reservations: true },
    });
    if (!order) throw new OrderError('Order not found.');

    if (order.paymentStatus === 'PAID') return { alreadyConfirmed: true };

    for (const item of order.items) {
      if (!item.variantId) continue;
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    await tx.stockReservation.deleteMany({ where: { orderId: order.id } });

    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { timesUsed: { increment: 1 } },
      });
      await tx.couponRedemption.upsert({
        where: { orderId: order.id },
        create: {
          couponId: order.couponId,
          orderId: order.id,
          userId: order.userId,
          email: order.email,
        },
        update: {},
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        gatewayPaymentId: input.gatewayPaymentId ?? order.gatewayPaymentId,
        gatewaySignature: input.gatewaySignature ?? order.gatewaySignature,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        message: 'Payment received. Your order is confirmed.',
        actor: 'system',
      },
    });

    // The cart has served its purpose once the order is paid.
    if (order.userId) {
      await tx.cart.deleteMany({ where: { userId: order.userId } });
    }

    return { alreadyConfirmed: false };
  });
}

export async function failOrder(orderId: string, reason: string): Promise<void> {
  await prisma.$transaction([
    prisma.stockReservation.deleteMany({ where: { orderId } }),
    prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: 'PAID' } },
      data: { status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' },
    }),
    prisma.orderEvent.create({
      data: { orderId, status: 'PAYMENT_FAILED', message: reason, actor: 'system' },
    }),
  ]);
}

/** Operator-driven transition with an audit entry (ORD-02). */
export async function transitionOrder(input: {
  orderId: string;
  status: OrderStatus;
  actor: string;
  message?: string;
  courierName?: string | null;
  awbNumber?: string | null;
}): Promise<void> {
  const data: Prisma.OrderUpdateInput = { status: input.status };

  if (input.status === 'SHIPPED') {
    data.shippedAt = new Date();
    if (input.courierName) data.courierName = input.courierName;
    if (input.awbNumber) data.awbNumber = input.awbNumber;
  }
  if (input.status === 'DELIVERED') data.deliveredAt = new Date();
  if (input.status === 'CANCELLED') data.cancelledAt = new Date();
  if (input.status === 'REFUNDED') data.paymentStatus = 'REFUNDED';

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order) throw new OrderError('Order not found.');

    // Cancelling or refunding a paid order returns its stock to sale.
    if (
      (input.status === 'CANCELLED' || input.status === 'REFUNDED') &&
      order.paymentStatus === 'PAID'
    ) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
    }
    if (input.status === 'CANCELLED') {
      await tx.stockReservation.deleteMany({ where: { orderId: order.id } });
    }

    await tx.order.update({ where: { id: order.id }, data });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: input.status,
        message: input.message ?? defaultMessage(input.status, input.courierName, input.awbNumber),
        actor: input.actor,
      },
    });
  });
}

function defaultMessage(
  status: OrderStatus,
  courier?: string | null,
  awb?: string | null,
): string {
  switch (status) {
    case 'PACKED':
      return 'Your order has been packed and is ready to leave us.';
    case 'SHIPPED':
      return courier && awb
        ? `Despatched with ${courier}. Tracking number ${awb}.`
        : 'Your order has been despatched.';
    case 'DELIVERED':
      return 'Delivered. We hope it arrived in good shape.';
    case 'CANCELLED':
      return 'Order cancelled and stock returned to sale.';
    case 'REFUNDED':
      return 'Refund issued to the original payment method.';
    default:
      return 'Order updated.';
  }
}
