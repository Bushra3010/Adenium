'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ensureCart, resolveCart } from '@/lib/cart';
import { availableQty } from '@/lib/stock';
import { evaluateCoupon } from '@/lib/coupon';
import { getCurrentUser } from '@/lib/auth';

export type ActionResult = { ok: boolean; message?: string };

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export async function addToCart(input: {
  variantId: string;
  quantity: number;
}): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Invalid request.' };

  const variant = await prisma.variant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: { select: { status: true, name: true } } },
  });
  if (!variant || !variant.isActive || variant.product.status !== 'ACTIVE') {
    return { ok: false, message: 'That item is no longer available.' };
  }

  const cart = await ensureCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });

  const available = await availableQty(variant.id);
  if (available <= 0) return { ok: false, message: 'Sold out.' };

  const requested = (existing?.quantity ?? 0) + parsed.data.quantity;
  // PDP-04 / CART-04 — never let the cart exceed what can actually ship.
  const quantity = Math.min(requested, available);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId: variant.id, quantity },
    });
  }

  revalidatePath('/cart');
  revalidatePath('/', 'layout');

  if (quantity < requested) {
    return {
      ok: true,
      message: `Only ${available} in stock — your cart now holds ${quantity}.`,
    };
  }
  return { ok: true, message: `${variant.product.name} added to your cart.` };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<ActionResult> {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return { ok: false, message: 'Invalid quantity.' };
  }
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, message: 'That item is no longer in your cart.' };

  const cart = await ensureCart();
  if (item.cartId !== cart.id) return { ok: false, message: 'That item is not in your cart.' };

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const available = await availableQty(item.variantId);
    if (quantity > available) {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: Math.max(1, available) },
      });
      revalidatePath('/cart');
      return { ok: false, message: `Only ${available} left in stock.` };
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  const cart = await ensureCart();
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** CART-05 / CPN-04 — applies a code and reports precisely why it failed. */
export async function applyCoupon(code: string): Promise<ActionResult> {
  const cart = await ensureCart();
  const resolved = await resolveCart(cart.id);
  const user = await getCurrentUser();

  if (resolved.lines.length === 0) {
    return { ok: false, message: 'Add something to your cart first.' };
  }

  const evaluation = await evaluateCoupon(
    code,
    resolved.lines,
    resolved.totals.subtotal,
    user?.id ?? null,
    user?.email ?? null,
  );

  if (!evaluation.valid) {
    return { ok: false, message: evaluation.reason ?? 'That code cannot be used.' };
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: evaluation.couponId },
  });
  revalidatePath('/cart');
  revalidatePath('/checkout');
  return { ok: true, message: `Code ${code.toUpperCase()} applied.` };
}

export async function removeCoupon(): Promise<ActionResult> {
  const cart = await ensureCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  revalidatePath('/cart');
  revalidatePath('/checkout');
  return { ok: true };
}
