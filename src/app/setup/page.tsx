import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Setup required',
  robots: { index: false, follow: false },
};

/**
 * Shown when the deploy has no DATABASE_URL. Every storefront route reads the
 * catalog, so rather than serving an error on each one, `middleware.ts` sends
 * traffic here until a database is connected.
 */
export default function SetupPage() {
  const steps = [
    {
      title: 'Provision a PostgreSQL database',
      body: 'Netlify DB is in your project sidebar under “Database” and is the shortest path — it provisions a Neon Postgres and sets the connection string for you. Neon and Supabase both have free tiers if you would rather host it elsewhere.',
    },
    {
      title: 'Set DATABASE_URL',
      body: 'Project configuration → Environment variables. Paste the connection string exactly as your provider gives it, including ?sslmode=require if present.',
      code: 'DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require',
    },
    {
      title: 'Set AUTH_SECRET',
      body: 'Sessions are signed with it. Generate one and add it alongside DATABASE_URL.',
      code: 'openssl rand -base64 32',
    },
    {
      title: 'Create the schema and load the catalog',
      body: 'Run these locally, pointed at the same database, then redeploy.',
      code: 'npx prisma migrate deploy\nnpm run db:seed',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-leaf">Adenium</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ink">
        Almost there — connect a database
      </h1>
      <p className="mt-4 leading-relaxed text-ink-2">
        The application deployed successfully. It stores every product, order and customer in
        PostgreSQL, so it needs a connection string before the storefront can open.
      </p>

      <ol className="mt-10 space-y-8">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf font-mono text-xs text-white"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl text-ink">{step.title}</h2>
              <p className="mt-1.5 leading-relaxed text-ink-2">{step.body}</p>
              {step.code && (
                <pre className="mt-3 overflow-x-auto border border-line bg-white px-4 py-3 font-mono text-xs text-ink-2">
                  {step.code}
                </pre>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 border-l-2 border-leaf bg-leaf-3 px-5 py-4">
        <p className="text-sm leading-relaxed text-leaf">
          Once <code className="font-mono">DATABASE_URL</code> is set and the deploy rebuilds,
          this page disappears and the storefront takes over. Nothing else needs changing.
        </p>
      </div>

      <p className="mt-8 text-sm text-ink-3">
        Payments, email and SMS are optional and can be added later — the store runs without
        them, and checkout falls back safely until Razorpay keys are present.
      </p>
    </div>
  );
}
