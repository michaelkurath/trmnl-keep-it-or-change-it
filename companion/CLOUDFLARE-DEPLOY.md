# Cloudflare Workers deployment

This is **not deployed yet**. This guide describes a public deployment of the existing
voting companion; the current ChatGPT Sites pilot remains private. TRMNL needs an
unauthenticated HTTPS `/api/state` endpoint and a public voting page.

Deployment is separate from TRMNL GitHub Sync. Files in `src/` are untouched.

## Cloudflare setup (one time)

1. Sign in to a Cloudflare account with Workers and D1 enabled. Enable its
   `workers.dev` subdomain if prompted.
2. Create a D1 database called `keep-it-or-change-it-db` in Cloudflare, or run:

   ```sh
   cd companion
   pnpm install --frozen-lockfile
   pnpm exec wrangler login
   pnpm exec wrangler d1 create keep-it-or-change-it-db
   ```

   Record the returned **database ID** (UUID) and your **Cloudflare account ID**.
3. Apply the database schema **once**, before the first deployment:

   ```sh
   pnpm exec wrangler d1 execute keep-it-or-change-it-db --remote --file=drizzle/0000_fuzzy_morg.sql
   ```

   This SQL is not idempotent. Do not rerun it against a populated database,
   as the tables already exist. Back up D1 before any future schema changes.

4. Create a Cloudflare API token with permission to deploy Workers in your
   account and access the selected D1 database.
   In GitHub, under **Settings → Secrets and variables → Actions → Secrets**,
   add repository secrets:

   - `CLOUDFLARE_API_TOKEN` — deployment token
   - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
   - `CLOUDFLARE_D1_DATABASE_ID` — UUID from D1

   Never commit a token. The database *name* is fixed by the deployment workflow,
   while the database ID is injected only at build time.

## Deploy

1. Merge the reviewed code into `main`.
2. Open GitHub **Actions → Deploy public voting service → Run workflow** on `main`.
   No deployment is triggered automatically by a TRMNL sync.
3. The workflow installs packages, tests the voting logic, type-checks,
   builds the Worker with the D1 binding, verifies the generated Worker
   configuration, and calls Wrangler to publish.
4. Read the `workers.dev` URL from the workflow deployment log.
   In repository **Settings → Secrets and variables → Actions → Variables**,
   optionally add `PUBLIC_GAME_URL` with that HTTPS origin (no trailing slash).
   Future manual deployments will also smoke-test the public API and image.

### Verify before connecting TRMNL

- Open the deployed home page in a private browser. It must load without an account.
- Open `https://YOUR-WORKER.workers.dev/api/state`. Confirm
  `round_id`, `image_url`, `vote_url`, and `closes_at`, and that the
  `image_url` opens.
- Submit one KEEP or CHANGE vote from the page. Reload: the same browser
  should report the saved choice and must not allow a second counted vote.
- Verify that the clock uses **20:00 UTC**, not local Swiss time. On DST changes,
  local closing time moves, while the worldwide cutoff remains fixed.
- In the TRMNL private plugin, set **Game server URL** to the HTTPS origin,
  without a trailing slash. Check full/half/quarter views and QR scanning
  on an actual device.

**Important:** Current votes are identified by a first-party browser cookie.
This prevents most accidental repeat submissions but not deliberate multi-browser
voting. Do not advertise it as a tamper-proof poll. Consider Cloudflare rate limits
and abuse monitoring before submitting a public recipe.

### Troubleshooting

- **503 from `/api/state`**: most often the D1 tables were not created or the
  `DB` binding is wrong. Check Worker logs and the D1 database ID.
- **Generated Worker config not found**: the existing application expects
  `dist/server/wrangler.json` with the pinned Vinext/Vite versions. Do not
  deploy a guessed config; inspect the build output and update the workflow.
- **QR opens private sign-in**: you entered the private Sites preview, not
  the published public Worker URL.
- **TRMNL shows old code**: use GitHub **Import/Pull** in TRMNL before pressing
  **Save** (Save exports the current TRMNL editor back to GitHub).
