'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, requireUser, verifyPassword } from '@/lib/auth';
import { passwordRule } from '@/lib/validation';
import type { FormState } from './auth';

const profileSchema = z.object({
  name: z.string().min(2, 'Tell us your name.').max(80),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.')
    .optional()
    .or(z.literal('')),
});

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  revalidatePath('/account');
  revalidatePath('/account/profile');
  return { success: 'Profile updated.' };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (next !== confirm) return { error: 'The two new passwords do not match.' };

  const parsed = passwordRule.safeParse(next);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Choose a stronger password.' };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    return { error: 'Your current password is not correct.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  return { success: 'Password changed.' };
}
