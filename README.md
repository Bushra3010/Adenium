# Adenium — E-Commerce Platform

A direct-to-consumer storefront for **seeds** and **live plants** in the Indian market, built
built to an agreed product requirements document. Requirement IDs from that document
(`CHK-07`, `PAY-02`, `ADM-04`…) appear in code comments throughout.

Two product types drive the data model:

- **Seeds** — packaged goods, sold by pack size, stock held in bulk.
- **Plants** — living goods sold in variants (pot size, height, price tier), stock per variant
  and often in single digits.

Product pages double as growing guides: germination time, temperature range, light hours and
care notes are structured, filterable data rather than prose in a description field.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components + Server Actions) |
| Styling | Tailwind CSS v4 (CSS-first tokens in `src/app/globals.css`) |
| Database | PostgreSQL via Prisma 6 |
| Auth | Database-backed sessions, bcrypt hashing, role-based access |
| Payments | Razorpay (UPI / cards / netbanking), webhook-confirmed |
| Email | Nodemailer over SMTP (logs to console when unconfigured) |

---

## Getting started

```bash
npm install
npm run dev:db     # terminal 1 — local database (see below)
npm run db:push    # create the schema
npm run db:seed    # load the demo catalog
npm run dev        # terminal 2 — http://localhost:3000
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@adenium.local` | `Admin@12345` |
| Customer | `customer@adenium.local` | `Customer@12345` |

### The local database

