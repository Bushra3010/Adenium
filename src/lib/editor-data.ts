import { prisma } from './prisma';
import { toNumber } from './money';
import type {
  EditorAttribute,
  EditorCategory,
  EditorOptionType,
  EditorProduct,
} from '@/components/admin/product-editor';

export async function loadEditorReferenceData(): Promise<{
  categories: EditorCategory[];
  attributes: EditorAttribute[];
  optionTypes: EditorOptionType[];
}> {
  const [categories, attributes, optionTypes] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
      include: { parent: { select: { name: true } } },
    }),
    prisma.attribute.findMany({ orderBy: { position: 'asc' } }),
    prisma.optionType.findMany({
      orderBy: { position: 'asc' },
      include: { values: { orderBy: { position: 'asc' } } },
    }),
  ]);

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentName: c.parent?.name ?? null,
      type: c.type,
    })),
    attributes: attributes.map((a) => ({
      key: a.key,
      label: a.label,
      unit: a.unit,
      appliesTo: a.appliesTo,
    })),
    optionTypes: optionTypes.map((o) => ({
      key: o.key,
      label: o.label,
      appliesTo: o.appliesTo,
      values: o.values.map((v) => v.value),
    })),
  };
}

export const BLANK_PRODUCT: EditorProduct = {
  type: 'SEED',
  name: '',
  botanicalName: '',
  slug: '',
  sku: '',
  shortDescription: '',
  description: '',
  careGuide: '',
  status: 'DRAFT',
  featured: false,
  metaTitle: '',
  metaDescription: '',
  categoryIds: [],
  attributes: {},
  variants: [
    {
      optionValues: {},
      sku: '',
      price: 0,
      compareAtPrice: null,
      stockQty: 0,
      weightG: 100,
      isActive: true,
    },
  ],
};

export async function loadProductForEditor(id: string): Promise<EditorProduct | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ isDefault: 'desc' }, { price: 'asc' }] },
      categories: true,
      attributes: { include: { attribute: { select: { key: true } } } },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    type: product.type,
    name: product.name,
    botanicalName: product.botanicalName ?? '',
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    careGuide: product.careGuide ?? '',
    status: product.status,
    featured: product.featured,
    metaTitle: product.metaTitle ?? '',
    metaDescription: product.metaDescription ?? '',
    categoryIds: product.categories.map((c) => c.categoryId),
    attributes: Object.fromEntries(product.attributes.map((a) => [a.attribute.key, a.value])),
    variants: product.variants.map((v) => ({
      id: v.id,
      optionValues: (v.optionValues ?? {}) as Record<string, string>,
      sku: v.sku,
      price: toNumber(v.price),
      compareAtPrice: v.compareAtPrice ? toNumber(v.compareAtPrice) : null,
      stockQty: v.stockQty,
      weightG: v.weightG,
      isActive: v.isActive,
    })),
  };
}
