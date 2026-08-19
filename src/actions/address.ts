'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';

export type AddressState = { error?: string; success?: string };

function parse(formData: FormData) {
  return addressSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    line1: formData.get('line1'),
    line2: formData.get('line2') ?? '',
    landmark: formData.get('landmark') ?? '',
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
    isDefault: formData.get('isDefault') === 'on',
  });
}

export async function saveAddressAction(
  _prev: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the address and try again.' };
  }

  const id = String(formData.get('id') ?? '');
  const data = {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    landmark: parsed.data.landmark || null,
    city: parsed.data.city,
    state: parsed.data.state,
    pincode: parsed.data.pincode,
    isDefault: parsed.data.isDefault ?? false,
  };

  const count = await prisma.address.count({ where: { userId: user.id } });
  const makeDefault = data.isDefault || count === 0;

  if (makeDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  if (id) {
    // Scoped by userId so one customer cannot edit another's address.
    const updated = await prisma.address.updateMany({
      where: { id, userId: user.id },
      data: { ...data, isDefault: makeDefault },
    });
    if (updated.count === 0) return { error: 'That address could not be found.' };
  } else {
    await prisma.address.create({
      data: { ...data, isDefault: makeDefault, userId: user.id },
    });
  }

  revalidatePath('/account/addresses');
  revalidatePath('/checkout');
  return { success: id ? 'Address updated.' : 'Address saved.' };
}

export async function deleteAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return;

  await prisma.address.delete({ where: { id } });

  // Promote another address so the account always has a default.
  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  revalidatePath('/account/addresses');
}

export async function setDefaultAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return;
  await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  await prisma.address.update({ where: { id }, data: { isDefault: true } });
  revalidatePath('/account/addresses');
}
