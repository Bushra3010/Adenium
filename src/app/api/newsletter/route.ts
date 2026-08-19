import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const schema = z.object({ email: z.email() });

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    create: { email: parsed.data.email.toLowerCase() },
    update: {},
  });

  return NextResponse.json({ message: 'Thanks — you are on the list.' });
}
