'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveCouponAction, deleteCouponAction } from '@/actions/admin-catalog';
import { Table, Badge } from './ui';

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  timesUsed: number;
  stackable: boolean;
  isActive: boolean;
};

const BLANK: CouponRow = {
  id: '',
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  value: 10,
  maxDiscount: null,
  minOrderValue: 0,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usageLimitPerUser: null,
  timesUsed: 0,
  stackable: false,
  isActive: true,
};

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  function save() {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveCouponAction({
        id: editing.id || undefined,
        code: editing.code,
        description: editing.description || null,
        discountType: editing.discountType,
        value: Number(editing.value),
        maxDiscount: editing.maxDiscount == null ? null : Number(editing.maxDiscount),
        minOrderValue: Number(editing.minOrderValue),
        startsAt: editing.startsAt || null,
        endsAt: editing.endsAt || null,
        usageLimit: editing.usageLimit == null ? null : Number(editing.usageLimit),
        usageLimitPerUser:
          editing.usageLimitPerUser == null ? null : Number(editing.usageLimitPerUser),
        stackable: editing.stackable,
        isActive: editing.isActive,
      });
      setFeedback({ ok: res.ok, text: res.message ?? '' });
      if (res.ok) {
        setEditing(null);
        router.refresh();
      }
    });
  }

  const set = <K extends keyof CouponRow>(key: K, value: CouponRow[K]) =>
    setEditing((c) => (c ? { ...c, [key]: value } : c));

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          className={`border-l-2 px-4 py-3 text-sm ${
            feedback.ok ? 'border-leaf bg-leaf-3 text-leaf' : 'border-clay bg-clay-2 text-clay'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {editing ? (
        <section className="border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3.5 font-display text-lg text-ink">
            {editing.id ? `Edit ${editing.code}` : 'New coupon'}
          </h2>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Code"
                value={editing.code}
                onChange={(v) => set('code', v.toUpperCase())}
                mono
              />
              <Input
                label="Description"
                value={editing.description ?? ''}
                onChange={(v) => set('description', v)}
                hint="Internal note, not shown to shoppers"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-ink-2">Discount type</label>
                <select
                  value={editing.discountType}
                  onChange={(e) => set('discountType', e.target.value as CouponRow['discountType'])}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
                >
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED">Fixed amount off</option>
                  <option value="FREE_SHIPPING">Free shipping</option>
                </select>
              </div>
              {editing.discountType !== 'FREE_SHIPPING' && (
                <Input
                  label={editing.discountType === 'PERCENTAGE' ? 'Percent off' : 'Amount off ₹'}
                  type="number"
                  value={String(editing.value)}
                  onChange={(v) => set('value', Number(v))}
                />
              )}
              {editing.discountType === 'PERCENTAGE' && (
                <Input
                  label="Cap the discount at ₹"
                  type="number"
                  value={editing.maxDiscount == null ? '' : String(editing.maxDiscount)}
                  onChange={(v) => set('maxDiscount', v === '' ? null : Number(v))}
                  hint="Leave blank for no cap"
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Minimum order ₹"
                type="number"
                value={String(editing.minOrderValue)}
                onChange={(v) => set('minOrderValue', Number(v))}
              />
              <Input
                label="Total uses allowed"
                type="number"
                value={editing.usageLimit == null ? '' : String(editing.usageLimit)}
                onChange={(v) => set('usageLimit', v === '' ? null : Number(v))}
                hint="Blank = unlimited"
              />
              <Input
                label="Uses per customer"
                type="number"
                value={editing.usageLimitPerUser == null ? '' : String(editing.usageLimitPerUser)}
                onChange={(v) => set('usageLimitPerUser', v === '' ? null : Number(v))}
                hint="Blank = unlimited"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Starts"
                type="date"
                value={editing.startsAt ?? ''}
                onChange={(v) => set('startsAt', v || null)}
              />
              <Input
                label="Ends"
                type="date"
                value={editing.endsAt ?? ''}
                onChange={(v) => set('endsAt', v || null)}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="h-4 w-4 accent-[#1f5c40]"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={editing.stackable}
                  onChange={(e) => set('stackable', e.target.checked)}
                  className="h-4 w-4 accent-[#1f5c40]"
                />
                Can be combined with other codes
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
              >
                {pending ? 'Saving…' : 'Save coupon'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border border-line px-5 py-2.5 text-sm text-ink-2 hover:bg-bone-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setEditing({ ...BLANK })}
          className="bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
        >
          Create a coupon
        </button>
      )}

      <section className="border border-line bg-white p-5">
        <Table
          head={['Code', 'Discount', 'Minimum', 'Used', 'Window', 'Status', '']}
          empty="No coupons yet."
        >
          {coupons.map((c) => (
            <tr key={c.id} className="hover:bg-bone-2">
              <td className="px-3 py-2.5">
                <span className="font-mono font-medium text-ink">{c.code}</span>
                {c.description && (
                  <span className="block text-xs text-ink-3">{c.description}</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-ink-2">
                {c.discountType === 'FREE_SHIPPING'
                  ? 'Free shipping'
                  : c.discountType === 'PERCENTAGE'
                    ? `${c.value}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                    : `₹${c.value} off`}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-ink-3">
                {c.minOrderValue > 0 ? `₹${c.minOrderValue}` : '—'}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-ink-3">
                {c.timesUsed}
                {c.usageLimit != null && ` / ${c.usageLimit}`}
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-3">
                {c.startsAt ?? '—'} → {c.endsAt ?? '—'}
              </td>
              <td className="px-3 py-2.5">
                <Badge className={c.isActive ? 'bg-leaf-3 text-leaf' : 'bg-bone-3 text-ink-3'}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="text-sm text-leaf hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deleteCouponAction(c.id);
                      setFeedback({ ok: res.ok, text: res.message ?? '' });
                      router.refresh();
                    })
                  }
                  className="ml-3 text-sm text-clay hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
