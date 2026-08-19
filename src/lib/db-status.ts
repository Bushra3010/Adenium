import 'server-only';
import { unstable_rethrow } from 'next/navigation';

/**
 * Whether a database connection string is configured at all.
 *
 * The storefront is useless without one, but a deploy that has not been given
 * a DATABASE_URL yet should say so plainly rather than serve a stack trace on
 * every route. `middleware.ts` routes such deploys to /setup; the helpers here
 * keep the shared chrome rendering in the meantime, and absorb a transient
 * database outage in production.
 */
export const databaseConfigured = Boolean(process.env.DATABASE_URL);

export async function safely<T>(
  query: () => Promise<T>,
  fallback: T,
  label = 'query',
): Promise<T> {
  if (!databaseConfigured) return fallback;
  try {
    return await query();
  } catch (error) {
    // Next signals redirects, notFound() and the switch to dynamic rendering by
    // throwing. Swallowing those would silently break routing and cause pages
    // that read cookies to be prerendered as static.
    unstable_rethrow(error);
    console.error(`[db] ${label} failed:`, error);
    return fallback;
  }
}
