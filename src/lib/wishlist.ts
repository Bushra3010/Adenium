import { prisma } from './prisma';
import { getCurrentUser } from './auth';

/** Wishlisted product ids for the signed-in user, for card state. */
export async function wishlistedIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}
