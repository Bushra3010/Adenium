/**
 * Points products at real photography in public/products/.
 *
 * Re-runnable: it only touches products whose file is actually present, so it
 * can be run again as more photographs arrive. Anything without a file keeps
 * its generated placeholder.
 *
 *   npm run images:apply            # local database
 *   DATABASE_URL=... npm run images:apply   # a remote one
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

/** product slug -> file under public/. */
const MAP: Record<string, string> = {
  // Bare-branched caudex in a dark green bowl.
  'adenium-arabicum-caudex-bonsai': 'Images/plant1.png',
  // Flowering barrel cactus in a cream speckled pot.
  'astrophytum-asterias-sand-dollar-cactus': 'Images/plant2.png',
  // Purple rosette in a cream pot.
  'echeveria-perle-von-nurnberg': 'Images/plant3.png',
  // Leafy adenium bonsai in a glossy green bowl.
  'adenium-obesum-grafted-desert-rose': 'Images/plant4.png',
};

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  let applied = 0;
  let missing = 0;

  for (const [slug, file] of Object.entries(MAP)) {
    if (!existsSync(path.join(publicDir, file))) {
      console.log(`  - ${slug}: waiting on public/${file}`);
      missing++;
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!product) {
      console.log(`  – ${file}: no product with slug "${slug}"`);
      continue;
    }

    const url = `/${file}`;
    const primary = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
    });

    if (primary) {
      await prisma.productImage.update({
        where: { id: primary.id },
        data: { url, alt: `${product.name} — product photograph` },
      });
    } else {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          alt: `${product.name} — product photograph`,
          position: 0,
          isPrimary: true,
        },
      });
    }

    console.log(`  ✓ ${product.name} -> ${url}`);
    applied++;
  }

  console.log(`\n${applied} photograph(s) applied, ${missing} still to arrive.`);
}

main()
  .catch((e) => {
    console.error('Failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
