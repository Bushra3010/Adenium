'use client';

import { useState } from 'react';
import { BuyBox, type BuyBoxVariant } from './buy-box';

export type GalleryImage = { id: string; url: string; alt: string };

/**
 * Gallery and buy box share state so choosing a variant swaps the image
 * where that variant has one of its own (PDP-01, PDP-02).
 */
export function ProductShowcase({
  images,
  variants,
  optionLabels,
  header,
  footer,
}: {
  images: GalleryImage[];
  variants: BuyBoxVariant[];
  optionLabels: Record<string, string>;
  header: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState(images[0]?.id ?? '');
  const [zoomed, setZoomed] = useState(false);

  const active = images.find((i) => i.id === activeId) ?? images[0];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div
          className={`relative aspect-square overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-sage/50 to-bone-2 ${
            zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setZoomed((z) => !z)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setZoomed((z) => !z);
            }
          }}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
        >
          {active && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={active.url}
              alt={active.alt}
              className={`h-full w-full object-contain p-6 transition-transform duration-300 ${
                zoomed ? 'scale-[1.8]' : 'scale-100'
              }`}
            />
          )}
        </div>

        {images.length > 1 && (
          <ul className="mt-3 flex gap-3">
            {images.map((image) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(image.id)}
                  aria-current={image.id === active?.id}
                  className={`block h-20 w-20 overflow-hidden rounded-xl border bg-gradient-to-b from-sage/45 to-bone-2 transition-colors ${
                    image.id === active?.id ? 'border-leaf' : 'border-line hover:border-ink-3'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.alt} className="h-full w-full object-contain p-1.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        {header}
        <div className="mt-7">
          <BuyBox
            variants={variants}
            optionLabels={optionLabels}
            onVariantImage={(url) => {
              if (!url) return;
              const match = images.find((i) => i.url === url);
              if (match) setActiveId(match.id);
            }}
          />
        </div>
        {footer}
      </div>
    </div>
  );
}
