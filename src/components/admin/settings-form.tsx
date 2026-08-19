'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveSettingsAction } from '@/actions/admin-catalog';
import type { StoreSettings } from '@/lib/settings';

export function SettingsForm({ initial }: { initial: StoreSettings }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  function save() {
    startTransition(async () => {
      const res = await saveSettingsAction({
        storeName: settings.storeName,
        storeEmail: settings.storeEmail,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
        shippingFlatSeeds: Number(settings.shippingFlatSeeds),
        shippingFlatPlants: Number(settings.shippingFlatPlants),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
        taxPercent: Number(settings.taxPercent),
        reservationMinutes: Number(settings.reservationMinutes),
        lowStockThreshold: Number(settings.lowStockThreshold),
      });
      setFeedback({ ok: res.ok, text: res.message ?? '' });
      if (res.ok) router.refresh();
    });
  }

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

      <Section title="Store details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Store name" value={settings.storeName} onChange={(v) => set('storeName', v)} />
          <Input
            label="Contact email"
            value={settings.storeEmail}
            onChange={(v) => set('storeEmail', v)}
            type="email"
          />
          <Input label="Phone" value={settings.storePhone} onChange={(v) => set('storePhone', v)} />
          <Input
            label="Address"
            value={settings.storeAddress}
            onChange={(v) => set('storeAddress', v)}
          />
        </div>
      </Section>

      <Section title="Shipping">
        <p className="mb-4 text-sm text-ink-3">
          One flat rate for seed-only orders and another when the basket contains a live plant,
          since plants ship in different packaging. Both are waived above the free-shipping
          threshold.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Flat rate, seeds only ₹"
            type="number"
            value={String(settings.shippingFlatSeeds)}
            onChange={(v) => set('shippingFlatSeeds', Number(v))}
          />
          <Input
            label="Flat rate, with plants ₹"
            type="number"
            value={String(settings.shippingFlatPlants)}
            onChange={(v) => set('shippingFlatPlants', Number(v))}
          />
          <Input
            label="Free shipping above ₹"
            type="number"
            value={String(settings.freeShippingThreshold)}
            onChange={(v) => set('freeShippingThreshold', Number(v))}
            hint="0 disables free shipping"
          />
        </div>
      </Section>

      <Section title="Tax">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Tax percent"
            type="number"
            value={String(settings.taxPercent)}
            onChange={(v) => set('taxPercent', Number(v))}
            hint="0 means your listed prices already include tax"
          />
        </div>
      </Section>

      <Section title="Stock handling">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Hold stock for (minutes)"
            type="number"
            value={String(settings.reservationMinutes)}
            onChange={(v) => set('reservationMinutes', Number(v))}
            hint="How long an unpaid order keeps its stock reserved"
          />
          <Input
            label="Low stock warning at"
            type="number"
            value={String(settings.lowStockThreshold)}
            onChange={(v) => set('lowStockThreshold', Number(v))}
            hint="Flags variants at or below this quantity"
          />
        </div>
      </Section>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="bg-leaf px-6 py-3 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3.5 font-display text-lg text-ink">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
