# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Box is a personal product/review catalog **dashboard**: a read-only, unauthenticated React SPA at the repo root. It reads directly from Supabase (PostgreSQL via `@supabase/supabase-js`) and Supabase Storage for images — there is no backend API in this app. The app only exposes read (SELECT) access; there is no create/update/delete UI and no auth check anywhere. Product and brand data must be seeded/edited directly in Supabase (SQL editor, table editor, or a trusted script using the `service_role` key — never from the browser). Because there's no auth, treat the deployed site as fully public; access control is enforced entirely by Postgres RLS policies (`anon` has SELECT-only on `brands` and `products`). Don't reintroduce any assumption of app-level access control, and don't add write access for `anon`, without being asked.

This used to be a pnpm workspace with a separate `box-worker` (Cloudflare Worker + D1 + R2) backend; that package has been removed now that the data layer lives in Supabase. See `migration.md` for the migration history and any still-open follow-ups.

## Commands

Run from the repo root.

- `pnpm dev` — start Vite dev server
- `pnpm build` — typecheck (`tsc -b`) then `vite build`
- `pnpm lint` / `pnpm lint:fix` — ESLint
- `pnpm preview` — preview a production build locally
- `pnpm deploy` — deploy `dist/` to Cloudflare Pages via wrangler

There is no test runner configured.

## Architecture

- `src/lib/supabase.ts` — creates the Supabase client from `config.supabaseUrl` / `config.supabasePublishableKey`. Only the publishable (anon) key is ever used client-side.
- `src/lib/queries.ts` — TanStack Query options (`brandsQueryOptions`, `productsQueryOptions`) that read `brands`/`products` directly via PostgREST, joining `products.brands(name)` for the brand name. Also exposes `getProductImageUrl()`, which builds a public URL via `supabase.storage.from('box-assets').getPublicUrl(...)`.
- `config.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Vite env files (`.env.development`, `.env.production`) and throws if either is missing.
- `App.tsx` renders a dashboard directly (no gate/login screen): `ProductFilters` (brand/category filter dropdowns, derived client-side from the loaded products) + `ProductList` (read-only card list, images from Supabase Storage). There is no create/edit/delete UI.
- UI components under `components/ui/` are shadcn/ui-style primitives (Radix + `class-variance-authority` + Tailwind) — only the primitives actually used by the app are kept (unused ones like `input`/`label`/`select`/`switch`/`textarea`/`sonner` have been removed as dead code).
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` (no separate `tailwind.config`; see `src/index.css`), theming via `next-themes` (`mode-toggle.tsx`).

## Supabase

- Project name: `fu78sion-box`, project ref `rlyngocxosbmcylsxtvw`, region `us-west-2`, Postgres 17.
- Tables: `brands` (`id`, `name`) and `products` (`id`, `name`, `brand_id`, `category`, `rating`, `comment`, `image_url`), both with RLS enabled and `anon` limited to SELECT.
- Storage bucket `box-assets` is public (read-only for the dashboard); `image_url` stores the object path within that bucket.
- Only the publishable key belongs in frontend env vars/code. The `secret`/`service_role` key must never be committed or shipped to the browser.

## Deployment

`.github/workflows/deploy.yml` deploys on push to `main`: installs deps, runs `pnpm run build`, and deploys `dist/` to Cloudflare Pages (project `fu78sion-box`) via `wrangler-action`.
