'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { findCart, resolveCart } from '@/lib/cart';
import { createOrderFromCart, failOrder, OrderError } from '@/lib/order';
import { createGatewayOrder, gatewayConfigured } from '@/lib/razorpay';
import { toPaise } from '@/lib/money';
import { checkoutSchema } from '@/lib/validation';

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      gatewayOrderId: string;
      amountPaise: number;
      keyId: string | null;
      simulated: boolean;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
    }
  | { ok: false; message: string };

/**
 * Creates the order, reserves stock, and opens a gateway order (CHK-06).
 * The order is not confirmed here — that happens only after the payment is
 * verified server-side (PAY-02).
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check your details.' };
  }

  const user = await getCurrentUser();
  const cartRecord = await findCart();
  if (!cartRecord) return { ok: false, message: 'Your cart is empty.' };

  const cart = await resolveCart(cartRecord.id);
  if (cart.lines.length === 0) {
    return { ok: false, message: 'Your cart is empty.' };
  }
  // CART-04 — if revalidation changed anything, stop and let them look.
  if (cart.notices.length > 0) {
    return { ok: false, message: cart.notices.join(' ') };
  }

  // Held outside the try so the catch can release the stock reservation if
  // anything after order creation fails.
  let createdOrderId: string | null = null;

  try {
    const order = await createOrderFromCart({
      cartId: cart.id!,
      userId: user?.id ?? null,
      lines: cart.lines,
      couponCode: cart.totals.couponCode,
      shipping: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        landmark: parsed.data.landmark || null,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        customerNote: parsed.data.customerNote || null,
      },
    });
    createdOrderId = order.id;

    if (user && parsed.data.saveAddress) {
      const count = await prisma.address.count({ where: { userId: user.id } });
      await prisma.address.create({
        data: {
          userId: user.id,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          line2: parsed.data.line2 || null,
          landmark: parsed.data.landmark || null,
          city: parsed.data.city,
          state: parsed.data.state,
          pincode: parsed.data.pincode,
          isDefault: count === 0,
        },
      });
    }

    const gateway = await createGatewayOrder({
      amountPaise: toPaise(order.grandTotal),
      receipt: order.orderNumber,
      notes: { orderId: order.id, orderNumber: order.orderNumber },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { gatewayOrderId: gateway.gatewayOrderId },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      gatewayOrderId: gateway.gatewayOrderId,
      amountPaise: gateway.amountPaise,
      keyId: gateway.keyId,
      simulated: gateway.simulated,
      customerName: parsed.data.fullName,
      customerEmail: parsed.data.email,
      customerPhone: parsed.data.phone,
    };
  } catch (error) {
    // The order exists and is holding stock by this point, so release it rather
    // than leaving a reservation to expire on its own. Otherwise a shopper
    // retrying after a gateway failure locks out a one-of-a-kind plant.
    if (createdOrderId) {
      await failOrder(
        createdOrderId,
        'Could not open a payment with the gateway; stock released.',
      ).catch((e) => console.error('[checkout] failed to release reservation', e));
    }

    if (error instanceof OrderError) return { ok: false, message: error.message };

    if (!gatewayConfigured) {
      console.error('[checkout] no payment gateway configured', error);
      return {
        ok: false,
        message:
          'Online payment is not available yet. Nothing has been charged — please contact us to complete your order.',
      };
    }

    console.error('[checkout] could not start payment', error);
    return {
      ok: false,
      message: 'We could not start the payment. Nothing has been charged — please try again.',
    };
  }
}
