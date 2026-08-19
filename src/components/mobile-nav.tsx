'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Tree = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}[];

export function MobileNav({ tree }: { tree: Tree }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-2 text-ink-2 hover:bg-bone-2 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            aria-label="Main"
            className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-bone p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl text-ink">Adenium</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 text-ink-2 hover:bg-bone-2"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 space-y-7">
              {tree.map((parent) => (
                <div key={parent.id}>
                  <Link
                    href={`/${parent.slug}`}
                    onClick={() => setOpen(false)}
                    className="font-display text-lg text-ink"
                  >
                    {parent.name}
                  </Link>
                  <ul className="mt-3 space-y-2 border-l border-line pl-4">
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/${parent.slug}/${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="text-sm text-ink-2 hover:text-leaf"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="space-y-2 border-t border-line pt-6 text-sm">
                <Link href="/guides" onClick={() => setOpen(false)} className="block text-ink-2 hover:text-leaf">Growing guides</Link>
                <Link href="/track" onClick={() => setOpen(false)} className="block text-ink-2 hover:text-leaf">Track an order</Link>
                <Link href="/account" onClick={() => setOpen(false)} className="block text-ink-2 hover:text-leaf">Your account</Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
