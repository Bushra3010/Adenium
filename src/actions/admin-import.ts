'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { parseCsv } from '@/lib/csv';
import { slugify } from '@/lib/slug';
import { REQUIRED_COLUMNS } from '@/lib/import-schema';

export type RowIssue = { row: number; message: string };
export type ImportReport = {
  ok: boolean;
  dryRun: boolean;
  totalRows: number;
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  issues: RowIssue[];
  message?: string;
};

/**
 * Bulk product/variant import (ADM-04).
 *
 * One row per variant; product columns repeat across a product's rows. Runs a
 * full validation pass first and reports every bad row, so a dry run tells the
 * operator exactly what to fix before anything is written.
 */
export async function importProductsAction(
  csvText: string,
  dryRun: boolean,
): Promise<ImportReport> {
  await requireStaff();

  const rows = parseCsv(csvText);
  const empty: ImportReport = {
    ok: false, dryRun, totalRows: 0,
    productsCreated: 0, productsUpdated: 0, variantsCreated: 0, variantsUpdated: 0,
    issues: [],
  };

  if (rows.length < 2) {
    return { ...empty, message: 'The file needs a header row and at least one data row.' };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    return { ...empty, message: `Missing required column(s): ${missing.join(', ')}.` };
  }

  const col = (name: string) => header.indexOf(name);
  const get = (row: string[], name: string) => {
    const index = col(name);
    return index === -1 ? '' : (row[index] ?? '').trim();
  };

  const dataRows = rows.slice(1);
  const issues: RowIssue[] = [];

  // ── Validation pass ────────────────────────────────────────────
  const seenVariantSkus = new Set<string>();
  type Parsed = {
    rowNumber: number;
    productSku: string;
    name: string;
    type: 'SEED' | 'PLANT';
    botanicalName: string;
    slug: string;
    categorySlugs: string[];
    shortDescription: string;
    description: string;
    careGuide: string;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    featured: boolean;
    variantSku: string;
    optionValues: Record<string, string>;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    weightG: number;
    attributes: Record<string, string>;
  };
  const parsed: Parsed[] = [];

  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2; // 1-based, plus the header
    const productSku = get(row, 'product_sku');
    const name = get(row, 'name');
    const typeRaw = get(row, 'type').toUpperCase();
    const variantSku = get(row, 'variant_sku');
    const priceRaw = get(row, 'price');
    const stockRaw = get(row, 'stock');

    if (!productSku) issues.push({ row: rowNumber, message: 'product_sku is empty.' });
    if (!name) issues.push({ row: rowNumber, message: 'name is empty.' });
    if (typeRaw !== 'SEED' && typeRaw !== 'PLANT') {
      issues.push({ row: rowNumber, message: `type must be SEED or PLANT, found "${typeRaw}".` });
    }
    if (!variantSku) issues.push({ row: rowNumber, message: 'variant_sku is empty.' });
    else if (seenVariantSkus.has(variantSku)) {
      issues.push({ row: rowNumber, message: `variant_sku "${variantSku}" appears more than once.` });
    } else seenVariantSkus.add(variantSku);

    const price = Number(priceRaw);
    if (!priceRaw || Number.isNaN(price) || price < 0) {
      issues.push({ row: rowNumber, message: `price must be a number, found "${priceRaw}".` });
    }
    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) {
      issues.push({ row: rowNumber, message: `stock must be a whole number, found "${stockRaw}".` });
    }

    const compareRaw = get(row, 'compare_at_price');
    const compareAtPrice = compareRaw ? Number(compareRaw) : null;
    if (compareRaw && Number.isNaN(compareAtPrice)) {
      issues.push({ row: rowNumber, message: `compare_at_price must be a number, found "${compareRaw}".` });
    }

    const statusRaw = (get(row, 'status') || 'DRAFT').toUpperCase();
    if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(statusRaw)) {
      issues.push({ row: rowNumber, message: `status must be DRAFT, ACTIVE or ARCHIVED, found "${statusRaw}".` });
    }

    const optionValues: Record<string, string> = {};
    for (const key of header.filter((h) => h.startsWith('option_'))) {
      const value = get(row, key);
      if (value) optionValues[key.slice('option_'.length)] = value;
    }

    const attributes: Record<string, string> = {};
    for (const key of header.filter((h) => h.startsWith('attr_'))) {
      const value = get(row, key);
      if (value) attributes[key.slice('attr_'.length)] = value;
    }

    const weightRaw = get(row, 'weight_g');
    parsed.push({
      rowNumber,
      productSku,
      name,
      type: (typeRaw === 'PLANT' ? 'PLANT' : 'SEED') as 'SEED' | 'PLANT',
      botanicalName: get(row, 'botanical_name'),
      slug: get(row, 'slug'),
      categorySlugs: get(row, 'category_slugs').split('|').map((s) => s.trim()).filter(Boolean),
      shortDescription: get(row, 'short_description'),
      description: get(row, 'description'),
      careGuide: get(row, 'care_guide'),
      status: statusRaw as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
      featured: ['1', 'true', 'yes'].includes(get(row, 'featured').toLowerCase()),
      variantSku,
      optionValues,
      price,
      compareAtPrice: compareRaw ? compareAtPrice : null,
      stock,
      weightG: weightRaw ? Number(weightRaw) || 100 : 100,
      attributes,
    });
  }

  // Unknown category slugs are a common paste error; name them precisely.
  const allCategorySlugs = [...new Set(parsed.flatMap((p) => p.categorySlugs))];
  const knownCategories = await prisma.category.findMany({
    where: { slug: { in: allCategorySlugs } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(knownCategories.map((c) => [c.slug, c.id]));
  for (const p of parsed) {
    for (const slug of p.categorySlugs) {
      if (!categoryBySlug.has(slug)) {
        issues.push({ row: p.rowNumber, message: `Unknown category slug "${slug}".` });
      }
    }
  }

  const report: ImportReport = {
    ok: issues.length === 0,
    dryRun,
    totalRows: dataRows.length,
    productsCreated: 0, productsUpdated: 0, variantsCreated: 0, variantsUpdated: 0,
    issues: issues.slice(0, 100),
  };

  if (issues.length > 0) {
    return {
      ...report,
      message: `${issues.length} problem${issues.length === 1 ? '' : 's'} found. Nothing was imported.`,
    };
  }
  if (dryRun) {
    const productCount = new Set(parsed.map((p) => p.productSku)).size;
    return {
      ...report,
      message: `Looks good: ${productCount} product${productCount === 1 ? '' : 's'} across ${parsed.length} variant row${parsed.length === 1 ? '' : 's'}. Run the import to apply.`,
    };
  }

  // ── Write pass — create-or-update by SKU ───────────────────────
  const attributeRegistry = await prisma.attribute.findMany({ select: { id: true, key: true } });
  const attributeByKey = new Map(attributeRegistry.map((a) => [a.key, a.id]));

  const byProduct = new Map<string, Parsed[]>();
  for (const p of parsed) {
    byProduct.set(p.productSku, [...(byProduct.get(p.productSku) ?? []), p]);
  }

  for (const [productSku, variantRows] of byProduct) {
    const first = variantRows[0];
    const existing = await prisma.product.findUnique({ where: { sku: productSku } });

    const base = {
      type: first.type,
      name: first.name,
      botanicalName: first.botanicalName || null,
      shortDescription: first.shortDescription || null,
      description: first.description || null,
      careGuide: first.careGuide || null,
      status: first.status,
      featured: first.featured,
    };

    let productId: string;
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: base });
      productId = existing.id;
      report.productsUpdated++;
    } else {
      let slug = slugify(first.slug || first.name);
      let suffix = 2;
      while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${slugify(first.slug || first.name)}-${suffix++}`;
      }
      const created = await prisma.product.create({
        data: {
          ...base,
          sku: productSku,
          slug,
          images: {
            create: {
              url: `/img/ph/${slug}-1.svg`,
              alt: `${first.name} — product photograph`,
              position: 0,
              isPrimary: true,
            },
          },
        },
      });
      productId = created.id;
      report.productsCreated++;
    }

    if (first.categorySlugs.length) {
      await prisma.productCategory.deleteMany({ where: { productId } });
      await prisma.productCategory.createMany({
        data: first.categorySlugs.map((slug) => ({
          productId,
          categoryId: categoryBySlug.get(slug)!,
        })),
      });
    }

    const attributeEntries = Object.entries(first.attributes).filter(([k]) =>
      attributeByKey.has(k),
    );
    if (attributeEntries.length) {
      await prisma.productAttribute.deleteMany({ where: { productId } });
      await prisma.productAttribute.createMany({
        data: attributeEntries.map(([k, value]) => ({
          productId,
          attributeId: attributeByKey.get(k)!,
          value,
        })),
      });
    }

    for (const [index, v] of variantRows.entries()) {
      const existingVariant = await prisma.variant.findUnique({ where: { sku: v.variantSku } });
      const variantData = {
        optionValues: v.optionValues,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stockQty: v.stock,
        weightG: v.weightG,
        isActive: true,
        isDefault: index === 0,
      };
      if (existingVariant) {
        await prisma.variant.update({ where: { id: existingVariant.id }, data: variantData });
        report.variantsUpdated++;
      } else {
        await prisma.variant.create({
          data: { ...variantData, productId, sku: v.variantSku },
        });
        report.variantsCreated++;
      }
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/', 'layout');

  return {
    ...report,
    message: `Imported: ${report.productsCreated} product(s) created, ${report.productsUpdated} updated, ${report.variantsCreated} variant(s) created, ${report.variantsUpdated} updated.`,
  };
}

/** Stock-only import for fast re-stocking (PRD §7.4). */
export async function importStockAction(
  csvText: string,
  dryRun: boolean,
): Promise<ImportReport> {
  await requireStaff();

  const rows = parseCsv(csvText);
  const report: ImportReport = {
    ok: false, dryRun, totalRows: Math.max(0, rows.length - 1),
    productsCreated: 0, productsUpdated: 0, variantsCreated: 0, variantsUpdated: 0,
    issues: [],
  };
  if (rows.length < 2) return { ...report, message: 'The file needs a header row and at least one data row.' };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const skuIndex = header.indexOf('variant_sku');
  const stockIndex = header.indexOf('stock');
  if (skuIndex === -1 || stockIndex === -1) {
    return { ...report, message: 'Needs both a variant_sku and a stock column.' };
  }

  const updates: { sku: string; stock: number }[] = [];
  for (const [index, row] of rows.slice(1).entries()) {
    const rowNumber = index + 2;
    const sku = (row[skuIndex] ?? '').trim();
    const stock = Number((row[stockIndex] ?? '').trim());
    if (!sku) report.issues.push({ row: rowNumber, message: 'variant_sku is empty.' });
    else if (!Number.isInteger(stock) || stock < 0) {
      report.issues.push({ row: rowNumber, message: `stock must be a whole number for "${sku}".` });
    } else updates.push({ sku, stock });
  }

  const known = await prisma.variant.findMany({
    where: { sku: { in: updates.map((u) => u.sku) } },
    select: { sku: true },
  });
  const knownSkus = new Set(known.map((k) => k.sku));
  for (const [index, u] of updates.entries()) {
    if (!knownSkus.has(u.sku)) {
      report.issues.push({ row: index + 2, message: `No variant with SKU "${u.sku}".` });
    }
  }

  if (report.issues.length > 0) {
    return {
      ...report,
      issues: report.issues.slice(0, 100),
      message: `${report.issues.length} problem${report.issues.length === 1 ? '' : 's'} found. Nothing was updated.`,
    };
  }
  if (dryRun) {
    return { ...report, ok: true, message: `Looks good: ${updates.length} variant(s) ready to update.` };
  }

  for (const u of updates) {
    await prisma.variant.update({ where: { sku: u.sku }, data: { stockQty: u.stock } });
    report.variantsUpdated++;
  }

  revalidatePath('/admin/inventory');
  revalidatePath('/', 'layout');
  return { ...report, ok: true, message: `Updated stock on ${report.variantsUpdated} variant(s).` };
}
