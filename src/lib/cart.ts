import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { prisma } from './prisma';
import { getCurrentUser } from './auth';
import { availableQtyMany } from './stock';
import { getSettings } from './settings';
import { toNumber, round2 } from './money';
import { evaluateCoupon } from './coupon';

const CART_COOKIE = 'adn_cart';

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  sku: string;
  image: string;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  available: number;
  weightG: number;
  isPlant: boolean;
  /** Set when stock fell below the quantity in the cart (CART-04). */
  adjustedFrom?: number;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  couponCode: string | null;
  couponMessage: string | null;
};

export type ResolvedCart = {
  id: string | null;
  lines: CartLine[];
  totals: CartTotals;
  itemCount: number;
  notices: string[];
};

export function variantLabel(optionValues: unknown): string {
  if (!optionValues || typeof optionValues !== 'object') return 'Standard';
  const entries = Object.entries(optionValues as Record<string, string>);
  if (entries.length === 0) return 'Standard';
  return entries.map(([, v]) => v).join(' · ');
}

/** Read-only lookup — safe to call while rendering a server component. */
export async function findCart() {
  const user = await getCurrentUser();
  if (user) {
    const owned = await prisma.cart.findFirst({ where: { userId: user.id } });
    if (owned) return owned;
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({ where: { token } });
}

/**
 * Gets or creates the cart and merges a guest cart into the signed-in one
 * (CART-03). Only safe from a Server Action or Route Handler, since it writes
 * a cookie.
 */
export async function ensureCart() {
  const user = await getCurrentUser();
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const guestCart = token
    ? await prisma.cart.findUnique({ where: { token }, include: { items: true } })
    : null;

  if (!user) {
    if (guestCart) return guestCart;
    const created = await prisma.cart.create({
      data: { token: randomBytes(24).toString('base64url') },
      include: { items: true },
    });
    store.set(CART_COOKIE, created.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
    });
    return created;
  }

  let userCart = await prisma.cart.findFirst({
    where: { userId: user.id },
    include: { items: true },
  });
  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { userId: user.id, token: randomBytes(24).toString('base64url') },
      include: { items: true },
    });
  }

  if (guestCart && guestCart.id !== userCart.id) {
    for (const item of guestCart.items) {
      const existing = userCart.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
        });
      }
    }
    await prisma.cart.delete({ where: { id: guestCart.id } });
    store.delete(CART_COOKIE);
    userCart = await prisma.cart.findUnique({
      where: { id: userCart.id },
      include: { items: true },
    });
  }
  return userCart!;
}

export const EMPTY_CART: ResolvedCart = {
  id: null,
  lines: [],
  itemCount: 0,
  notices: [],
  totals: {
    subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0,
    freeShippingThreshold: 0, amountToFreeShipping: 0,
    couponCode: null, couponMessage: null,
  },
};

/**
 * Loads the cart and revalidates price and stock against the catalog (CART-04).
 * Quantities above what is available are clamped and reported in `notices`.
 */
export async function resolveCart(cartId?: string | null): Promise<ResolvedCart> {
  const id = cartId ?? (await findCart())?.id ?? null;
  if (!id) return EMPTY_CART;

  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          variant: {
            include: {
              image: true,
              product: {
                select: {
                  id: true, name: true, slug: true, type: true, status: true,
                  images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return EMPTY_CART;

  const availability = await availableQtyMany(cart.items.map((i) => i.variantId));
  const notices: string[] = [];
  const lines: CartLine[] = [];

  for (const item of cart.items) {
    const v = item.variant;
    if (!v || !v.isActive || v.product.status !== 'ACTIVE') {
      await prisma.cartItem.delete({ where: { id: item.id } });
      notices.push(`${v?.product.name ?? 'An item'} is no longer available and was removed.`);
      continue;
    }
    const available = availability.get(v.id) ?? 0;
    if (available <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      notices.push(`${v.product.name} sold out and was removed from your cart.`);
      continue;
    }

    let quantity = item.quantity;
    let adjustedFrom: number | undefined;
    if (quantity > available) {
      adjustedFrom = quantity;
      quantity = available;
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
      notices.push(
        `Only ${available} of ${v.product.name} left — quantity reduced from ${adjustedFrom}.`,
      );
    }

    lines.push({
      id: item.id,
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      variantLabel: variantLabel(v.optionValues),
      sku: v.sku,
      image: v.image?.url ?? v.product.images[0]?.url ?? '/img/ph/default.svg',
      unitPrice: toNumber(v.price),
      compareAtPrice: v.compareAtPrice ? toNumber(v.compareAtPrice) : null,
      quantity,
      available,
      weightG: v.weightG,
      isPlant: v.product.type === 'PLANT',
      adjustedFrom,
    });
  }

  const totals = await computeTotals(lines, cart.coupon?.code ?? null);
  return {
    id: cart.id,
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    notices,
    totals,
  };
}

/**
 * Server-side pricing. Totals are always recomputed here and never trusted
 * from the client (PRD §9, data integrity).
 */
export async function computeTotals(
  lines: CartLine[],
  couponCode: string | null,
): Promise<CartTotals> {
  const settings = await getSettings();
  const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));

  // SHP-01 — a single live plant in the basket moves the whole order onto the
  // plant rate, since it ships in plant packaging.
  const hasPlant = lines.some((l) => l.isPlant);
  const baseShipping = lines.length === 0
    ? 0
    : hasPlant
      ? settings.shippingFlatPlants
      : settings.shippingFlatSeeds;

  const coupon = couponCode ? await evaluateCoupon(couponCode, lines, subtotal) : null;
  const discount = coupon?.valid ? coupon.discount : 0;

  // SHP-02 — threshold is measured on the discounted subtotal.
  const netSubtotal = round2(subtotal - discount);
  const thresholdMet =
    settings.freeShippingThreshold > 0 && netSubtotal >= settings.freeShippingThreshold;
  const shipping = lines.length === 0
    ? 0
    : thresholdMet || coupon?.freeShipping
      ? 0
      : baseShipping;

  const tax = round2((netSubtotal * settings.taxPercent) / 100);
  const total = round2(netSubtotal + shipping + tax);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    freeShippingThreshold: settings.freeShippingThreshold,
    amountToFreeShipping:
      settings.freeShippingThreshold > 0 && !thresholdMet
        ? round2(settings.freeShippingThreshold - netSubtotal)
        : 0,
    couponCode: coupon?.valid ? couponCode : null,
    couponMessage: coupon && !coupon.valid ? coupon.reason : null,
  };
}

export async function cartItemCount(): Promise<number> {
  const cart = await findCart();
  if (!cart) return 0;
  const agg = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
