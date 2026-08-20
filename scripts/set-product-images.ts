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

/**
 * product slug -> photographs under public/, primary first.
 *
 * A file may serve more than one listing: a seed packet is sold on what it
 * grows into, so the mature plant is the honest photograph for both.
 */
const MAP: Record<string, string[]> = {
  // Plants
  'adenium-arabicum-caudex-bonsai': ['Images/plant1.png'],
  'adenium-obesum-grafted-desert-rose': [
    // In flower leads, since this listing is sold on flowering true and soon.
    'Images/Adenium Obesum Desert Rose.png',
    'Images/plant4.png',
  ],
  'astrophytum-asterias-sand-dollar-cactus': ['Images/plant2.png'],
  'echeveria-perle-von-nurnberg': ['Images/plant3.png'],
  'euphorbia-obesa-baseball-plant': ['Images/Euphorbia Obesa.png'],
  'sansevieria-cylindrica-snake-plant': ['Images/Sansevieria Cylindrica.png'],

  // Seeds, shown as the plant they raise
  'adenium-arabicum-thai-socotranum-seeds': ['Images/Adenium Arabicum.png'],
  'adenium-obesum-mixed-hybrid-seeds': ['Images/Adenium Obesum.png'],
  'euphorbia-obesa-seeds': ['Images/Euphorbia Obesa.png'],
  'gomphrena-everlasting-flower-seeds': ['Images/Gomphrena Everlasting Flower Seeds.png'],
};

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  let applied = 0;
  let missing = 0;

  for (const [slug, files] of Object.entries(MAP)) {
    const present = files.filter((f) => existsSync(path.join(publicDir, f)));
    if (present.length === 0) {
      console.log(`  - ${slug}: waiting on public/${files[0]}`);
      missing++;
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!product) {
      console.log(`  - ${slug}: no such product`);
      continue;
    }

    // Replace the whole set rather than appending, so re-running cannot stack
    // duplicates, and the first file always ends up primary.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: present.map((file, index) => ({
        productId: product.id,
        url: `/${file}`,
        alt: `${product.name} — product photograph`,
        position: index,
        isPrimary: index === 0,
      })),
    });

    console.log(`  ${product.name.padEnd(44).slice(0, 44)} ${present.length} photo(s)`);
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
