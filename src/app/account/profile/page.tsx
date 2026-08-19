import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ProfileForms } from '@/components/profile-forms';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your profile', robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { name: true, email: true, phone: true },
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Your profile</h2>
      <div className="mt-6">
        <ProfileForms name={user.name} email={user.email} phone={user.phone ?? ''} />
      </div>
    </div>
  );
}
