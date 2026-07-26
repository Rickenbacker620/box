# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Box is a personal product/review catalog **dashboard**: a read-only, unauthenticated React SPA (`box-frontend`) backed by a read-only, unauthenticated Cloudflare Worker API (`box-worker`) using Elysia, Drizzle ORM, D1 (SQLite), and R2 (image storage). Both layers only expose GET endpoints/UI — there is no create/update/delete and no auth check anywhere in this app; product and brand data must be seeded/edited directly in D1 (e.g. via `drizzle-kit studio` or manual SQL). Because there's no auth, treat the deployed API/site as fully public — don't reintroduce any assumption of access control without being asked. It's a pnpm workspace with two packages: `box-frontend` and `box-worker` (note: `pnpm-workspace.yaml` also lists `box-worker-ely`, which does not currently exist in the repo).

## Commands

Run these from the respective package directory unless noted.

### box-worker (Cloudflare Worker API)
- `pnpm dev` — start local dev server (wrangler dev, port 8787)
- `pnpm deploy` — minified deploy via wrangler
- `pnpm lint` / `pnpm lint:fix` — ESLint
- `pnpm cf-typegen` — regenerate `worker-configuration.d.ts` from `wrangler.jsonc` bindings
- `pnpm db:generate` — generate a new Drizzle migration from schema changes in `src/db/schema.ts`
- `pnpm db:migrate:local` / `pnpm db:migrate:remote` — apply migrations to local/remote D1
- `pnpm db:studio` — open Drizzle Studio
- `pnpm db:push` — push schema directly (dev convenience, bypasses migrations)
- `pnpm db:reset` — wipe local `.wrangler` state and re-apply migrations (local only)

There is no test runner configured for either package.

### box-frontend (React SPA)
- `pnpm dev` — start Vite dev server
- `pnpm build` — typecheck (`tsc -b`) then `vite build`
- `pnpm lint` / `pnpm lint:fix` — ESLint
- `pnpm generate:client` — regenerate the typed API client in `src/client/` via `@hey-api/openapi-ts`, fetching the OpenAPI schema from a **running local worker** at `http://localhost:8787/openapi/json` (see `openapi-ts.config.ts`). Run `pnpm dev` in `box-worker` first, then run this whenever worker routes/schemas change.

### Root
- `pnpm deploy:frontend` / `pnpm deploy:worker` — deploy each package via wrangler from the repo root.

## Architecture

### Worker (`box-worker/src`)

Built with Elysia (a Bun-style router that also runs on Cloudflare Workers). `index.ts` is the app entrypoint: it wires up CORS, OpenAPI docs (served at `/openapi/json`, consumed by the frontend's codegen), the `productRoutes` and `brandRoutes` plugins, a `/categories` endpoint, and a `/images/*` endpoint that streams objects straight from the R2 `BUCKET` binding.

- `product.ts` / `brand.ts` — route plugins, each defining TypeBox schemas (`t.Object(...)`) alongside handlers. Only `GET /` and `GET /:id` exist on each — write routes (POST/PUT/DELETE) and the old bearer-token `auth` plugin were intentionally removed to make this a fully public, read-only dashboard; don't re-add them without being asked. Products belong to brands via `brandId`; the `getBrandIdByName` helper remains in `product.ts` for the brand-name query filter.
- `types.ts` — `PRODUCT_CATEGORIES` is the single source of truth for valid categories; both the worker's validation and any category-based UI should derive from it.
- `db/schema.ts` — Drizzle schema for `products` and `brands` tables (D1/SQLite). Changing this requires `pnpm db:generate` + a migration apply.
- `db/index.ts` — `getDb(env.DB)` wraps a D1 binding in a Drizzle instance; `env` itself comes from the `cloudflare:workers` module import (not handler args) throughout the worker.
- Images: `/images/*` serves objects straight from the R2 `BUCKET` binding by key (the `imageUrl` column stores the R2 key). There is no upload path anymore — images must be put into R2 out-of-band.

Bindings (`wrangler.jsonc`): `DB` (D1, migrations in `box-worker/drizzle`), `BUCKET` (R2, bucket `box-assets`).

### Frontend (`box-frontend/src`)

- `src/client/` is **fully generated** by `@hey-api/openapi-ts` (see `pnpm generate:client`) — do not hand-edit; regenerate instead after backend route/schema changes. Includes a generated TanStack Query integration (`client/@tanstack/react-query.gen.ts`) that the app consumes via hooks like `getProductsOptions()`.
- `main.tsx` sets the generated client's `baseUrl` from `config.apiBaseUrl` once at startup (no auth header — there is no token flow).
- `config.ts` reads `VITE_API_BASE_URL` from Vite env files (`.env.development`, `.env.production`).
- `App.tsx` renders a dashboard directly (no gate/login screen): `ProductFilters` (brand/category filter dropdowns) + `ProductList` (read-only card list, images loaded from the worker's `/images/*` route). There is no create/edit/delete UI, and `components/brands/` currently has no components (brand management was removed along with the write API).
- UI components under `components/ui/` are shadcn/ui-style primitives (Radix + `class-variance-authority` + Tailwind).
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` (no separate `tailwind.config`; see `src/index.css`), theming via `next-themes` (`mode-toggle.tsx`).

### Deployment

`.github/workflows/deploy.yml` deploys on push to `main`: builds and deploys the frontend to Cloudflare Pages (project `fu78sion-box`) and the worker via `wrangler deploy`. Note the Pages project name in CI (`fu78sion-box`) differs from the one in the root `package.json` script (`box-frontend`).
