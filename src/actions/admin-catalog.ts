'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { slugify, uniqueSlug } from '@/lib/slug';
import { recomputeProductRating } from './review';
import { saveSettings, type StoreSettings } from '@/lib/settings';

export type Result = { ok: boolean; message?: string; id?: string };

// ── Products (ADM-02) ────────────────────────────────────────────

const variantInput = z.object({
  id: z.string().optional(),
  optionValues: z.record(z.string(), z.string()),
  sku: z.string().min(1, 'Every variant needs a SKU.').max(60),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable(),
  stockQty: z.number().int().min(0),
  weightG: z.number().int().min(0),
  isActive: z.boolean(),
});

const productInput = z.object({
  id: z.string().optional(),
  type: z.enum(['SEED', 'PLANT']),
  name: z.string().min(2, 'Give the product a name.').max(160),
  botanicalName: z.string().max(160).nullable(),
  slug: z.string().max(90).optional(),
  sku: z.string().min(1, 'Give the product a SKU.').max(60),
  shortDescription: z.string().max(400).nullable(),
  description: z.string().nullable(),
  careGuide: z.string().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  featured: z.boolean(),
  metaTitle: z.string().max(200).nullable(),
  metaDescription: z.string().max(320).nullable(),
  categoryIds: z.array(z.string()),
  attributes: z.record(z.string(), z.string()),
  variants: z.array(variantInput).min(1, 'A product needs at least one variant.'),
});

export async function saveProductAction(input: unknown): Promise<Result> {
  await requireStaff();
  const parsed = productInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }
  const data = parsed.data;

  const skus = data.variants.map((v) => v.sku.trim());
  if (new Set(skus).size !== skus.length) {
    return { ok: false, message: 'Variant SKUs must be unique within the product.' };
  }

  const slug =
    data.slug?.trim() ||
    (await uniqueSlug(data.name, async (candidate) =>
      Boolean(
        await prisma.product.findFirst({
          where: { slug: candidate, ...(data.id ? { NOT: { id: data.id } } : {}) },
          select: { id: true },
        }),
      ),
    ));

  const base = {
    type: data.type,
    name: data.name,
    botanicalName: data.botanicalName || null,
    slug: slugify(slug),
    sku: data.sku,
    shortDescription: data.shortDescription || null,
    description: data.description || null,
    careGuide: data.careGuide || null,
    status: data.status,
    featured: data.featured,
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
  };

  try {
    const productId = await prisma.$transaction(async (tx) => {
      const product = data.id
        ? await tx.product.update({ where: { id: data.id }, data: base })
        : await tx.product.create({ data: base });

      await tx.productCategory.deleteMany({ where: { productId: product.id } });
      if (data.categoryIds.length) {
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({ productId: product.id, categoryId })),
        });
      }

      await tx.productAttribute.deleteMany({ where: { productId: product.id } });
      const attributeRows = Object.entries(data.attributes).filter(([, v]) => v.trim());
      if (attributeRows.length) {
        const known = await tx.attribute.findMany({
          where: { key: { in: attributeRows.map(([k]) => k) } },
          select: { id: true, key: true },
        });
        const byKey = new Map(known.map((a) => [a.key, a.id]));
        await tx.productAttribute.createMany({
          data: attributeRows
            .filter(([k]) => byKey.has(k))
            .map(([k, value]) => ({ productId: product.id, attributeId: byKey.get(k)!, value })),
        });
      }

      // Variants: update in place, create new, deactivate removed ones. They are
      // never deleted, because order lines reference them.
      const keepIds: string[] = [];
      for (const [index, variant] of data.variants.entries()) {
        if (variant.id) {
          await tx.variant.update({
            where: { id: variant.id },
            data: {
              optionValues: variant.optionValues,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stockQty: variant.stockQty,
              weightG: variant.weightG,
              isActive: variant.isActive,
              isDefault: index === 0,
            },
          });
          keepIds.push(variant.id);
        } else {
          const created = await tx.variant.create({
            data: {
              productId: product.id,
              optionValues: variant.optionValues,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stockQty: variant.stockQty,
              weightG: variant.weightG,
              isActive: variant.isActive,
              isDefault: index === 0,
            },
          });
          keepIds.push(created.id);
        }
      }
      await tx.variant.updateMany({
        where: { productId: product.id, id: { notIn: keepIds } },
        data: { isActive: false },
      });

      if (!data.id) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: `/img/ph/${base.slug}-1.svg`,
            alt: `${base.name} — product photograph`,
            position: 0,
            isPrimary: true,
          },
        });
      }

      return product.id;
    });

    revalidatePath('/admin/products');
    revalidatePath(`/product/${base.slug}`);
    revalidatePath('/', 'layout');
    return { ok: true, id: productId, message: 'Product saved.' };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2002') {
      return { ok: false, message: 'That SKU or slug is already used by another product.' };
    }
    console.error('[admin] product save failed', error);
    return { ok: false, message: 'Could not save the product.' };
  }
}

export async function setProductStatusAction(
  id: string,
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
): Promise<Result> {
  await requireStaff();
  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath('/admin/products');
  revalidatePath('/', 'layout');
  return { ok: true, message: `Product ${status.toLowerCase()}.` };
}

/** ADM-03 — inline stock edit from the inventory screen. */
export async function updateStockAction(variantId: string, stockQty: number): Promise<Result> {
  await requireStaff();
  if (!Number.isInteger(stockQty) || stockQty < 0) {
    return { ok: false, message: 'Stock must be a whole number, zero or more.' };
  }
  await prisma.variant.update({ where: { id: variantId }, data: { stockQty } });
  revalidatePath('/admin/inventory');
  revalidatePath('/admin');
  return { ok: true };
}

