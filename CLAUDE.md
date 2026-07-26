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

`.github/workflows/deploy.yml` deploys on push to `main`: installs deps, runs `pnpm run build`, then uploads `dist/` as a Pages artifact and deploys it via `actions/deploy-pages`. Hosted on GitHub Pages (repo Settings → Pages → Source: GitHub Actions), not Cloudflare. `vite.config.ts` sets `base: '/box/'` to match the GitHub Pages project-page path — update it if the repo is ever renamed or moved to a custom domain/user page.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.

<!--VITE PLUS END-->
