'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveProductAction } from '@/actions/admin-catalog';

export type EditorCategory = { id: string; name: string; parentName: string | null; type: string };
export type EditorAttribute = { key: string; label: string; unit: string | null; appliesTo: string };
export type EditorOptionType = { key: string; label: string; appliesTo: string; values: string[] };

export type EditorVariant = {
  id?: string;
  optionValues: Record<string, string>;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQty: number;
  weightG: number;
  isActive: boolean;
};

export type EditorProduct = {
  id?: string;
  type: 'SEED' | 'PLANT';
  name: string;
  botanicalName: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  careGuide: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  categoryIds: string[];
  attributes: Record<string, string>;
  variants: EditorVariant[];
};

const EMPTY_VARIANT: EditorVariant = {
  optionValues: {},
  sku: '',
  price: 0,
  compareAtPrice: null,
  stockQty: 0,
  weightG: 100,
  isActive: true,
};

export function ProductEditor({
  initial,
  categories,
  attributes,
  optionTypes,
}: {
  initial: EditorProduct;
  categories: EditorCategory[];
  attributes: EditorAttribute[];
  optionTypes: EditorOptionType[];
}) {
  const router = useRouter();
  const [product, setProduct] = useState<EditorProduct>(initial);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof EditorProduct>(key: K, value: EditorProduct[K]) =>
    setProduct((p) => ({ ...p, [key]: value }));

  const relevantAttributes = attributes.filter(
    (a) => a.appliesTo === 'BOTH' || a.appliesTo === product.type,
  );
  const relevantOptions = optionTypes.filter(
    (o) => o.appliesTo === 'BOTH' || o.appliesTo === product.type,
  );
  const relevantCategories = categories.filter((c) => c.type === product.type);

  function updateVariant(index: number, patch: Partial<EditorVariant>) {
    setProduct((p) => ({
      ...p,
      variants: p.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveProductAction({
        ...product,
        botanicalName: product.botanicalName || null,
        shortDescription: product.shortDescription || null,
        description: product.description || null,
        careGuide: product.careGuide || null,
        metaTitle: product.metaTitle || null,
        metaDescription: product.metaDescription || null,
        slug: product.slug || undefined,
        variants: product.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice == null || v.compareAtPrice === 0 ? null : Number(v.compareAtPrice),
          stockQty: Number(v.stockQty),
          weightG: Number(v.weightG),
        })),
      });
      setFeedback({ ok: res.ok, text: res.message ?? '' });
      if (res.ok && res.id && !product.id) router.push(`/admin/products/${res.id}`);
      else if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role={feedback.ok ? 'status' : 'alert'}
          className={`border-l-2 px-4 py-3 text-sm ${
            feedback.ok ? 'border-leaf bg-leaf-3 text-leaf' : 'border-clay bg-clay-2 text-clay'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" value={product.name} onChange={(v) => set('name', v)} />
              <Field
                label="Botanical name"
                value={product.botanicalName}
                onChange={(v) => set('botanicalName', v)}
                placeholder="Adenium arabicum"
              />
              <Field label="Product SKU" value={product.sku} onChange={(v) => set('sku', v)} mono />
              <Field
                label="URL slug"
                value={product.slug}
                onChange={(v) => set('slug', v)}
                hint="Leave blank to generate from the name"
                mono
              />
            </div>

            <div className="mt-4">
              <span className="block text-sm font-medium text-ink-2">Product type</span>
              <div className="mt-2 flex gap-2">
                {(['SEED', 'PLANT'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`border px-4 py-2 text-sm ${
                      product.type === t
                        ? 'border-leaf bg-leaf text-white'
                        : 'border-line bg-white text-ink-2 hover:border-leaf'
                    }`}
                  >
                    {t === 'SEED' ? 'Seeds' : 'Plant'}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-3">
                Determines which option types and attributes are offered below.
              </p>
            </div>

            <div className="mt-4">
              <TextArea
                label="Short description"
                value={product.shortDescription}
                onChange={(v) => set('shortDescription', v)}
                rows={2}
                hint="One line, shown on product cards"
              />
            </div>
          </Section>

          <Section title="Content">
            <TextArea
              label="Full description"
              value={product.description}
              onChange={(v) => set('description', v)}
              rows={8}
              hint="Markdown-lite: ## headings, **bold**, - lists"
            />
            <div className="mt-4">
              <TextArea
                label={product.type === 'SEED' ? 'Growing & germination guide' : 'Growing & care guide'}
                value={product.careGuide}
                onChange={(v) => set('careGuide', v)}
                rows={12}
                hint="Shown as its own tab on the product page"
              />
            </div>
          </Section>

          <Section title="Variants">
            <p className="mb-4 text-sm text-ink-3">
              Every product needs at least one. The first is preselected on the product page.
            </p>

            <div className="space-y-4">
              {product.variants.map((variant, index) => (
                <div key={index} className="border border-line bg-bone-2 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      Variant {index + 1}
                      {index === 0 && <span className="ml-2 text-xs text-leaf">Default</span>}
                    </span>
                    {product.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProduct((p) => ({
                            ...p,
                            variants: p.variants.filter((_, i) => i !== index),
                          }))
                        }
                        className="text-sm text-clay hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {relevantOptions.map((option) => (
                      <div key={option.key}>
                        <label className="block text-xs font-medium text-ink-2">
                          {option.label}
                        </label>
                        <input
                          list={`opt-${option.key}`}
                          value={variant.optionValues[option.key] ?? ''}
                          onChange={(e) =>
                            updateVariant(index, {
                              optionValues: {
                                ...variant.optionValues,
                                [option.key]: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full border border-line bg-white px-2.5 py-1.5 text-sm focus:border-leaf focus:outline-none"
                        />
                        <datalist id={`opt-${option.key}`}>
                          {option.values.map((v) => (
                            <option key={v} value={v} />
                          ))}
                        </datalist>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-5">
                    <SmallField
                      label="SKU"
                      value={variant.sku}
                      onChange={(v) => updateVariant(index, { sku: v })}
                      mono
                    />
                    <SmallField
                      label="Price ₹"
                      type="number"
                      value={String(variant.price)}
                      onChange={(v) => updateVariant(index, { price: Number(v) })}
                    />
                    <SmallField
                      label="Was ₹"
                      type="number"
                      value={variant.compareAtPrice == null ? '' : String(variant.compareAtPrice)}
                      onChange={(v) =>
                        updateVariant(index, { compareAtPrice: v === '' ? null : Number(v) })
                      }
                    />
                    <SmallField
                      label="Stock"
                      type="number"
                      value={String(variant.stockQty)}
                      onChange={(v) => updateVariant(index, { stockQty: Number(v) })}
                    />
                    <SmallField
                      label="Weight g"
                      type="number"
                      value={String(variant.weightG)}
                      onChange={(v) => updateVariant(index, { weightG: Number(v) })}
                    />
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm text-ink-2">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                      className="h-4 w-4 accent-[#1f5c40]"
                    />
                    Available for sale
                  </label>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setProduct((p) => ({ ...p, variants: [...p.variants, { ...EMPTY_VARIANT }] }))
              }
              className="mt-4 border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
            >
              Add a variant
            </button>
          </Section>

          <Section title="Specifications">
            <p className="mb-4 text-sm text-ink-3">
              Rendered as the specifications tab, and used for the catalog filters.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {relevantAttributes.map((attr) => (
                <div key={attr.key}>
                  <label className="block text-xs font-medium text-ink-2">
                    {attr.label}
                    {attr.unit && <span className="text-ink-3"> ({attr.unit})</span>}
                  </label>
                  <input
                    value={product.attributes[attr.key] ?? ''}
                    onChange={(e) =>
                      set('attributes', { ...product.attributes, [attr.key]: e.target.value })
                    }
                    className="mt-1 w-full border border-line bg-white px-2.5 py-1.5 text-sm focus:border-leaf focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Search engine listing">
            <Field
              label="Meta title"
              value={product.metaTitle}
              onChange={(v) => set('metaTitle', v)}
              hint="Falls back to the product name"
            />
            <div className="mt-4">
              <TextArea
                label="Meta description"
                value={product.metaDescription}
                onChange={(v) => set('metaDescription', v)}
                rows={2}
                hint="Around 155 characters"
              />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Publishing">
            <label className="block text-sm font-medium text-ink-2">Status</label>
            <select
              value={product.status}
              onChange={(e) => set('status', e.target.value as EditorProduct['status'])}
              className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
            >
              <option value="DRAFT">Draft — not on the storefront</option>
              <option value="ACTIVE">Active — on sale</option>
              <option value="ARCHIVED">Archived — hidden</option>
            </select>

            <label className="mt-4 flex items-center gap-2 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={product.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="h-4 w-4 accent-[#1f5c40]"
              />
              Feature on the home page
            </label>

            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="mt-5 w-full bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
            >
              {pending ? 'Saving…' : product.id ? 'Save changes' : 'Create product'}
            </button>
          </Section>

          <Section title="Categories">
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {relevantCategories.map((c) => (
                <label key={c.id} className="flex items-start gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    checked={product.categoryIds.includes(c.id)}
                    onChange={(e) =>
                      set(
                        'categoryIds',
                        e.target.checked
                          ? [...product.categoryIds, c.id]
                          : product.categoryIds.filter((id) => id !== c.id),
                      )
                    }
                    className="mt-0.5 h-4 w-4 accent-[#1f5c40]"
                  />
                  <span>
                    {c.name}
                    {c.parentName && <span className="block text-xs text-ink-3">in {c.parentName}</span>}
                  </span>
                </label>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3.5 font-display text-lg text-ink">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

function SmallField({
  label,
  value,
  onChange,
  type = 'text',
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full border border-line bg-white px-2.5 py-1.5 text-sm focus:border-leaf focus:outline-none ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
