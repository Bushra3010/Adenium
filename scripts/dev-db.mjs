/**
 * Local development database.
 *
 * Production runs real PostgreSQL (PRD §10). This script serves an embedded
 * PGlite instance over the Postgres wire protocol so the app can be developed
 * and demoed on a machine with no Postgres, Docker or Homebrew installed.
 * Prisma connects to it exactly as it would to a real server.
 *
 * Data persists in .localdb/ (git-ignored).
 */
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const PORT = Number(process.env.DEV_DB_PORT ?? 5433);
const DATA_DIR = process.env.DEV_DB_DIR ?? './.localdb';

const db = await PGlite.create({ dataDir: DATA_DIR });
const server = new PGLiteSocketServer({
  db,
  port: PORT,
  host: '127.0.0.1',
  // Prisma pipelines concurrent queries and cannot serve them all over one
  // wire connection, so allow a real pool. Because PGlite backs every
  // connection with the same Postgres instance, the app's DATABASE_URL must
  // also carry pgbouncer=true or prepared-statement names collide.
  maxConnections: 20,
});

await server.start();
console.log(`[dev-db] PGlite listening on postgres://127.0.0.1:${PORT}  (data: ${DATA_DIR})`);

const shutdown = async () => {
  console.log('\n[dev-db] shutting down');
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
