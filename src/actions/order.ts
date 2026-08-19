'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { transitionOrder } from '@/lib/order';
import { sendOrderStatusEmail } from '@/lib/notify';

export async function cancelOrderAction(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: { id: true, status: true },
  });
  if (!order) return { ok: false, message: 'That order could not be found.' };

  // ACC-07 — only before the order is packed.
  if (order.status !== 'CONFIRMED') {
    return {
      ok: false,
      message: 'This order has already been packed, so we can no longer cancel it here. Contact us and we will help.',
    };
  }

  await transitionOrder({
    orderId: order.id,
    status: 'CANCELLED',
    actor: `customer:${user.email}`,
    message: 'Cancelled at your request. Any payment will be refunded.',
  });
  await sendOrderStatusEmail(order.id, 'CANCELLED');

  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath('/account/orders');
  return { ok: true };
}
