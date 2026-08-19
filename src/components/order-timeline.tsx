import type { OrderStatus } from '@/generated/prisma';
import { ORDER_FLOW, STATUS_LABEL } from '@/lib/order-status';

/** ORD-04 — customer-facing status timeline. */
export function OrderTimeline({
  status,
  events,
}: {
  status: OrderStatus;
  events: { status: OrderStatus | null; message: string; createdAt: Date }[];
}) {
  const terminal: OrderStatus[] = ['CANCELLED', 'PAYMENT_FAILED', 'REFUNDED'];

  if (terminal.includes(status)) {
    return (
      <ol className="space-y-4">
        {events.map((e, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-3" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">
                {e.status ? STATUS_LABEL[e.status] : 'Update'}
              </p>
              <p className="text-sm text-ink-3">{e.message}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                {e.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  const currentIndex = ORDER_FLOW.indexOf(status);
  const reached = (s: OrderStatus) => ORDER_FLOW.indexOf(s) <= currentIndex;
  const eventFor = (s: OrderStatus) => events.find((e) => e.status === s);

  return (
    <ol className="relative space-y-6 border-l border-line pl-6">
      {ORDER_FLOW.map((step) => {
        const done = reached(step);
        const event = eventFor(step);
        return (
          <li key={step} className="relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 ${
                done ? 'border-leaf bg-leaf' : 'border-line bg-bone'
              }`}
            />
            <p className={`text-sm font-medium ${done ? 'text-ink' : 'text-ink-3'}`}>
              {STATUS_LABEL[step]}
            </p>
            {event && (
              <>
                <p className="text-sm text-ink-3">{event.message}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {event.createdAt.toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
