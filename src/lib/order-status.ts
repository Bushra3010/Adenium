import type { OrderStatus } from '@/generated/prisma';

export const ORDER_FLOW: OrderStatus[] = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment failed',
  REFUNDED: 'Refunded',
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-sun-2 text-sun',
  CONFIRMED: 'bg-leaf-3 text-leaf',
  PACKED: 'bg-leaf-3 text-leaf',
  SHIPPED: 'bg-leaf-3 text-leaf',
  DELIVERED: 'bg-leaf text-white',
  CANCELLED: 'bg-bone-3 text-ink-3',
  PAYMENT_FAILED: 'bg-clay-2 text-clay',
  REFUNDED: 'bg-bone-3 text-ink-2',
};

/** Transitions an operator may make from a given state (ORD-02). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  PAYMENT_FAILED: [],
  REFUNDED: [],
};

export function statusBadge(status: OrderStatus) {
  return { label: STATUS_LABEL[status], className: STATUS_TONE[status] };
}
