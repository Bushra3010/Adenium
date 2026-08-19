'use client';

import { useState } from 'react';

export type TabItem = { id: string; label: string; count?: number; content: React.ReactNode };

/** PDP-05 — Description · Growing & Care · Specifications · Reviews · Shipping. */
export function Tabs({ items }: { items: TabItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  return (
    <div>
      <div className="overflow-x-auto border-b border-line">
        <div role="tablist" className="flex min-w-max gap-1">
          {items.map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              id={`tab-${item.id}`}
              aria-selected={active === item.id}
              aria-controls={`panel-${item.id}`}
              onClick={() => setActive(item.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active === item.id
                  ? 'border-leaf text-leaf'
                  : 'border-transparent text-ink-3 hover:text-ink-2'
              }`}
            >
              {item.label}
              {item.count != null && (
                <span className="ml-1.5 text-xs text-ink-3">({item.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          hidden={active !== item.id}
          className="py-8"
        >
          {active === item.id && item.content}
        </div>
      ))}
    </div>
  );
}

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-ink marker:hidden">
            {item.question}
            <span className="shrink-0 text-ink-3 transition-transform group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="pb-4 leading-relaxed text-ink-2">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
