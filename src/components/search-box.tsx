'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, Sliders } from './icons';

type Suggestion = { slug: string; name: string; type: string; image: string };

/** Header search with type-ahead suggestions (SRCH-01, SRCH-02). */
export function SearchBox({ mobile = false }: { mobile?: boolean } = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    const controller = new AbortController();

    // All state changes happen inside the debounce callback: updating state
    // synchronously in the effect body would cascade an extra render.
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setItems([]);
        return;
      }
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setItems(await res.json());
          setOpen(true);
        }
      } catch {
        /* aborted */
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={boxRef} className={`relative w-full ${mobile ? '' : 'max-w-[420px]'}`}>
      <form onSubmit={submit} role="search">
        <label htmlFor="site-search" className="sr-only">
          Search seeds and plants
        </label>
        <div className="relative">
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            id="site-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => items.length > 0 && setOpen(true)}
            placeholder="Search adenium, cactus, seeds…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && value.trim().length >= 2}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-activedescendant={open && value.trim().length >= 2 && items.length > 0 ? `suggestion-0` : undefined}
            className={`w-full border border-line bg-white pl-11 text-ink placeholder:text-ink-3 focus:border-leaf focus:outline-none ${
              mobile
                ? 'rounded-xl py-3 pr-12 text-[15px]'
                : 'rounded-full py-2.5 pr-4 text-[14px]'
            }`}
          />
          {mobile && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-3"
            >
              <Sliders size={19} />
            </span>
          )}
        </div>
      </form>

      {open && value.trim().length >= 2 && items.length > 0 && (
        <ul id="search-suggestions" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-2xl border border-line bg-white py-1 shadow-xl" role="listbox" aria-label="Search suggestions">
          {items.map((s, i) => (
            <li key={s.slug} role="option" id={`suggestion-${i}`} aria-selected="false">
              <a
                href={`/product/${s.slug}`}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-leaf-3"
                onClick={() => setOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" width={36} height={36} className="h-10 w-10 rounded-lg object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-ink">{s.name}</span>
                  <span className="text-xs uppercase tracking-wide text-ink-3">
                    {s.type === 'SEED' ? 'Seeds' : 'Plant'}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
