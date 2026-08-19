import { prisma } from './prisma';
import { round2, toNumber } from './money';
import type { CartLine } from './cart';

export type CouponEvaluation = {
  valid: boolean;
  discount: number;
  freeShipping: boolean;
  reason: string | null;
  couponId: string | null;
};

const invalid = (reason: string): CouponEvaluation => ({
  valid: false,
  discount: 0,
  freeShipping: false,
  reason,
  couponId: null,
});

/**
 * Validates a coupon against the cart and returns the discount (CPN-01..05).
 * Errors are specific so the shopper can act on them (CPN-04).
 */
export async function evaluateCoupon(
  code: string,
  lines: CartLine[],
  subtotal: number,
  userId?: string | null,
  email?: string | null,
): Promise<CouponEvaluation> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) return invalid('That code was not recognised.');
  if (!coupon.isActive) return invalid('That code is no longer active.');

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return invalid('That code is not valid yet.');
  }
  if (coupon.endsAt && coupon.endsAt < now) return invalid('That code has expired.');

  const minOrder = toNumber(coupon.minOrderValue);
  if (subtotal < minOrder) {
    return invalid(`Spend ₹${minOrder.toLocaleString('en-IN')} to use this code.`);
  }

  if (coupon.usageLimit != null && coupon.timesUsed >= coupon.usageLimit) {
    return invalid('That code has reached its usage limit.');
  }

  if (coupon.usageLimitPerUser != null && (userId || email)) {
    const used = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        ...(userId ? { userId } : { email: email! }),
      },
    });
    if (used >= coupon.usageLimitPerUser) {
      return invalid('You have already used this code.');
    }
  }

  // Scoped coupons apply only to the eligible portion of the cart.
  const scoped = coupon.scopeProductIds.length > 0 || coupon.scopeCategoryIds.length > 0;
  let eligibleTotal = subtotal;

  if (scoped) {
    let eligibleProductIds = new Set(coupon.scopeProductIds);
    if (coupon.scopeCategoryIds.length > 0) {
      const inCats = await prisma.productCategory.findMany({
        where: { categoryId: { in: coupon.scopeCategoryIds } },
        select: { productId: true },
      });
      eligibleProductIds = new Set([...eligibleProductIds, ...inCats.map((p) => p.productId)]);
    }
    eligibleTotal = round2(
      lines
        .filter((l) => eligibleProductIds.has(l.productId))
        .reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    );
    if (eligibleTotal <= 0) {
      return invalid('That code does not apply to anything in your cart.');
    }
  }

  if (coupon.discountType === 'FREE_SHIPPING') {
    return { valid: true, discount: 0, freeShipping: true, reason: null, couponId: coupon.id };
  }

  let discount =
    coupon.discountType === 'PERCENTAGE'
      ? round2((eligibleTotal * toNumber(coupon.value)) / 100)
      : toNumber(coupon.value);

  if (coupon.maxDiscount) discount = Math.min(discount, toNumber(coupon.maxDiscount));
  discount = round2(Math.min(discount, eligibleTotal));

  return { valid: true, discount, freeShipping: false, reason: null, couponId: coupon.id };
}
