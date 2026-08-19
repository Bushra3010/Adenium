/**
 * Creates an administrator, or promotes an existing account to ADMIN.
 *
 * Credentials come from the environment so nothing sensitive is ever written
 * to a file or committed:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create
 *
 * Omit ADMIN_PASSWORD and a strong one is generated and printed once. Re-running
 * for an existing email promotes that account and resets its password, which is
 * also the recovery path if an admin is locked out.
 */
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

function generatePassword(): string {
  // Ambiguous characters left out so it survives being read aloud or retyped.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const symbols = '!@#$%^&*-_=+';
  const bytes = randomBytes(20);
  let out = '';
  for (let i = 0; i < 16; i++) out += alphabet[bytes[i] % alphabet.length];
  out += symbols[bytes[16] % symbols.length];
  out += String(bytes[17] % 10);
  return out;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || 'Store Admin';
  const phone = process.env.ADMIN_PHONE?.trim() || null;

  if (!email || !email.includes('@')) {
    console.error('Set ADMIN_EMAIL to a valid email address.');
    console.error("  ADMIN_EMAIL=you@example.com npm run admin:create");
    process.exit(1);
  }

  const supplied = process.env.ADMIN_PASSWORD;
  if (supplied && supplied.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }
  const password = supplied || generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', passwordHash, emailVerified: new Date() },
      })
    : await prisma.user.create({
        data: { email, name, phone, role: 'ADMIN', passwordHash, emailVerified: new Date() },
      });

  // Any session opened with the previous password is now void.
  const revoked = await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log('');
  console.log(existing ? '✓ Promoted to administrator' : '✓ Administrator created');
  console.log('  email:    ' + user.email);
  console.log('  name:     ' + user.name);
  if (!supplied) {
    console.log('  password: ' + password);
    console.log('');
    console.log('  Store this now — it is hashed and cannot be shown again.');
  } else {
    console.log('  password: (the one you supplied)');
  }
  if (revoked.count > 0) console.log(`  revoked ${revoked.count} existing session(s)`);

  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
  console.log(`  administrators on this store: ${admins}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
