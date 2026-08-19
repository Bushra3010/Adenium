import { z } from 'zod';

/**
 * Shared input schemas. Kept out of the `'use server'` action files, which may
 * only export async functions.
 */
export const addressSchema = z.object({
  fullName: z.string().min(2, 'Enter the recipient name.').max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'),
  line1: z.string().min(4, 'Enter the address.').max(160),
  line2: z.string().max(160).optional().or(z.literal('')),
  landmark: z.string().max(120).optional().or(z.literal('')),
  city: z.string().min(2, 'Enter the city.').max(80),
  state: z.string().min(2, 'Choose the state.').max(80),
  pincode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode.'),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = addressSchema.omit({ isDefault: true }).extend({
  email: z.email('Enter a valid email address.'),
  customerNote: z.string().max(500).optional().or(z.literal('')),
  saveAddress: z.boolean().optional(),
});

export const passwordRule = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .regex(/[a-zA-Z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.');
