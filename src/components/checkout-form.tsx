'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { placeOrder, type PlaceOrderResult } from '@/actions/checkout';
import { INDIAN_STATES } from '@/lib/india';

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutForm({
  addresses,
  signedIn,
  defaultEmail,
  simulated,
}: {
  addresses: SavedAddress[];
  signedIn: boolean;
  defaultEmail: string;
  simulated: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'creating' | 'paying' | 'verifying'>('idle');

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [selectedId, setSelectedId] = useState<string>(defaultAddress?.id ?? 'new');

  const selected = addresses.find((a) => a.id === selectedId);
  const usingNew = selectedId === 'new' || !selected;

  async function verifyAndFinish(order: Extract<PlaceOrderResult, { ok: true }>, payment: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    setStage('verifying');
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.orderId, ...payment }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'We could not confirm the payment. Contact us before trying again.');
      setStage('idle');
      return;
    }
    router.push(`/order/confirmation/${order.orderId}`);
  }

  function openGateway(order: Extract<PlaceOrderResult, { ok: true }>) {
    // Simulated gateway for development, until the client's Razorpay account
    // is live (PRD §11, item 4).
    if (order.simulated) {
      setStage('paying');
      void verifyAndFinish(order, {
        razorpayOrderId: order.gatewayOrderId,
        razorpayPaymentId: `sim_pay_${Date.now()}`,
        razorpaySignature: `sim_sig_${order.gatewayOrderId}`,
      });
      return;
    }

    if (!window.Razorpay) {
      setError('The payment window could not load. Check your connection and try again.');
      setStage('idle');
      return;
    }

    setStage('paying');
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: 'INR',
      name: 'Adenium',
      description: `Order ${order.orderNumber}`,
      order_id: order.gatewayOrderId,
      prefill: {
        name: order.customerName,
        email: order.customerEmail,
        contact: order.customerPhone,
      },
      theme: { color: '#1f5c40' },
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) =>
        void verifyAndFinish(order, {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      modal: {
        // PAY-04 — cart stays intact, the shopper can simply try again.
        ondismiss: () => {
          setStage('idle');
          setError('Payment was not completed. Your cart is still here whenever you are ready.');
        },
      },
    });
    checkout.open();
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload = usingNew
      ? {
          fullName: String(formData.get('fullName') ?? ''),
          phone: String(formData.get('phone') ?? ''),
          line1: String(formData.get('line1') ?? ''),
          line2: String(formData.get('line2') ?? ''),
          landmark: String(formData.get('landmark') ?? ''),
          city: String(formData.get('city') ?? ''),
          state: String(formData.get('state') ?? ''),
          pincode: String(formData.get('pincode') ?? ''),
          email: String(formData.get('email') ?? ''),
          customerNote: String(formData.get('customerNote') ?? ''),
          saveAddress: formData.get('saveAddress') === 'on',
        }
      : {
          fullName: selected!.fullName,
          phone: selected!.phone,
          line1: selected!.line1,
          line2: selected!.line2 ?? '',
          landmark: selected!.landmark ?? '',
          city: selected!.city,
          state: selected!.state,
          pincode: selected!.pincode,
          email: String(formData.get('email') ?? ''),
          customerNote: String(formData.get('customerNote') ?? ''),
          saveAddress: false,
        };

    startTransition(async () => {
      setStage('creating');
      const result = await placeOrder(payload);
      if (!result.ok) {
        setError(result.message);
        setStage('idle');
        return;
      }
      openGateway(result);
    });
  }

  const busy = pending || stage !== 'idle';

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && (
        <p role="alert" className="border-l-2 border-clay bg-clay-2 px-4 py-3 text-sm text-clay">
          {error}
        </p>
      )}

      <section>
        <h2 className="font-display text-xl text-ink">Delivery address</h2>

        {addresses.length > 0 && (
          <div className="mt-4 space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 border p-4 ${
                  selectedId === a.id ? 'border-leaf bg-leaf-3' : 'border-line bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="addressChoice"
                  value={a.id}
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                  className="mt-1 h-4 w-4 accent-[#1f5c40]"
                />
                <span className="text-sm">
                  <span className="font-medium text-ink">{a.fullName}</span>
                  {a.isDefault && <span className="ml-2 text-xs text-leaf">Default</span>}
                  <br />
                  <span className="text-ink-2">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                  </span>
                  <br />
                  <span className="text-ink-3">{a.phone}</span>
                </span>
              </label>
            ))}

            <label
              className={`flex cursor-pointer gap-3 border p-4 ${
                selectedId === 'new' ? 'border-leaf bg-leaf-3' : 'border-line bg-white'
              }`}
            >
              <input
                type="radio"
                name="addressChoice"
                value="new"
                checked={selectedId === 'new'}
                onChange={() => setSelectedId('new')}
                className="mt-1 h-4 w-4 accent-[#1f5c40]"
              />
              <span className="text-sm font-medium text-ink">Deliver somewhere else</span>
            </label>
          </div>
        )}

        {usingNew && (
          <div className="mt-4 space-y-4 border border-line bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Full name" name="fullName" autoComplete="name" />
              <Text
                label="Mobile number"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                hint="10 digits, for delivery updates"
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>
            <Text label="Address line 1" name="line1" autoComplete="address-line1" />
            <Text label="Address line 2" name="line2" required={false} autoComplete="address-line2" />
            <Text label="Landmark" name="landmark" required={false} hint="Helps couriers find you" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Text label="City" name="city" autoComplete="address-level2" />
              <div>
                <label htmlFor="co-state" className="block text-sm font-medium text-ink-2">
                  State
                </label>
                <select
                  id="co-state"
                  name="state"
                  required
                  defaultValue=""
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
              <Text label="Pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" />
            </div>
            {signedIn && (
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 accent-[#1f5c40]" />
                Save this address to my account
              </label>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl text-ink">Contact</h2>
        <div className="mt-4 space-y-4 border border-line bg-white p-5">
          <Text
            label="Email address"
            name="email"
            type="email"
            defaultValue={defaultEmail}
            autoComplete="email"
            hint="Your receipt and delivery updates go here"
          />
          <div>
            <label htmlFor="co-note" className="block text-sm font-medium text-ink-2">
              Delivery notes <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <textarea
              id="co-note"
              name="customerNote"
              rows={2}
              maxLength={500}
              placeholder="Gate code, safe place to leave a parcel…"
              className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
            />
          </div>
        </div>
      </section>

      {simulated && (
        <p className="border-l-2 border-sun bg-sun-2 px-4 py-3 text-sm text-sun">
          <strong>Development mode.</strong> No payment gateway is configured, so the payment
          step is simulated and no money moves. Add your Razorpay keys to take real payments.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-leaf px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-leaf-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {stage === 'creating'
          ? 'Preparing your order…'
          : stage === 'paying'
            ? 'Waiting for payment…'
            : stage === 'verifying'
              ? 'Confirming payment…'
              : 'Pay now'}
      </button>

      <p className="text-center text-xs text-ink-3">
        Card details are handled entirely by the payment gateway and never reach this site.
      </p>
    </form>
  );
}

function Text({
  label,
  name,
  type = 'text',
  required = true,
  hint,
  inputMode,
  autoComplete,
  defaultValue,
  pattern,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
  autoComplete?: string;
  defaultValue?: string;
  pattern?: string;
  maxLength?: number;
}) {
  const id = `co-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label}
        {!required && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        pattern={pattern}
        maxLength={maxLength}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-leaf focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
