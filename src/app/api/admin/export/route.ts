import { prisma } from '@/lib/prisma';
import { requireStaff, AuthError } from '@/lib/auth';
import { toCsv } from '@/lib/csv';
import { toNumber } from '@/lib/money';

/** ADM-11 — sales and catalog exports as CSV. */
export async function GET(request: Request) {
  try {
    await requireStaff();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return new Response('Not permitted', { status });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') ?? 'orders';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const range =
    from || to
      ? {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(`${to}T23:59:59.999`) : undefined,
        }
      : undefined;

  let rows: (string | number | null)[][];
  let filename: string;

  if (type === 'products') {
    const variants = await prisma.variant.findMany({
      orderBy: { sku: 'asc' },
      include: {
        product: {
          select: { sku: true, name: true, type: true, status: true, slug: true },
        },
      },
    });
    rows = [
      ['product_sku', 'name', 'type', 'status', 'variant_sku', 'options', 'price', 'stock', 'weight_g', 'url'],
      ...variants.map((v) => [
        v.product.sku,
        v.product.name,
        v.product.type,
        v.product.status,
        v.sku,
        Object.entries((v.optionValues ?? {}) as Record<string, string>)
          .map(([k, val]) => `${k}=${val}`)
          .join('|'),
        toNumber(v.price),
        v.stockQty,
        v.weightG,
        `/product/${v.product.slug}`,
      ]),
    ];
    filename = 'adenium-catalog.csv';
  } else if (type === 'items') {
    const items = await prisma.orderItem.findMany({
      where: { order: { paymentStatus: 'PAID', ...(range ? { paidAt: range } : {}) } },
      include: { order: { select: { orderNumber: true, paidAt: true } } },
      orderBy: { order: { paidAt: 'desc' } },
    });
    rows = [
      ['order_number', 'paid_at', 'product', 'variant', 'sku', 'unit_price', 'quantity', 'line_total'],
      ...items.map((i) => [
        i.order.orderNumber,
        i.order.paidAt?.toISOString() ?? '',
        i.productName,
        i.variantLabel,
        i.sku,
        toNumber(i.unitPrice),
        i.quantity,
        toNumber(i.lineTotal),
      ]),
    ];
    filename = 'adenium-sold-items.csv';
  } else {
    const orders = await prisma.order.findMany({
      where: range ? { createdAt: range } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    rows = [
      [
        'order_number', 'placed_at', 'paid_at', 'status', 'payment_status', 'customer',
        'email', 'phone', 'city', 'state', 'pincode', 'items', 'subtotal', 'discount',
        'coupon', 'shipping', 'tax', 'total', 'courier', 'awb',
      ],
      ...orders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.paidAt?.toISOString() ?? '',
        o.status,
        o.paymentStatus,
        o.shipFullName,
        o.email,
        o.phone,
        o.shipCity,
        o.shipState,
        o.shipPincode,
        o._count.items,
        toNumber(o.subtotal),
        toNumber(o.discountTotal),
        o.couponCode ?? '',
        toNumber(o.shippingTotal),
        toNumber(o.taxTotal),
        toNumber(o.grandTotal),
        o.courierName ?? '',
        o.awbNumber ?? '',
      ]),
    ];
    filename = 'adenium-orders.csv';
  }

  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