There is no Postgres, Docker or Homebrew requirement for development. `npm run dev:db` starts
an embedded [PGlite](https://pglite.dev) instance and serves it over the real Postgres wire
protocol on port 5433, so Prisma connects exactly as it would to a server. Data persists in
`.localdb/` (git-ignored).

Two details matter:

- `DATABASE_URL` carries **`pgbouncer=true`**. PGlite backs every pooled connection with one
  Postgres instance, so without it Prisma's named prepared statements collide
  (`prepared statement "s0" already exists`). Harmless against real PostgreSQL.
- If a schema command ever fails with that prepared-statement error, restart `npm run dev:db`.

**For production, point `DATABASE_URL` at real PostgreSQL** and run `npx prisma migrate deploy`
(the initial migration is in `prisma/migrations/`).

---

## Configuration

Copy `.env.example` to `.env` and fill in what you need. Everything except `DATABASE_URL` and
`AUTH_SECRET` degrades gracefully in development.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing secret — `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, used for SEO metadata and email links |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | Gateway credentials |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies webhook deliveries |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASS` | Transactional email |
| `MAIL_FROM`, `ADMIN_ALERT_EMAIL` | Sender identity and new-order alerts |
| `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID` | Transactional SMS |

**Payments in development.** With no Razorpay keys set, checkout runs against a simulated
gateway so the whole order lifecycle can be exercised. The simulator is disabled in production:
with no keys there, checkout refuses orders rather than pretending. Add real keys to take
payments; `/api/payment/webhook` is the authoritative confirmation path, with the browser
handoff at `/api/payment/verify` as a fast path. Both verify signatures server-side.

**SMS in India needs TRAI DLT registration** of the sender ID and of every message template
before a provider will deliver transactional messages. That is a client-side registration with
multi-day lead time — start it early. Email covers all notifications until it is approved.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run dev:db` | Local embedded Postgres |
| `npm run db:push` | Sync schema without a migration (development) |
| `npm run db:migrate` | Create a migration |
| `npm run db:seed` | Reset and load the demo catalog |
| `npm run db:studio` | Prisma Studio |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run smoke` | Browser end-to-end checks (see below) |

Deployment configuration lives in `netlify.toml`; `src/proxy.ts` guards routes when no database
is configured.

### Smoke tests

`npm run smoke` drives a real browser through the paths that matter — sign-in, variant
selection, cart, coupons, filters, checkout through the simulated gateway, stock decrement,
admin order transitions, review moderation and CSV import — and asserts against the database.
It needs `npm run dev:db` and `npm run dev` running, and it resets the test customer's cart so
it is repeatable. Assertions poll rather than sleep, so it is also valid against a hosted
database — point `DATABASE_URL` at one and run it before going live.

---

## Deploying to Netlify

The app is server-rendered, so it runs as Netlify Functions via the official Next.js adapter —
`netlify.toml` and `@netlify/plugin-nextjs` are already configured. Connect the repository and
Netlify picks both up.

**The build succeeds without a database**, so the first deploy always goes green. Until
`DATABASE_URL` is set, every page serves a `/setup` screen explaining what to connect, and the
API returns `503`. Once the variable is present, `src/proxy.ts` becomes a no-op and the real
storefront takes over — no code change needed.

### Making it functional

1. **Provision PostgreSQL.** Supabase, Neon and Netlify DB all have free tiers.
2. **Set the environment variables** under *Project configuration → Environment variables*:

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | yes | Pooled connection used by the running app |
   | `DIRECT_URL` | yes | Unpooled connection, used only by `prisma migrate` |
   | `AUTH_SECRET` | yes | `openssl rand -base64 32` |
   | `NEXT_PUBLIC_SITE_URL` | yes | Your live URL — canonical tags, sitemap, email links |
   | `RAZORPAY_*` | for payments | Without them checkout refuses in production rather than simulating |
   | `SMTP_*`, `MAIL_FROM` | for email | Without them mail is logged, not sent |

   **Supabase specifically.** Take both strings from *Connect → ORMs → Prisma* in the
   dashboard. They are not interchangeable:

   ```bash
   # App runtime — transaction pooler, port 6543.
   # pgbouncer=true disables the prepared statements that pooler cannot hold.
   # connection_limit=5 matters: the usual serverless advice of 1 deadlocks
   # this app, because a single request issues several queries concurrently.
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=20"

   # Migrations only — session pooler, port 5432. Needs DDL and advisory locks.
   DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres"
   ```

   Note that Supabase's `anon` and `service_role` API keys are **not** used by this app. They
   drive Supabase's REST and JS clients; this app talks to Postgres directly through Prisma, so
   the connection string is the only credential it needs. Never expose `service_role` publicly —
   it bypasses Row Level Security.

3. **Create the schema and load content**, pointed at the same database:

   ```bash
   DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npm run db:deploy
   DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npm run db:seed   # optional demo catalog
   ```

4. **Redeploy.** The storefront replaces the setup screen.

### After go-live

- Change the seeded admin password immediately, or create your own admin and delete the seeded one.
- Point the Razorpay webhook at `https://<your-domain>/api/payment/webhook` and set
  `RAZORPAY_WEBHOOK_SECRET` to match. The signature is checked against the raw body, so no
  redirect may sit in front of that path.
- Submit `https://<your-domain>/sitemap.xml` in Google Search Console.

---

## Layout

```
prisma/
  schema.prisma        Data model (PRD §7)
  seed.ts              Demo catalog, guides, pages, coupons
  migrations/          Production migration history
scripts/
  dev-db.mjs           Embedded Postgres for development
  smoke.mjs            Browser end-to-end checks
src/
  actions/             Server Actions — cart, checkout, auth, admin
  app/                 Routes (storefront, account, admin, API)
  components/          UI, with admin-only pieces under components/admin
  lib/                 Domain logic — catalog, cart, orders, stock, payments
  generated/prisma/    Prisma client (generated; not linted)
```

Where a module implements a numbered requirement, the comment names it (`CHK-07`, `PAY-02`,
`ADM-04`) so the code stays legible against the requirements it implements.

---

## Notable behaviour

- **Stock cannot oversell.** Orders reserve stock on creation and hold it for a configurable
  window; payment converts the reservation into a decrement, and failure or expiry releases it.
  Availability is always `stock − live reservations`.
- **Prices are never trusted from the browser.** Totals, discounts and shipping are recomputed
  server-side at order creation.
- **Sold-out products stay listed** and indexable, with the buy button disabled.
- **Reviews are held for moderation** and the aggregate rating is recomputed from approved
  reviews only.
- **Shipping** is a flat rate with a separate figure for baskets containing live plants, waived
  above a configurable threshold. All three values are editable in admin.

---

## Known gaps

These are deliberate, and tracked as open questions in the requirements document:

- **Cash on Delivery** is not implemented — prepaid only, via the payment gateway.
- **GST invoicing** is not implemented; the tax field is a flat percentage.
- **Courier API integration** is not implemented — AWB numbers are entered by hand (ORD-09).
- **Product image upload** is not built: seeded products use generated SVG placeholders served
  from `/img/ph/`. Real photography is a client deliverable.
- **Rate limiting is in-memory**, which is correct for a single-instance deployment. Behind
  more than one instance it must move to Redis or the edge.
- The build prints a Prisma/Turbopack tracing warning about filesystem access inside the
  generated client. It is a known upstream warning and does not affect the build output.
