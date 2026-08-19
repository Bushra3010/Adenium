import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { emailLayout, sendMail } from '@/lib/mail';

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().max(120).optional().or(z.literal('')),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`contact:${ip}`, 3, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many messages. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check the form — a name, email and a message of at least ten characters are needed.' },
      { status: 400 },
    );
  }

  const data = parsed.data;
  await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    },
  });

  const to = process.env.ADMIN_ALERT_EMAIL;
  if (to) {
    await sendMail({
      to,
      subject: `Enquiry from ${data.name}${data.subject ? ` — ${data.subject}` : ''}`,
      html: emailLayout(
        'New enquiry',
        `<p style="margin:0 0 12px;font-size:14px;color:#3f4a42"><strong>${data.name}</strong> · ${data.email}${data.phone ? ` · ${data.phone}` : ''}</p>
         <p style="margin:0;font-size:15px;line-height:1.6;color:#3f4a42;white-space:pre-wrap">${data.message.replace(/</g, '&lt;')}</p>`,
      ),
    });
  }

  return NextResponse.json({ message: 'Thanks — we will reply within a working day.' });
}
