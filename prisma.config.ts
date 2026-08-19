import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// A prisma.config.ts turns off the CLI's automatic .env loading, so load it
// here. .env.local wins where present, matching Next's own precedence.
loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
