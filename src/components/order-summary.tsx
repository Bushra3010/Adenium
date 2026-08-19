import { formatINR } from '@/lib/money';
import type { CartTotals } from '@/lib/cart';

export function OrderSummary({ totals }: { totals: CartTotals }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-3">Subtotal</dt>
        <dd className="tabular-nums text-ink">{formatINR(totals.subtotal)}</dd>
      </div>

      {totals.discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-leaf">
            Discount{totals.couponCode ? ` (${totals.couponCode})` : ''}
          </dt>
          <dd className="tabular-nums text-leaf">−{formatINR(totals.discount)}</dd>
        </div>
      )}

      <div className="flex justify-between">
        <dt className="text-ink-3">Shipping</dt>
        <dd className="tabular-nums text-ink">
          {totals.shipping === 0 ? (
            <span className="text-leaf">Free</span>
          ) : (
            formatINR(totals.shipping)
          )}
        </dd>
      </div>

      {totals.tax > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink-3">Tax</dt>
          <dd className="tabular-nums text-ink">{formatINR(totals.tax)}</dd>
        </div>
      )}

      <div className="flex justify-between border-t border-line pt-3 text-base">
        <dt className="font-medium text-ink">Total</dt>
        <dd className="font-display text-xl tabular-nums text-ink">{formatINR(totals.total)}</dd>
      </div>

      {totals.amountToFreeShipping > 0 && (
        <p className="border-t border-line pt-3 text-xs text-ink-3">
          Add {formatINR(totals.amountToFreeShipping)} more for free shipping.
        </p>
      )}
    </dl>
  );
}
