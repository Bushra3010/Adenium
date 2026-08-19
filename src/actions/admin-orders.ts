'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireStaff, requireAdmin } from '@/lib/auth';
import { transitionOrder } from '@/lib/order';
import { sendOrderStatusEmail } from '@/lib/notify';
import { NEXT_STATUSES } from '@/lib/order-status';
import { refundPayment, gatewayConfigured } from '@/lib/razorpay';
import { toPaise } from '@/lib/money';
import type { OrderStatus } from '@/generated/prisma';

const schema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    'PENDING_PAYMENT', 'CONFIRMED', 'PACKED', 'SHIPPED',
    'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED', 'REFUNDED',
  ]),
  courierName: z.string().max(80).optional().or(z.literal('')),
  awbNumber: z.string().max(80).optional().or(z.literal('')),
  note: z.string().max(500).optional().or(z.literal('')),
});

/** ADM-05 / ORD-02 — operator moves an order along, with an audit entry. */
export async function updateOrderStatusAction(input: {
  orderId: string;
  status: string;
  courierName?: string;
  awbNumber?: string;
  note?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const staff = await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Invalid request.' };

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, status: true, gatewayPaymentId: true, grandTotal: true },
  });
  if (!order) return { ok: false, message: 'Order not found.' };

  const allowed = NEXT_STATUSES[order.status];
  if (!allowed.includes(parsed.data.status as OrderStatus)) {
    return {
      ok: false,
      message: `An order that is ${order.status.toLowerCase().replace('_', ' ')} cannot move to ${parsed.data.status.toLowerCase().replace('_', ' ')}.`,
    };
  }

  // ORD-03 — shipping without a tracking number leaves the customer blind.
  if (parsed.data.status === 'SHIPPED' && (!parsed.data.courierName || !parsed.data.awbNumber)) {
    return { ok: false, message: 'Enter the courier and AWB number before marking it shipped.' };
  }

  // PAY-06 — refund through the gateway before recording it locally.
  if (parsed.data.status === 'REFUNDED' && gatewayConfigured && order.gatewayPaymentId) {
    try {
      await refundPayment(order.gatewayPaymentId, toPaise(order.grandTotal));
    } catch (error) {
      console.error('[refund] gateway refund failed', error);
      return {
        ok: false,
        message: 'The gateway refused the refund. Check the Razorpay dashboard before retrying.',
      };
    }
  }

  await transitionOrder({
    orderId: order.id,
    status: parsed.data.status as OrderStatus,
    actor: `staff:${staff.email}`,
    message: parsed.data.note || undefined,
    courierName: parsed.data.courierName || null,
    awbNumber: parsed.data.awbNumber || null,
  });

  await sendOrderStatusEmail(order.id, parsed.data.status as OrderStatus).catch((e) =>
    console.error('[notify] status email failed', e),
  );

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { ok: true, message: 'Order updated.' };
}

export async function saveOrderNoteAction(
  orderId: string,
  note: string,
): Promise<{ ok: boolean }> {
  await requireStaff();
  await prisma.order.update({ where: { id: orderId }, data: { adminNote: note.slice(0, 1000) } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Manual confirmation for the rare offline/bank-transfer case. */
export async function markOrderPaidAction(orderId: string): Promise<{ ok: boolean; message?: string }> {
  const admin = await requireAdmin();
  const { confirmOrderPaid } = await import('@/lib/order');
  const { sendOrderConfirmationEmail } = await import('@/lib/notify');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true },
  });
  if (!order) return { ok: false, message: 'Order not found.' };
  if (order.paymentStatus === 'PAID') return { ok: false, message: 'Already marked as paid.' };

  await confirmOrderPaid({ orderId });
  await prisma.orderEvent.create({
    data: {
      orderId,
      status: 'CONFIRMED',
      message: 'Marked as paid manually by an administrator.',
      actor: `admin:${admin.email}`,
    },
  });
  await sendOrderConfirmationEmail(orderId).catch(() => {});

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: 'Order marked as paid.' };
}
