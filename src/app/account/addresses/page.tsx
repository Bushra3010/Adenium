import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { AddressManager } from '@/components/address-manager';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Saved addresses', robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Saved addresses</h2>
      <p className="mt-1.5 text-sm text-ink-3">
        Your default address is filled in for you at checkout.
      </p>
      <div className="mt-6">
        <AddressManager addresses={addresses} />
      </div>
    </div>
  );
}
