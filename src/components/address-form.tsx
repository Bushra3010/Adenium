'use client';

import { useActionState } from 'react';
import { saveAddressAction, type AddressState } from '@/actions/address';
import { INDIAN_STATES } from '@/lib/india';

export type AddressValues = {
  id?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
};

/** CHK-02 / ACC-03 — Indian pincode and mobile validation. */
export function AddressForm({
  values,
  onDone,
  submitLabel = 'Save address',
}: {
  values?: AddressValues;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AddressState, formData: FormData) => {
      const result = await saveAddressAction(prev, formData);
      if (result.success) onDone?.();
      return result;
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {values?.id && <input type="hidden" name="id" value={values.id} />}

      {state.error && (
        <p role="alert" className="border-l-2 border-clay bg-clay-2 px-3 py-2 text-sm text-clay">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="border-l-2 border-leaf bg-leaf-3 px-3 py-2 text-sm text-leaf">
          {state.success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Full name" name="fullName" defaultValue={values?.fullName} autoComplete="name" />
        <Text
          label="Mobile number"
          name="phone"
          defaultValue={values?.phone}
          inputMode="tel"
          autoComplete="tel"
          hint="10 digits, no country code"
        />
      </div>

      <Text label="Address line 1" name="line1" defaultValue={values?.line1} autoComplete="address-line1" />
      <Text
        label="Address line 2"
        name="line2"
        required={false}
        defaultValue={values?.line2 ?? ''}
        autoComplete="address-line2"
      />
      <Text
        label="Landmark"
        name="landmark"
        required={false}
        defaultValue={values?.landmark ?? ''}
        hint="Helps couriers find you"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Text label="City" name="city" defaultValue={values?.city} autoComplete="address-level2" />
        <div>
          <label htmlFor="addr-state" className="block text-sm font-medium text-ink-2">
            State
          </label>
          <select
            id="addr-state"
            name="state"
            required
            defaultValue={values?.state ?? ''}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
          >
            <option value="" disabled>
              Choose a state
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Text
          label="Pincode"
          name="pincode"
          defaultValue={values?.pincode}
          inputMode="numeric"
          autoComplete="postal-code"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={values?.isDefault}
          className="h-4 w-4 accent-[#1f5c40]"
        />
        Use this as my default address
      </label>

      <button
        type="submit"
        disabled={pending}
        className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function Text({
  label,
  name,
  defaultValue,
  required = true,
  hint,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
  autoComplete?: string;
}) {
  const id = `addr-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label}
        {!required && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
