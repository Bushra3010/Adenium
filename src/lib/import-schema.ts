/** CSV column contract for the bulk importer (ADM-04). Kept out of the
 *  `'use server'` action file, which may only export async functions. */
export const REQUIRED_COLUMNS = [
  'product_sku',
  'name',
  'type',
  'variant_sku',
  'price',
  'stock',
] as const;

export const TEMPLATE_COLUMNS = [
  'product_sku', 'name', 'type', 'botanical_name', 'slug', 'category_slugs',
  'short_description', 'description', 'care_guide', 'status', 'featured',
  'variant_sku', 'option_pack_size', 'option_pot_size', 'option_height',
  'price', 'compare_at_price', 'stock', 'weight_g',
  'attr_germination_days', 'attr_germination_difficulty', 'attr_light', 'attr_difficulty',
] as const;
