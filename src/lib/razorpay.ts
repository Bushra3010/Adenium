import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';

/**
 * Razorpay integration (PAY-01..PAY-07).
 *
 * Gateway credentials are client-supplied (PRD §11, item 4). Until they are in
 * place, non-production builds fall back to a simulated gateway so the whole
 * order lifecycle can be exercised. The simulator is hard-disabled in
 * production: with no keys there, checkout refuses rather than pretending.
 */
const keyId = process.env.RAZORPAY_KEY_ID ?? '';
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';

export const gatewayConfigured = Boolean(keyId && keySecret);
export const simulationEnabled = !gatewayConfigured && process.env.NODE_ENV !== 'production';

const client = gatewayConfigured
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null;

export type GatewayOrder = {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string | null;
  simulated: boolean;
};

export async function createGatewayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<GatewayOrder> {
  if (!client) {
    if (!simulationEnabled) {
      throw new Error(
        'Payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }
    return {
      gatewayOrderId: `sim_order_${input.receipt}_${Date.now()}`,
      amountPaise: input.amountPaise,
      currency: 'INR',
      keyId: null,
      simulated: true,
    };
  }

  const order = await client.orders.create({
    amount: input.amountPaise,
    currency: 'INR',
    receipt: input.receipt,
    notes: input.notes,
  });

  return {
    gatewayOrderId: order.id,
    amountPaise: Number(order.amount),
    currency: order.currency,
    keyId,
    simulated: false,
  };
}

function hmacHex(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Verifies the browser-side handoff (PAY-03). */
export function verifyPaymentSignature(input: {
  gatewayOrderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!gatewayConfigured) {
    return simulationEnabled && input.signature.startsWith('sim_sig_');
  }
  const expected = hmacHex(`${input.gatewayOrderId}|${input.paymentId}`, keySecret);
  return safeEqualHex(expected, input.signature);
}

/** Verifies a webhook delivery against the raw request body (PAY-03). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  if (!secret) return false;
  return safeEqualHex(hmacHex(rawBody, secret), signature);
}

export async function refundPayment(paymentId: string, amountPaise?: number) {
  if (!client) throw new Error('Payment gateway is not configured.');
  return client.payments.refund(paymentId, amountPaise ? { amount: amountPaise } : {});
}
