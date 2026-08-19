import 'server-only';
import type { OrderStatus } from '@/generated/prisma';
import { prisma } from './prisma';
import { button, emailLayout, sendMail } from './mail';
import { formatINR } from './money';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Transactional notifications (NOT-01, NOT-03, NOT-04).
 *
 * SMS is stubbed deliberately: sending transactional SMS in India requires
 * TRAI DLT registration of the sender ID and every template, which is a
 * client-side registration (PRD §8.10). Wire SMS_PROVIDER once approved.
 */
export async function sendSms(to: string, message: string): Promise<{ sent: boolean }> {
  if (!process.env.SMS_PROVIDER || !process.env.SMS_API_KEY) {
    console.info(`[sms:not-configured] → ${to}: ${message}`);
    return { sent: false };
  }
  console.info(`[sms] → ${to}: ${message}`);
  return { sent: false };
}

function itemsTable(items: { productName: string; variantLabel: string; quantity: number; lineTotal: unknown }[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse">
    ${items
      .map(
        (i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #e0dccf;font-size:14px;color:#3f4a42">
        ${i.productName}<br/><span style="color:#6b7770;font-size:12px">${i.variantLabel} · Qty ${i.quantity}</span>
      </td>
      <td align="right" style="padding:8px 0;border-bottom:1px solid #e0dccf;font-size:14px;color:#1a1f1b">${formatINR(
        i.lineTotal as number,
      )}</td>
    </tr>`,
      )
      .join('')}
  </table>`;
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const html = emailLayout(
    `Order ${order.orderNumber} confirmed`,
    `<p style="margin:0;font-size:15px;line-height:1.6;color:#3f4a42">Thanks ${order.shipFullName.split(' ')[0]} — we have your payment and your order is confirmed.</p>
     ${itemsTable(order.items)}
     <table role="presentation" width="100%" style="font-size:14px;color:#3f4a42">
       <tr><td>Subtotal</td><td align="right">${formatINR(order.subtotal)}</td></tr>
       ${Number(order.discountTotal) > 0 ? `<tr><td style="color:#1f5c40">Discount</td><td align="right" style="color:#1f5c40">−${formatINR(order.discountTotal)}</td></tr>` : ''}
       <tr><td>Shipping</td><td align="right">${Number(order.shippingTotal) === 0 ? 'Free' : formatINR(order.shippingTotal)}</td></tr>
       <tr><td style="padding-top:8px;font-weight:600;color:#1a1f1b">Total</td><td align="right" style="padding-top:8px;font-weight:600;color:#1a1f1b">${formatINR(order.grandTotal)}</td></tr>
     </table>
     <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#3f4a42">
       Delivering to:<br/>${order.shipFullName}, ${order.shipLine1}, ${order.shipCity}, ${order.shipState} ${order.shipPincode}
     </p>
     ${button(`${SITE}/account/orders/${order.id}`, 'View your order')}`,
  );

  await sendMail({ to: order.email, subject: `Order ${order.orderNumber} confirmed · Adenium`, html });
  await sendSms(order.phone, `Adenium: order ${order.orderNumber} confirmed. Total ${formatINR(order.grandTotal)}.`);

  // NOT-04 — alert the shop.
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (adminEmail) {
    await sendMail({
      to: adminEmail,
      subject: `New order ${order.orderNumber} · ${formatINR(order.grandTotal)}`,
      html: emailLayout(
        `New order ${order.orderNumber}`,
        `<p style="margin:0;font-size:15px;color:#3f4a42">${order.items.length} item(s) · ${formatINR(order.grandTotal)} · ${order.shipCity}, ${order.shipState}</p>
         ${itemsTable(order.items)}
         ${button(`${SITE}/admin/orders/${order.id}`, 'Open in admin')}`,
      ),
    });
  }
}

const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; heading: string; body: string }>> = {
  SHIPPED: {
    subject: 'Your order is on its way',
    heading: 'Despatched',
    body: 'Your order has left us and is with the courier.',
  },
  DELIVERED: {
    subject: 'Your order was delivered',
    heading: 'Delivered',
    body: 'Your order has been delivered. Unpack plants straight away and let them settle in bright shade for a week.',
  },
  CANCELLED: {
    subject: 'Your order was cancelled',
    heading: 'Order cancelled',
    body: 'This order has been cancelled. Any payment will be refunded to the original method.',
  },
  REFUNDED: {
    subject: 'Your refund is on its way',
    heading: 'Refund issued',
    body: 'We have issued a refund to your original payment method. Banks usually take 5–7 working days.',
  },
};

export async function sendOrderStatusEmail(orderId: string, status: OrderStatus): Promise<void> {
  const copy = STATUS_COPY[status];
  if (!copy) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const tracking =
    status === 'SHIPPED' && order.awbNumber
      ? `<p style="margin:16px 0 0;font-size:14px;color:#3f4a42">Courier: <strong>${order.courierName}</strong><br/>Tracking number: <strong>${order.awbNumber}</strong></p>`
      : '';

  await sendMail({
    to: order.email,
    subject: `${copy.subject} · ${order.orderNumber}`,
    html: emailLayout(
      copy.heading,
      `<p style="margin:0;font-size:15px;line-height:1.6;color:#3f4a42">${copy.body}</p>
       ${tracking}
       ${button(`${SITE}/account/orders/${order.id}`, 'View your order')}`,
    ),
  });

  if (status === 'SHIPPED') {
    await sendSms(
      order.phone,
      `Adenium: order ${order.orderNumber} despatched${order.awbNumber ? `. AWB ${order.awbNumber}` : ''}.`,
    );
  }
}
