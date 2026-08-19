import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save items.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    create: { userId: user.id, productId: parsed.data.productId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save items.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId: parsed.data.productId },
  });
  return NextResponse.json({ ok: true });
}
