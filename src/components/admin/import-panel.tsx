'use client';

import { useState, useTransition } from 'react';
import { importProductsAction, importStockAction, type ImportReport } from '@/actions/admin-import';

type Mode = 'products' | 'stock';

export function ImportPanel({ templates }: { templates: Record<Mode, string> }) {
  const [mode, setMode] = useState<Mode>('products');
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pending, startTransition] = useTransition();

  function run(dryRun: boolean) {
    if (!csv.trim()) return;
    startTransition(async () => {
      const result =
        mode === 'products'
          ? await importProductsAction(csv, dryRun)
          : await importStockAction(csv, dryRun);
      setReport(result);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
    setReport(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['products', 'stock'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setReport(null);
            }}
            className={`border px-4 py-2 text-sm ${
              mode === m
                ? 'border-leaf bg-leaf text-white'
                : 'border-line bg-white text-ink-2 hover:border-leaf'
            }`}
          >
            {m === 'products' ? 'Products & variants' : 'Stock only'}
          </button>
        ))}
      </div>

      <section className="border border-line bg-white">
        <h2 className="border-b border-line px-5 py-3.5 font-display text-lg text-ink">
          {mode === 'products' ? 'Import products' : 'Update stock'}
        </h2>
        <div className="space-y-4 p-5">
          <p className="text-sm text-ink-3">
            {mode === 'products'
              ? 'One row per variant. Product columns repeat across a product’s rows. Existing products and variants are matched by SKU and updated in place.'
              : 'Two columns are enough: variant_sku and stock. Everything else is ignored.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white">
              Choose a CSV file
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={() => {
                setCsv(templates[mode]);
                setReport(null);
              }}
              className="text-sm text-leaf hover:underline"
            >
              Load the template
            </button>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(templates[mode])}`}
              download={mode === 'products' ? 'adenium-products-template.csv' : 'adenium-stock-template.csv'}
              className="text-sm text-leaf hover:underline"
            >
              Download the template
            </a>
          </div>

          <div>
            <label htmlFor="csv-body" className="block text-sm font-medium text-ink-2">
              CSV content
            </label>
            <textarea
              id="csv-body"
              rows={12}
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setReport(null);
              }}
              placeholder="Paste CSV here, or choose a file above."
              className="mt-1.5 w-full border border-line bg-white px-3 py-2 font-mono text-xs focus:border-leaf focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => run(true)}
              disabled={pending || !csv.trim()}
              className="border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white disabled:opacity-50"
            >
              {pending ? 'Checking…' : 'Check without importing'}
            </button>
            <button
              type="button"
              onClick={() => run(false)}
              disabled={pending || !csv.trim()}
              className="bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-2 disabled:opacity-50"
            >
              {pending ? 'Working…' : 'Run the import'}
            </button>
          </div>
        </div>
      </section>

      {report && (
        <section
          className={`border bg-white ${report.ok ? 'border-leaf' : 'border-clay'}`}
        >
          <h2
            className={`border-b px-5 py-3.5 font-display text-lg ${
              report.ok ? 'border-leaf bg-leaf-3 text-leaf' : 'border-clay bg-clay-2 text-clay'
            }`}
          >
            {report.dryRun ? 'Check results' : 'Import results'}
          </h2>
          <div className="p-5">
            <p className="text-sm text-ink-2">{report.message}</p>

            {!report.dryRun && report.ok && (
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ['Products created', report.productsCreated],
                  ['Products updated', report.productsUpdated],
                  ['Variants created', report.variantsCreated],
                  ['Variants updated', report.variantsUpdated],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs uppercase tracking-wide text-ink-3">{label}</dt>
                    <dd className="mt-1 font-display text-2xl tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {report.issues.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-ink">Rows to fix</h3>
                <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto text-sm">
                  {report.issues.map((issue, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-xs text-clay">row {issue.row}</span>
                      <span className="text-ink-2">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
