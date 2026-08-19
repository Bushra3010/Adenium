import { requireStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/csv';
import { TEMPLATE_COLUMNS } from '@/lib/import-schema';
import { PageHeading, Panel } from '@/components/admin/ui';
import { ImportPanel } from '@/components/admin/import-panel';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  await requireStaff();

  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { slug: true, name: true, parent: { select: { slug: true } } },
    orderBy: { position: 'asc' },
  });

  const productsTemplate = toCsv([
    [...TEMPLATE_COLUMNS],
    [
      'ADN-S-EXAMPLE', 'Adenium Somalense Seeds', 'SEED', 'Adenium somalense',
      '', 'adenium-seeds', 'Slender-trunked desert rose, quick from seed.',
      'Longer description here.', '## Sowing\n\nSoak for 2–4 hours…', 'DRAFT', 'false',
      'ADN-S-EXAMPLE-01', '10 seeds', '', '', '199', '', '25', '20',
      '5–12 days', 'Easy', 'Full sun', 'Easy',
    ],
    [
      'ADN-S-EXAMPLE', 'Adenium Somalense Seeds', 'SEED', 'Adenium somalense',
      '', 'adenium-seeds', '', '', '', 'DRAFT', 'false',
      'ADN-S-EXAMPLE-02', '50 seeds', '', '', '750', '899', '10', '45',
      '', '', '', '',
    ],
  ]);

  const stockTemplate = toCsv([
    ['variant_sku', 'stock'],
    ['ADN-S-ARB-TS-01', '40'],
    ['ADN-S-ARB-TS-02', '25'],
  ]);

  return (
    <>
      <PageHeading
        title="Bulk import"
        description="Load a catalog from a spreadsheet, or re-stock in one go."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <ImportPanel templates={{ products: productsTemplate, stock: stockTemplate }} />

        <div className="space-y-6">
          <Panel title="Column reference">
            <dl className="space-y-2.5 text-sm">
              <Row name="product_sku" detail="Required. Groups rows into one product." />
              <Row name="name / type" detail="Required. type is SEED or PLANT." />
              <Row name="variant_sku" detail="Required. Unique across the whole catalog." />
              <Row name="price / stock" detail="Required. Numbers, no currency symbol." />
              <Row name="option_*" detail="option_pack_size, option_pot_size, option_height…" />
              <Row name="attr_*" detail="Matches an attribute key, e.g. attr_difficulty." />
              <Row name="category_slugs" detail="Pipe-separated, e.g. adenium-seeds|seeds." />
              <Row name="status" detail="DRAFT, ACTIVE or ARCHIVED. Defaults to DRAFT." />
            </dl>
          </Panel>

          <Panel title="Category slugs">
            <ul className="space-y-1.5 text-sm">
              {categories.map((c) => (
                <li key={c.slug} className="flex justify-between gap-3">
                  <span className="text-ink-2">{c.name}</span>
                  <code className="font-mono text-xs text-ink-3">{c.slug}</code>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ name, detail }: { name: string; detail: string }) {
  return (
    <div>
      <dt className="font-mono text-xs text-ink">{name}</dt>
      <dd className="text-ink-3">{detail}</dd>
    </div>
  );
}
