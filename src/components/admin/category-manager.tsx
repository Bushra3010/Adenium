'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveCategoryAction, deleteCategoryAction } from '@/actions/admin-catalog';

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'SEED' | 'PLANT';
  parentId: string | null;
  position: number;
  isActive: boolean;
  productCount: number;
};

const BLANK: CategoryRow = {
  id: '',
  name: '',
  slug: '',
  description: '',
  type: 'SEED',
  parentId: null,
  position: 0,
  isActive: true,
  productCount: 0,
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const parents = categories.filter((c) => c.parentId === null);
  const set = <K extends keyof CategoryRow>(key: K, value: CategoryRow[K]) =>
    setEditing((c) => (c ? { ...c, [key]: value } : c));

  function save() {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveCategoryAction({
        id: editing.id || undefined,
        name: editing.name,
        slug: editing.slug || undefined,
        description: editing.description || null,
        type: editing.type,
        parentId: editing.parentId,
        position: Number(editing.position),
        isActive: editing.isActive,
      });
      setFeedback({ ok: res.ok, text: res.message ?? '' });
      if (res.ok) {
        setEditing(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          className={`border-l-2 px-4 py-3 text-sm ${
            feedback.ok ? 'border-leaf bg-leaf-3 text-leaf' : 'border-clay bg-clay-2 text-clay'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {editing ? (
        <section className="border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3.5 font-display text-lg text-ink">
            {editing.id ? `Edit ${editing.name}` : 'New category'}
          </h2>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink-2">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-2">URL slug</label>
                <input
                  value={editing.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="Generated from the name"
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 font-mono text-sm focus:border-leaf focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-2">Description</label>
              <textarea
                rows={2}
                value={editing.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-ink-2">Sits under</label>
                <select
                  value={editing.parentId ?? ''}
                  onChange={(e) => set('parentId', e.target.value || null)}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
                >
                  <option value="">Top level</option>
                  {parents
                    .filter((p) => p.id !== editing.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-2">Product type</label>
                <select
                  value={editing.type}
                  onChange={(e) => set('type', e.target.value as 'SEED' | 'PLANT')}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
                >
                  <option value="SEED">Seeds</option>
                  <option value="PLANT">Plants</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-2">Sort position</label>
                <input
                  type="number"
                  value={editing.position}
                  onChange={(e) => set('position', Number(e.target.value))}
                  className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:border-leaf focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="h-4 w-4 accent-[#1f5c40]"
              />
              Show in navigation
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-60"
              >
                {pending ? 'Saving…' : 'Save category'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border border-line px-5 py-2.5 text-sm text-ink-2 hover:bg-bone-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setEditing({ ...BLANK })}
          className="bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-2"
        >
          Add a category
        </button>
      )}

      <div className="space-y-4">
        {parents.map((parent) => (
          <section key={parent.id} className="border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <h3 className="font-display text-lg text-ink">{parent.name}</h3>
                <p className="font-mono text-xs text-ink-3">/{parent.slug}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-3">{parent.productCount} products</span>
                <button
                  type="button"
                  onClick={() => setEditing(parent)}
                  className="text-leaf hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>

            <ul className="divide-y divide-line">
              {categories
                .filter((c) => c.parentId === parent.id)
                .map((child) => (
                  <li
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <span className="text-ink">{child.name}</span>
                      {!child.isActive && (
                        <span className="ml-2 bg-bone-3 px-2 py-0.5 text-xs text-ink-3">Hidden</span>
                      )}
                      <span className="block font-mono text-xs text-ink-3">
                        /{parent.slug}/{child.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-ink-3">{child.productCount} products</span>
                      <button
                        type="button"
                        onClick={() => setEditing(child)}
                        className="text-leaf hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteCategoryAction(child.id);
                            setFeedback({ ok: res.ok, text: res.message ?? '' });
                            router.refresh();
                          })
                        }
                        className="text-clay hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
