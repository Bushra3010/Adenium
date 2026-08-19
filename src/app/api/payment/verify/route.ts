import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { confirmOrderPaid, failOrder } from '@/lib/order';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/notify';

const schema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

/**
 * Browser handoff after the gateway modal closes.
 *
 * The signature is verified server-side before anything is confirmed, and the
 * webhook (PAY-02) remains the authoritative path — this endpoint exists so the
 * shopper sees a confirmed order immediately rather than waiting on a webhook.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, gatewayOrderId: true, paymentStatus: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  if (order.gatewayOrderId !== parsed.data.razorpayOrderId) {
    return NextResponse.json({ error: 'Payment does not match this order.' }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    gatewayOrderId: parsed.data.razorpayOrderId,
    paymentId: parsed.data.razorpayPaymentId,
    signature: parsed.data.razorpaySignature,
  });

  if (!valid) {
    await failOrder(order.id, 'Payment signature could not be verified.');
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  const { alreadyConfirmed } = await confirmOrderPaid({
    orderId: order.id,
    gatewayPaymentId: parsed.data.razorpayPaymentId,
    gatewaySignature: parsed.data.razorpaySignature,
  });

  if (!alreadyConfirmed) {
    // Never let a mail failure undo a paid order.
    sendOrderConfirmationEmail(order.id).catch((e) =>
      console.error('[notify] confirmation email failed', e),
    );
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
