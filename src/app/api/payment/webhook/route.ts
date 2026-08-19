import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { confirmOrderPaid, failOrder } from '@/lib/order';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/notify';

/**
 * Authoritative payment confirmation (PAY-02).
 *
 * Signature-verified against the raw body and idempotent, so repeated
 * deliveries are harmless (PAY-03).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[webhook] rejected: bad signature');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed payload.' }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const gatewayOrderId = payment?.order_id;
  if (!gatewayOrderId) return NextResponse.json({ ok: true, ignored: true });

  const order = await prisma.order.findFirst({
    where: { gatewayOrderId },
    select: { id: true },
  });
  if (!order) {
    console.warn('[webhook] no order for gateway order', gatewayOrderId);
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const { alreadyConfirmed } = await confirmOrderPaid({
      orderId: order.id,
      gatewayPaymentId: payment?.id ?? null,
    });
    if (!alreadyConfirmed) {
      sendOrderConfirmationEmail(order.id).catch((e) =>
        console.error('[notify] confirmation email failed', e),
      );
    }
  } else if (event.event === 'payment.failed') {
    await failOrder(order.id, 'The payment was declined by the gateway.');
  }

  return NextResponse.json({ ok: true });
}
