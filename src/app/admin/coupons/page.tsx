import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { toNumber } from '@/lib/money';
import { PageHeading } from '@/components/admin/ui';
import { CouponManager, type CouponRow } from '@/components/admin/coupon-manager';

export const dynamic = 'force-dynamic';

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export default async function AdminCouponsPage() {
  await requireStaff();
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    value: toNumber(c.value),
    maxDiscount: c.maxDiscount ? toNumber(c.maxDiscount) : null,
    minOrderValue: toNumber(c.minOrderValue),
    startsAt: isoDate(c.startsAt),
    endsAt: isoDate(c.endsAt),
    usageLimit: c.usageLimit,
    usageLimitPerUser: c.usageLimitPerUser,
    timesUsed: c.timesUsed,
    stackable: c.stackable,
    isActive: c.isActive,
  }));

  return (
    <>
      <PageHeading
        title="Coupons"
        description="Discount codes shoppers enter in the cart."
      />
      <CouponManager coupons={rows} />
    </>
  );
}
