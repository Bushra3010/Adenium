import { Prisma } from '@/generated/prisma';

/** Rupee amounts are handled as Prisma Decimal in the DB and plain numbers in the UI. */
export type Money = Prisma.Decimal | number | string;

export function toNumber(v: Money): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number.parseFloat(v);
  return v.toNumber();
}

/** Razorpay transacts in paise (PAY-01). */
export function toPaise(v: Money): number {
  return Math.round(toNumber(v) * 100);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

export function formatINR(v: Money): string {
  const n = toNumber(v);
  return Number.isInteger(n) ? inr.format(n) : inrPaise.format(n);
}

export function formatPriceRange(min: Money, max: Money): string {
  const a = toNumber(min);
  const b = toNumber(max);
  return a === b ? formatINR(a) : `${formatINR(a)} – ${formatINR(b)}`;
}
