'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  consumeToken,
  createSession,
  destroySession,
  hashPassword,
  issueToken,
  verifyPassword,
} from '@/lib/auth';
import { ensureCart } from '@/lib/cart';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { button, emailLayout, sendMail } from '@/lib/mail';
import { passwordRule } from '@/lib/validation';

export type FormState = { error?: string; success?: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const registerSchema = z.object({
  name: z.string().min(2, 'Tell us your name.').max(80),
  email: z.email('Enter a valid email address.'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.')
    .optional()
    .or(z.literal('')),
  password: passwordRule,
});

async function guard(bucket: string, limit: number, windowMs: number): Promise<string | null> {
  const ip = clientIp(await headers());
  const result = rateLimit(`${bucket}:${ip}`, limit, windowMs);
  return result.ok
    ? null
    : `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`;
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const blocked = await guard('register', 5, 10 * 60_000);
  if (blocked) return { error: blocked };

  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account already exists for that email. Try signing in.' };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: 'CUSTOMER',
    },
  });

  // AUTH-03 — verification link, non-blocking for browsing and buying.
  const token = await issueToken(user.id, 'EMAIL_VERIFICATION', 24 * 3600_000);
  await sendMail({
    to: email,
    subject: 'Confirm your email · Adenium',
    html: emailLayout(
      `Welcome, ${user.name}`,
      `<p style="margin:0;font-size:15px;line-height:1.6;color:#3f4a42">Confirm your email address so we can send you order updates.</p>
       ${button(`${SITE}/verify-email?token=${token}`, 'Confirm email address')}
       <p style="margin:0;font-size:13px;color:#6b7770">This link expires in 24 hours.</p>`,
    ),
  });

  await createSession(user.id);
  await ensureCart();
  revalidatePath('/', 'layout');

  const next = String(formData.get('next') ?? '/account');
  redirect(next.startsWith('/') ? next : '/account');
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const blocked = await guard('login', 10, 10 * 60_000);
  if (blocked) return { error: blocked };

  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message either way, so the form cannot be used to enumerate accounts.
  const invalid = { error: 'Those details did not match an account.' };
  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  await createSession(user.id);
  await ensureCart();
  revalidatePath('/', 'layout');

  const next = String(formData.get('next') ?? '');
  const target = next.startsWith('/') ? next : user.role === 'CUSTOMER' ? '/account' : '/admin';
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const blocked = await guard('reset-request', 5, 15 * 60_000);
  if (blocked) return { error: blocked };

  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = await issueToken(user.id, 'PASSWORD_RESET', 3600_000);
    await sendMail({
      to: email,
      subject: 'Reset your password · Adenium',
      html: emailLayout(
        'Reset your password',
        `<p style="margin:0;font-size:15px;line-height:1.6;color:#3f4a42">Use the link below to choose a new password. If you did not ask for this, you can ignore this email.</p>
         ${button(`${SITE}/reset-password?token=${token}`, 'Choose a new password')}
         <p style="margin:0;font-size:13px;color:#6b7770">This link expires in one hour and can be used once.</p>`,
      ),
    });
  }

  // Always the same response — the form must not reveal who has an account.
  return {
    success: 'If that address has an account, a reset link is on its way.',
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const blocked = await guard('reset', 10, 15 * 60_000);
  if (blocked) return { error: blocked };

  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password !== confirm) return { error: 'The two passwords do not match.' };
  const parsed = passwordRule.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Choose a stronger password.' };

  const userId = await consumeToken(token, 'PASSWORD_RESET');
  if (!userId) return { error: 'That reset link has expired. Request a new one.' };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });
  // Any session opened with the old password is now void.
  await prisma.session.deleteMany({ where: { userId } });

  redirect('/login?reset=1');
}

export async function verifyEmailAction(token: string): Promise<boolean> {
  const userId = await consumeToken(token, 'EMAIL_VERIFICATION');
  if (!userId) return false;
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  return true;
}
