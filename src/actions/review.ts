'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function submitReview(input: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
}): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to write a review.' };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Please write at least a sentence or two.' };
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: parsed.data.productId, userId: user.id } },
  });
  if (existing) {
    return { ok: false, message: 'You have already reviewed this product.' };
  }

  // REV-04 — a delivered order containing this product marks the review verified.
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: 'DELIVERED',
      items: { some: { productId: parsed.data.productId } },
    },
    select: { id: true },
  });

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: 'PENDING',
      verifiedOrderId: deliveredOrder?.id ?? null,
    },
  });

  revalidatePath('/account/reviews');
  return {
    ok: true,
    message: 'Thanks — your review is with us and will appear once checked.',
  };
}

/** Recomputes the denormalised rating from APPROVED reviews only (REV-03). */
export async function recomputeProductRating(productId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}
