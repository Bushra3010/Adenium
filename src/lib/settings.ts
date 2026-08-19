import { prisma } from './prisma';

/**
 * Store settings (ADM-10). Shipping values implement SHP-01/SHP-02 —
 * flat rate, charged separately for seeds-only vs plant-bearing orders,
 * waived above a configurable order value.
 */
export type StoreSettings = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  /** Flat shipping for orders containing only seeds (SHP-01). */
  shippingFlatSeeds: number;
  /** Flat shipping for orders containing at least one live plant (SHP-01). */
  shippingFlatPlants: number;
  /** Order subtotal at or above which shipping is free (SHP-02). 0 disables. */
  freeShippingThreshold: number;
  /** Tax percent applied to the discounted subtotal. 0 = prices are tax-inclusive. */
  taxPercent: number;
  /** Minutes a pending order holds its stock reservation (CHK-07). */
  reservationMinutes: number;
  lowStockThreshold: number;
  currency: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Adenium',
  storeEmail: 'orders@adenium.example',
  storePhone: '+91 00000 00000',
  storeAddress: 'India',
  shippingFlatSeeds: 49,
  shippingFlatPlants: 149,
  freeShippingThreshold: 1200,
  taxPercent: 0,
  reservationMinutes: 30,
  lowStockThreshold: 3,
  currency: 'INR',
};

const SETTINGS_KEY = 'store';

export async function getSettings(): Promise<StoreSettings> {
  const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.value as Partial<StoreSettings>) };
}

export async function saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: next },
    update: { value: next },
  });
  return next;
}
