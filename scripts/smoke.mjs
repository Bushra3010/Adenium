/**
 * Browser smoke test for the critical shopping paths.
 * Run with the dev server and dev database up:  node scripts/smoke.mjs
 */
import { chromium } from 'playwright';
import { PrismaClient } from '../src/generated/prisma/index.js';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3000';
const results = [];
let failures = 0;

/**
 * Polls until the predicate holds. Fixed sleeps were tuned for a local
 * database; against a hosted one (Supabase, Neon) round-trips are an order of
 * magnitude slower and assertions raced the writes they were checking.
 */
async function waitFor(predicate, { timeout = 20000, interval = 400 } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  for (;;) {
    last = await predicate();
    if (last) return last;
    if (Date.now() > deadline) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
}

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  if (!passed) failures++;
  console.log(`${passed ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
}

// The signed-in cart persists between runs by design (CART-02), so clear the
// test customer's cart first to keep this script repeatable.
const prisma = new PrismaClient();
const testUser = await prisma.user.findUnique({ where: { email: 'customer@adenium.local' } });
if (testUser) {
  await prisma.cart.deleteMany({ where: { userId: testUser.id } });
}
await prisma.$disconnect();

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
page.on('pageerror', (e) => console.log('   [page error]', e.message));

try {
  // ── Sign in (AUTH-01) ─────────────────────────────────────────
  await page.goto(`${BASE}/login`);
  await page.fill('#field-email', 'customer@adenium.local');
  await page.fill('#field-password', 'Customer@12345');
  await page.click('button[type=submit]');
  await page.waitForURL('**/account', { timeout: 15000 });
  check('sign in reaches the account area', page.url().includes('/account'));
  check('session cookie is set', (await context.cookies()).some((c) => c.name === 'adn_session'));

  // ── Product page and variant selection (PDP-02) ───────────────
  await page.goto(`${BASE}/product/adenium-arabicum-thai-socotranum-seeds`);
  const priceBefore = await page.locator('.font-display.text-3xl').first().innerText();
  await page.click('button:has-text("100 seeds")');
  await page.waitForTimeout(300);
  const priceAfter = await page.locator('.font-display.text-3xl').first().innerText();
  check('variant selection updates the price', priceBefore !== priceAfter, `${priceBefore} → ${priceAfter}`);

  // ── Add to cart (CART-01) ─────────────────────────────────────
  await page.click('button:has-text("Add to cart")');
  await page.waitForSelector('[role=status]', { timeout: 15000 });
  check('add to cart confirms', (await page.locator('[role=status]').innerText()).length > 0);

  await page.goto(`${BASE}/cart`);
  const cartText = await page.locator('main').innerText();
  check('cart lists the product', cartText.includes('Adenium Arabicum'));
  check('cart shows 100 seeds variant', cartText.includes('100 seeds'));

  // ── Coupon (CPN-01/02/04) ─────────────────────────────────────
  await page.fill('#coupon', 'WELCOME10');
  await page.click('button:has-text("Apply")');
  check('valid coupon applies',
    Boolean(await waitFor(async () => (await page.locator('main').innerText()).includes('WELCOME10'))));

  await page.click('aside button:has-text("Remove")');
  await page.waitForTimeout(1200);
  await page.fill('#coupon', 'EXPIRED20');
  await page.click('button:has-text("Apply")');
  check('expired coupon is rejected with a reason',
    Boolean(await waitFor(async () => (await page.locator('main').innerText()).includes('expired'))));

  // ── Search and filters (SRCH-01/03/05) ────────────────────────
  await page.goto(`${BASE}/search?q=euphorbia`);
  check('search finds matches', (await page.locator('main').innerText()).includes('Euphorbia'));

  await page.goto(`${BASE}/seeds`);
  const allSeeds = await page.locator('article').count();
  await page.goto(`${BASE}/seeds?difficulty=Easy`);
  const easySeeds = await page.locator('article').count();
  check('attribute filter narrows results', easySeeds > 0 && easySeeds < allSeeds, `${allSeeds} → ${easySeeds}`);

  await page.goto(`${BASE}/search?q=zzzzzz`);
  check('empty search offers a way forward', (await page.locator('main').innerText()).includes('Nothing matched'));

  // ── Checkout through the simulated gateway (CHK-01..07, PAY-02) ──
  const db = new PrismaClient();
  const variantBefore = await db.variant.findFirst({
    where: { sku: 'ADN-S-ARB-TS-04' },
    select: { id: true, stockQty: true },
  });

  await page.goto(`${BASE}/checkout`);
  // The seeded customer has a saved address, so checkout preselects it (CHK-03).
  check('saved address is offered at checkout', await page.locator('input[name=addressChoice]').first().isChecked());
  await page.fill('#co-email', 'customer@adenium.local');
  await page.click('button[type=submit]');
  await page.waitForURL('**/order/confirmation/**', { timeout: 30000 });

  const confirmText = await page.locator('main').innerText();
  check('order confirmation is reached', confirmText.includes('order is confirmed'));
  const orderNo = confirmText.match(/ADN-\d+/)?.[0] ?? '';
  check('order number is issued', /^ADN-\d+$/.test(orderNo), orderNo);

  const order = await db.order.findFirst({
    where: { orderNumber: orderNo },
    include: { items: true, reservations: true, events: true },
  });
  check('order is CONFIRMED and PAID', order?.status === 'CONFIRMED' && order?.paymentStatus === 'PAID',
    `${order?.status}/${order?.paymentStatus}`);
  check('stock reservation was released', order?.reservations.length === 0);

  const variantAfter = await db.variant.findUnique({ where: { id: variantBefore.id } });
  check('stock decremented on payment', variantAfter.stockQty === variantBefore.stockQty - 1,
    `${variantBefore.stockQty} → ${variantAfter.stockQty}`);
  check('order timeline recorded', (order?.events.length ?? 0) >= 2, `${order?.events.length} events`);

  // Order appears in the customer's history (ACC-01)
  await page.goto(`${BASE}/account/orders`);
  check('order appears in account history', (await page.locator('main').innerText()).includes(orderNo));

  // Cart is emptied after a paid order
  await page.goto(`${BASE}/cart`);
  check('cart is emptied after purchase', (await page.locator('main').innerText()).includes('Nothing in the cart'));

  // ── Admin is closed to customers (AUTH-05) ────────────────────
  await page.goto(`${BASE}/admin`);
  check('customer is kept out of admin', !page.url().includes('/admin'), page.url());

  // ── Admin operations ──────────────────────────────────────────
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on('pageerror', (e) => console.log('   [admin page error]', e.message));

  await admin.goto(`${BASE}/login`);
  await admin.fill('#field-email', 'admin@adenium.local');
  await admin.fill('#field-password', 'Admin@12345');
  await admin.click('button[type=submit]');
  await admin.waitForURL('**/admin', { timeout: 15000 });
  check('admin signs in to the dashboard', admin.url().includes('/admin'));

  const overview = await admin.locator('#main').innerText();
  check('overview shows the new order', overview.includes(orderNo));

  // Move the order along: CONFIRMED → PACKED → SHIPPED with an AWB (ORD-02/03)
  await admin.goto(`${BASE}/admin/orders/${order.id}`);
  await admin.selectOption('#next-status', 'PACKED');
  await admin.click('button:has-text("Update order")');
  const packed = await waitFor(async () =>
    (await db.order.findUnique({ where: { id: order.id } }))?.status === 'PACKED');
  check('order moves to packed', Boolean(packed));

  await admin.selectOption('#next-status', 'SHIPPED');
  await admin.click('button:has-text("Update order")');
  const blocked = await waitFor(async () =>
    (await admin.locator('#main').innerText()).includes('courier and AWB'));
  check('shipping without an AWB is refused', Boolean(blocked));

  await admin.fill('#courier', 'Delhivery');
  await admin.fill('#awb', 'DL99887766');
  await admin.click('button:has-text("Update order")');

  const shipped = await waitFor(async () => {
    const o = await db.order.findUnique({ where: { id: order.id } });
    return o?.status === 'SHIPPED' && o?.awbNumber === 'DL99887766' ? o : null;
  }) ?? (await db.order.findUnique({ where: { id: order.id } }));
  check('order ships with courier and AWB recorded',
    shipped.status === 'SHIPPED' && shipped.awbNumber === 'DL99887766',
    `${shipped.status} / ${shipped.awbNumber}`);

  // The customer sees the tracking number (ORD-04)
  await page.goto(`${BASE}/account/orders/${order.id}`);
  check('customer sees the tracking number', (await page.locator('main').innerText()).includes('DL99887766'));

  // Guest tracking by order number + email (ORD-05)
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(`${BASE}/track?order=${orderNo}&contact=customer@adenium.local`);
  check('guest tracking finds the order', (await guest.locator('main').innerText()).includes('DL99887766'));
  await guest.goto(`${BASE}/track?order=${orderNo}&contact=wrong@example.com`);
  check('guest tracking rejects a wrong contact', (await guest.locator('main').innerText()).includes('No order matches'));

  // Inventory edit (ADM-03)
  await admin.goto(`${BASE}/admin/inventory?q=ADN-S-ARB-TS-01`);
  const stockField = admin.locator('input[aria-label="Stock quantity"]').first();
  await stockField.fill('77');
  await stockField.blur();
  const restocked = await waitFor(async () => {
    const v = await db.variant.findUnique({ where: { sku: 'ADN-S-ARB-TS-01' } });
    return v?.stockQty === 77 ? v : null;
  }) ?? (await db.variant.findUnique({ where: { sku: 'ADN-S-ARB-TS-01' } }));
  check('inventory stock edit saves', restocked.stockQty === 77, String(restocked.stockQty));

  // Review moderation (REV-02)
  const testReview = await db.review.create({
    data: {
      productId: (await db.product.findFirst({ where: { slug: 'adenium-obesum-mixed-hybrid-seeds' } })).id,
      userId: testUser.id,
      rating: 4,
      body: 'Smoke-test review awaiting moderation.',
      status: 'PENDING',
    },
  });
  await page.goto(`${BASE}/product/adenium-obesum-mixed-hybrid-seeds`);
  check('pending review is hidden from the storefront',
    !(await page.locator('main').innerText()).includes('Smoke-test review'));

  await admin.goto(`${BASE}/admin/reviews?status=PENDING`);
  await admin.click('button:has-text("Publish")');
  const approved = await waitFor(async () => {
    const r = await db.review.findUnique({ where: { id: testReview.id } });
    return r?.status === 'APPROVED' ? r : null;
  }) ?? (await db.review.findUnique({ where: { id: testReview.id } }));
  check('review is published on approval', approved.status === 'APPROVED', approved.status);

  const ratedProduct = await waitFor(async () => {
    const p = await db.product.findUnique({ where: { slug: 'adenium-obesum-mixed-hybrid-seeds' } });
    return p?.ratingCount === 1 ? p : null;
  }) ?? (await db.product.findUnique({ where: { slug: 'adenium-obesum-mixed-hybrid-seeds' } }));
  check('product rating recomputed from approved reviews', ratedProduct.ratingCount === 1,
    `avg ${ratedProduct.ratingAvg}, count ${ratedProduct.ratingCount}`);

  await db.review.delete({ where: { id: testReview.id } });

  // CSV bulk import dry run then apply (ADM-04)
  const csv = [
    'product_sku,name,type,category_slugs,status,variant_sku,option_pack_size,price,stock,weight_g',
    'SMOKE-P1,Smoke Test Seeds,SEED,adenium-seeds,ACTIVE,SMOKE-P1-01,10 seeds,120,15,20',
    'SMOKE-P1,Smoke Test Seeds,SEED,adenium-seeds,ACTIVE,SMOKE-P1-02,50 seeds,450,8,45',
  ].join('\n');
  await admin.goto(`${BASE}/admin/import`);
  await admin.fill('#csv-body', csv);
  await admin.click('button:has-text("Run the import")');
  const imported = await waitFor(async () => {
    const p = await db.product.findUnique({ where: { sku: 'SMOKE-P1' }, include: { variants: true } });
    return p?.variants.length === 2 ? p : null;
  }, { timeout: 30000 }) ?? (await db.product.findUnique({ where: { sku: 'SMOKE-P1' }, include: { variants: true } }));
  check('CSV import creates product and variants',
    imported?.variants.length === 2, `${imported?.variants.length ?? 0} variants`);

  // A malformed row is reported rather than half-imported
  await admin.fill('#csv-body', 'product_sku,name,type,variant_sku,price,stock\nSMOKE-P2,Bad Row,WRONG,SMOKE-P2-01,notanumber,-3');
  await admin.click('button:has-text("Check without importing")');
  await waitFor(async () => (await admin.locator('#main').innerText()).includes('problem'));
  const importText = await admin.locator('#main').innerText();
  check('bad CSV rows are reported, not imported',
    importText.includes('problem') && (await db.product.findUnique({ where: { sku: 'SMOKE-P2' } })) === null);

  await db.variant.deleteMany({ where: { sku: { startsWith: 'SMOKE-P1' } } });
  await db.productCategory.deleteMany({ where: { product: { sku: 'SMOKE-P1' } } });
  await db.productImage.deleteMany({ where: { product: { sku: 'SMOKE-P1' } } });
  await db.product.deleteMany({ where: { sku: 'SMOKE-P1' } });

  // ── Guest checkout, no account (CHK-01) ───────────────────────
  const guestBuyer = await (await browser.newContext()).newPage();
  guestBuyer.on('pageerror', (e) => console.log('   [guest page error]', e.message));

  await guestBuyer.goto(`${BASE}/product/gomphrena-everlasting-flower-seeds`);
  await guestBuyer.click('button:has-text("Add to cart")');
  await guestBuyer.waitForSelector('[role=status]', { timeout: 15000 });

  await guestBuyer.goto(`${BASE}/checkout`);
  check('guest checkout is offered without an account',
    (await guestBuyer.locator('#main').innerText()).includes('Checking out as a guest'));

  await guestBuyer.fill('#co-fullName', 'Ravi Kumar');
  await guestBuyer.fill('#co-phone', '9876500011');
  await guestBuyer.fill('#co-line1', '22 Lake View Road');
  await guestBuyer.fill('#co-city', 'Pune');
  await guestBuyer.selectOption('#co-state', 'Maharashtra');
  await guestBuyer.fill('#co-pincode', '411001');
  await guestBuyer.fill('#co-email', 'ravi@example.com');

  // Invalid pincode is caught before an order is created (CHK-02)
  await guestBuyer.fill('#co-pincode', '11');
  await guestBuyer.click('button[type=submit]');
  await guestBuyer.waitForTimeout(1500);
  check('invalid pincode is rejected',
    (await guestBuyer.locator('#main').innerText()).includes('6-digit pincode'));

  await guestBuyer.fill('#co-pincode', '411001');
  await guestBuyer.click('button[type=submit]');
  await guestBuyer.waitForURL('**/order/confirmation/**', { timeout: 30000 });
  const guestOrderNo = (await guestBuyer.locator('#main').innerText()).match(/ADN-\d+/)?.[0] ?? '';
  const guestOrder = await db.order.findFirst({ where: { orderNumber: guestOrderNo } });
  check('guest order is created without a user account',
    guestOrder?.userId === null && guestOrder?.paymentStatus === 'PAID',
    `${guestOrderNo} user=${guestOrder?.userId}`);

  await db.$disconnect();
} catch (error) {
  console.log(' FAIL  unexpected error —', error.message);
  failures++;
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.passed).length;
console.log(`\n${passed}/${results.length} checks passed`);
if (failures > results.length - passed) console.log('plus an unexpected error above');
process.exit(failures > 0 ? 1 : 0);