// ── Categories (ADM-09) ──────────────────────────────────────────

const categoryInput = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(80),
  slug: z.string().max(90).optional(),
  description: z.string().max(600).nullable(),
  type: z.enum(['SEED', 'PLANT']),
  parentId: z.string().nullable(),
  position: z.number().int().min(0),
  isActive: z.boolean(),
});

export async function saveCategoryAction(input: unknown): Promise<Result> {
  await requireStaff();
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }
  const data = parsed.data;

  // A category cannot be its own parent.
  if (data.id && data.parentId === data.id) {
    return { ok: false, message: 'A category cannot be nested inside itself.' };
  }

  const slug =
    data.slug?.trim() ||
    (await uniqueSlug(data.name, async (candidate) =>
      Boolean(
        await prisma.category.findFirst({
          where: { slug: candidate, ...(data.id ? { NOT: { id: data.id } } : {}) },
          select: { id: true },
        }),
      ),
    ));

  const base = {
    name: data.name,
    slug: slugify(slug),
    description: data.description || null,
    type: data.type,
    parentId: data.parentId || null,
    position: data.position,
    isActive: data.isActive,
  };

  try {
    if (data.id) await prisma.category.update({ where: { id: data.id }, data: base });
    else await prisma.category.create({ data: base });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return { ok: false, message: 'That slug is already in use.' };
    }
    throw error;
  }

  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Category saved.' };
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  await requireStaff();
  const [children, products] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.productCategory.count({ where: { categoryId: id } }),
  ]);
  if (children > 0) {
    return { ok: false, message: 'Move or delete the subcategories first.' };
  }
  if (products > 0) {
    return {
      ok: false,
      message: `${products} product${products === 1 ? ' is' : 's are'} still in this category.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Category deleted.' };
}

// ── Coupons (ADM-07) ─────────────────────────────────────────────

const couponInput = z.object({
  id: z.string().optional(),
  code: z.string().min(3, 'Codes are at least 3 characters.').max(40),
  description: z.string().max(200).nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']),
  value: z.number().min(0),
  maxDiscount: z.number().min(0).nullable(),
  minOrderValue: z.number().min(0),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  usageLimit: z.number().int().min(0).nullable(),
  usageLimitPerUser: z.number().int().min(0).nullable(),
  stackable: z.boolean(),
  isActive: z.boolean(),
});

export async function saveCouponAction(input: unknown): Promise<Result> {
  await requireStaff();
  const parsed = couponInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form.' };
  }
  const data = parsed.data;

  if (data.discountType === 'PERCENTAGE' && data.value > 100) {
    return { ok: false, message: 'A percentage discount cannot exceed 100.' };
  }
  const startsAt = data.startsAt ? new Date(data.startsAt) : null;
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  if (startsAt && endsAt && endsAt <= startsAt) {
    return { ok: false, message: 'The end date must fall after the start date.' };
  }

  const base = {
    code: data.code.trim().toUpperCase(),
    description: data.description || null,
    discountType: data.discountType,
    value: data.discountType === 'FREE_SHIPPING' ? 0 : data.value,
    maxDiscount: data.maxDiscount,
    minOrderValue: data.minOrderValue,
    startsAt,
    endsAt,
    usageLimit: data.usageLimit,
    usageLimitPerUser: data.usageLimitPerUser,
    stackable: data.stackable,
    isActive: data.isActive,
  };

  try {
    if (data.id) await prisma.coupon.update({ where: { id: data.id }, data: base });
    else await prisma.coupon.create({ data: base });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return { ok: false, message: 'That code already exists.' };
    }
    throw error;
  }

  revalidatePath('/admin/coupons');
  return { ok: true, message: 'Coupon saved.' };
}

export async function deleteCouponAction(id: string): Promise<Result> {
  await requireStaff();
  const used = await prisma.couponRedemption.count({ where: { couponId: id } });
  if (used > 0) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    revalidatePath('/admin/coupons');
    return {
      ok: true,
      message: 'This code has been used on orders, so it was deactivated rather than deleted.',
    };
  }
  await prisma.coupon.delete({ where: { id } });
  revalidatePath('/admin/coupons');
  return { ok: true, message: 'Coupon deleted.' };
}

// ── Reviews (ADM-08 / REV-02) ────────────────────────────────────

export async function moderateReviewAction(
  id: string,
  status: 'APPROVED' | 'REJECTED',
): Promise<Result> {
  await requireStaff();
  const review = await prisma.review.update({
    where: { id },
    data: { status },
    select: { productId: true },
  });
  await recomputeProductRating(review.productId);
  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: true, message: status === 'APPROVED' ? 'Review published.' : 'Review rejected.' };
}

// ── Settings (ADM-10) ────────────────────────────────────────────

export async function saveSettingsAction(input: Partial<StoreSettings>): Promise<Result> {
  await requireAdmin();
  const schema = z.object({
    storeName: z.string().min(1).max(80).optional(),
    storeEmail: z.email().optional(),
    storePhone: z.string().max(40).optional(),
    storeAddress: z.string().max(300).optional(),
    shippingFlatSeeds: z.number().min(0).optional(),
    shippingFlatPlants: z.number().min(0).optional(),
    freeShippingThreshold: z.number().min(0).optional(),
    taxPercent: z.number().min(0).max(100).optional(),
    reservationMinutes: z.number().int().min(5).max(1440).optional(),
    lowStockThreshold: z.number().int().min(0).max(999).optional(),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the values.' };
  }

  await saveSettings(parsed.data);
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Settings saved.' };
}
