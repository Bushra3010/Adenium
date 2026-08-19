import 'server-only';
import { cookies, headers } from 'next/headers';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { Role, TokenPurpose, User } from '@/generated/prisma';

const SESSION_COOKIE = 'adn_session';
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

// ── Passwords (AUTH-02) ──────────────────────────────────────────

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Sessions (AUTH-06) ───────────────────────────────────────────
// The cookie carries `<sessionId>.<secret>`. Only a hash of the secret is
// stored, so a database leak does not yield usable session cookies, and
// deleting the row genuinely invalidates the session.

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex');
}

export async function createSession(userId: string): Promise<void> {
  const secret = randomBytes(32).toString('base64url');
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(secret),
      expiresAt,
      userAgent: h.get('user-agent')?.slice(0, 255) ?? null,
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    },
    select: { id: true },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, `${session.id}.${secret}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'emailVerified'>;

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const sep = raw.indexOf('.');
  if (sep < 1) return null;
  const sessionId = raw.slice(0, sep);
  const secret = raw.slice(sep + 1);
  if (!secret) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      tokenHash: true,
      expiresAt: true,
      user: {
        select: { id: true, email: true, name: true, role: true, emailVerified: true },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) return null;
  if (!safeEqual(session.tokenHash, sha256(secret))) return null;

  return session.user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    const [sessionId] = raw.split('.');
    if (sessionId) await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  store.delete(SESSION_COOKIE);
}

// ── Authorisation (AUTH-05) ──────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('Sign in to continue.', 401);
  return user;
}

const STAFF_ROLES: Role[] = ['ADMIN', 'STAFF'];

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!STAFF_ROLES.includes(user.role)) throw new AuthError('Not permitted.', 403);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new AuthError('Not permitted.', 403);
  return user;
}

// ── One-time tokens: email verification & password reset (AUTH-03/04) ──

export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
  ttlMs: number,
): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.verificationToken.create({
    data: { userId, purpose, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

export async function consumeToken(
  token: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const row = await prisma.verificationToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt <= new Date()) return null;
  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row.userId;
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
