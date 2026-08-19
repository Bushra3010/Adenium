import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Type-ahead suggestions for the header search (SRCH-02). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const rows = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { botanicalName: { contains: q, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
      ],
    },
    take: 6,
    orderBy: [{ featured: 'desc' }, { ratingCount: 'desc' }],
    select: {
      slug: true,
      name: true,
      type: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      type: r.type,
      image: r.images[0]?.url ?? '/img/ph/default.svg',
    })),
  );
}
