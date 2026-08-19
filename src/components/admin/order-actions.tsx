'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatusAction, saveOrderNoteAction, markOrderPaidAction } from '@/actions/admin-orders';
import { STATUS_LABEL } from '@/lib/order-status';
import type { OrderStatus } from '@/generated/prisma';

export function OrderActions({
  orderId,
  status,
  allowed,
  courierName,
  awbNumber,
  adminNote,
  paymentStatus,
  isAdmin,
}: {
  orderId: string;
  status: OrderStatus;
  allowed: OrderStatus[];
  courierName: string | null;
  awbNumber: string | null;
  adminNote: string | null;
  paymentStatus: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<OrderStatus | ''>('');
  const [courier, setCourier] = useState(courierName ?? '');
  const [awb, setAwb] = useState(awbNumber ?? '');
  const [note, setNote] = useState('');
  const [adminNoteDraft, setAdminNoteDraft] = useState(adminNote ?? '');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  function apply() {
    if (!target) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId,
        status: target,
        courierName: courier,
        awbNumber: awb,
        note,
      });
      setFeedback({ ok: res.ok, text: res.message ?? '' });
      if (res.ok) {
        setTarget('');
        setNote('');
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-leaf' : 'text-clay'}`}>{feedback.text}</p>
      )}

      {allowed.length === 0 ? (
        <p className="text-sm text-ink-3">
          This order is {STATUS_LABEL[status].toLowerCase()} — no further changes are possible here.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="next-status" className="block text-sm font-medium text-ink-2">
              Move to
            </label>
            <select
              id="next-status"
              value={target}
              onChange={(e) => setTarget(e.target.value as OrderStatus)}
              className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
            >
              <option value="">Choose a status…</option>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {target === 'SHIPPED' && (
            <div className="space-y-3 border-l-2 border-leaf bg-leaf-3 p-3">
              <div>
                <label htmlFor="courier" className="block text-sm font-medium text-ink-2">
                  Courier
                </label>
                <input
                  id="courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="Delhivery, DTDC, India Post…"
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="awb" className="block text-sm font-medium text-ink-2">
                  AWB / tracking number
                </label>
                <input
                  id="awb"
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm font-mono focus:border-leaf focus:outline-none"
                />
              </div>
              <p className="text-xs text-leaf">
                The customer is emailed this tracking number automatically.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="transition-note" className="block text-sm font-medium text-ink-2">
              Note for the customer <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <textarea
              id="transition-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Shown on their order timeline."
              className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={apply}
            disabled={pending || !target}
            className="w-full bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-50"
          >
            {pending ? 'Updating…' : 'Update order'}
          </button>
        </>
      )}

      {isAdmin && paymentStatus !== 'PAID' && status === 'PENDING_PAYMENT' && (
        <div className="border-t border-line pt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await markOrderPaidAction(orderId);
                setFeedback({ ok: res.ok, text: res.message ?? '' });
                if (res.ok) router.refresh();
              })
            }
            className="w-full border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white disabled:opacity-50"
          >
            Mark as paid manually
          </button>
          <p className="mt-2 text-xs text-ink-3">
            For payments taken outside the gateway. Decrements stock and emails the customer.
          </p>
        </div>
      )}

      <div className="border-t border-line pt-4">
        <label htmlFor="admin-note" className="block text-sm font-medium text-ink-2">
          Internal note
        </label>
        <textarea
          id="admin-note"
          rows={3}
          value={adminNoteDraft}
          onChange={(e) => setAdminNoteDraft(e.target.value)}
          placeholder="Only staff see this."
          className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveOrderNoteAction(orderId, adminNoteDraft);
              setFeedback({ ok: true, text: 'Internal note saved.' });
              router.refresh();
            })
          }
          className="mt-2 border border-line px-3 py-1.5 text-sm text-ink-2 hover:border-leaf hover:text-leaf"
        >
          Save note
        </button>
      </div>
    </div>
  );
}
