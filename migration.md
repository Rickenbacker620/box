# Cloudflare → Supabase 迁移交接

最后更新：2026-07-26

## 目标

将项目的数据层从 Cloudflare Worker + D1 + R2 迁移到 Supabase：

- 前端部署在免费的静态托管上（最初计划是 Cloudflare Pages，2026-07-26 改成了 GitHub Pages，见下面「已完成：部署迁移到 GitHub Pages」）。
- 浏览器直接使用 Supabase JS 读取 PostgreSQL 与 Storage。
- 前端保持只读；新增、修改、删除数据由可信工具或 AI 通过受保护的 Supabase 权限完成。
- 迁移完成后不再需要 Worker 充当前端 API。
- 本阶段保持原有 `products` 和 `brands` 数据模型，不扩展菜谱、价格记录等未来功能。

目标架构：

```text
GitHub Pages 上的 React 前端
        ├── Supabase Postgres（brands / products）
        └── Supabase Storage（box-assets）
```

## 当前工作位置

- 仓库：`/Users/shiro/workplace/box`
- 当前分支：`codex/supabase-migration`
- 工作区有未提交改动。
- 尚未 push、创建 PR 或部署新的 Pages 版本。
- **注意（偏离原计划）**：经用户在 2026-07-26 明确确认，`box-worker/` 本地源码与根目录 `deploy:worker` 脚本已经删除，`box-frontend/` 也已经拍平到仓库根目录（详见下面的「已完成：worker 源码删除与仓库拍平」）。这比原「剩余工作」清单里第 8 步（建议等生产稳定后再删）提前执行。云端 Cloudflare Worker deployment、D1、R2 **没有**被删除或修改，仍然可用于回滚；只是本地已经没有可以直接重新 `wrangler deploy` 的 Worker 源码了。

## Supabase 项目

- 项目名：`fu78sion-box`
- Project ref：`rlyngocxosbmcylsxtvw`
- URL：`https://rlyngocxosbmcylsxtvw.supabase.co`
- Region：`us-west-2`
- PostgreSQL：17

前端只使用 publishable key。不要把 `secret` key 或 `service_role` key 放进 Vite 环境变量或浏览器代码。

## 已完成：数据库迁移

D1 数据已迁移到 Supabase PostgreSQL：

| 表 | 行数 | 字段 |
| --- | ---: | --- |
| `brands` | 22 | `id text not null`, `name text not null` |
| `products` | 105 | `id text not null`, `name text not null`, `brand_id text not null`, `category text not null`, `rating integer not null`, `comment text null`, `image_url text null` |

验证结果：

- 已对 D1 与 Supabase 做完整逐字段比较，22 个品牌和 105 个产品完全一致。
- `products.brand_id` 已关联 `brands`。
- 两张表都已启用 RLS。
- `anon` 只有 SELECT policy：
  - `Public read brands`
  - `Public read products`
- 没有给匿名用户 INSERT、UPDATE 或 DELETE 权限。

D1 完整 SQL 备份位于 `/private/tmp/box-d1-backup.sql`。这是临时目录文件，不应当作为唯一长期备份。

## 已完成：图片迁移

R2 图片已迁移到 Supabase Storage：

- Bucket：`box-assets`
- Bucket 为 public，供只读前端直接显示图片。
- 对象数：105
- 总大小：34,812,427 bytes
- 数据库引用但缺失的图片：0
- 未被数据库引用的多余图片：0
- 临时使用过的匿名 Storage INSERT policy 已删除。

公开图片 URL 已实际请求验证，返回 `HTTP 200` 和 `image/png`。

注意：此前 Cloudflare 的 bucket info/统计结果曾显示为空，但远程逐对象 GET 证明 R2 中确实有文件，因此不要仅依据缓存或 bucket 统计判断源数据为空。

## 已完成：前端代码切换

前端已经从生成的 Worker/OpenAPI 客户端切换到 `@supabase/supabase-js@2.110.8`：

- 新增 `box-frontend/src/lib/supabase.ts`
- 新增 `box-frontend/src/lib/queries.ts`
- `brands` 和 `products` 通过 TanStack Query 直接读取 Supabase。
- 产品查询通过 PostgREST relation 同时取得品牌名。
- 图片地址通过 `supabase.storage.from('box-assets').getPublicUrl(...)` 生成。
- 环境变量已改为：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- 已移除 `@hey-api/openapi-ts`。
- 已删除 OpenAPI 配置和 `box-frontend/src/client/` 下约 2,700 行生成代码。
- 清除筛选条件时统一使用 `undefined`，与组件状态类型保持一致。

`.env.development` 和 `.env.production` 当前都被 Git 跟踪，其中仅包含 Supabase URL 和 publishable key。publishable key 本来就是浏览器公开凭据，安全边界由 RLS 决定。

## 已完成：部署流程调整

`.github/workflows/deploy.yml` 已在当前分支修改：

- workflow 名称改为只部署 Cloudflare Pages 前端。
- pnpm 固定为 `10.28.2`。
- 删除了自动部署 Worker 的步骤。
- Pages 项目名仍为 `fu78sion-box`。

这只是不再更新 Worker；现有 Worker 部署不会因此自动删除，方便回滚。

`box-worker/` 与根目录的 `deploy:worker` 脚本暂时保留，也是有意的回滚措施。

## 已完成：worker 源码删除与仓库拍平

2026-07-26，用户明确确认后执行：

- 删除了 `box-worker/` 整个目录（Elysia + Drizzle + D1/R2 源码），以及根目录 `package.json` 里的 `deploy:worker` 脚本。
- 删除了根 `.npmrc`（`ignore-workspace-root-check` 不再需要）、`mise.toml`（只包含已注释的 D1/Worker 相关环境变量）。
- 最初也删除了 `pnpm-workspace.yaml`（当时项目已经是单包，不再需要 workspace 列表），但后来发现 pnpm 11.x 把 `onlyBuiltDependencies`/`allowBuilds`（哪些依赖的 postinstall 脚本被信任执行，例如 `esbuild`/`sharp`/`workerd`）这类设置从 `package.json` 的 `pnpm` 字段移到了 `pnpm-workspace.yaml`，所以这个文件又加回来了——现在它**不是**workspace 列表，只放这类 pnpm 设置：
  ```yaml
  onlyBuiltDependencies:
    - esbuild
    - sharp
    - workerd
  allowBuilds:
    esbuild: true
    sharp: true
    workerd: true
  ```
  这两个字段缺一不可：只写 `onlyBuiltDependencies` 不会生效，pnpm 11 仍会因为 `ERR_PNPM_IGNORED_BUILDS` 拒绝执行这几个包的安装脚本，必须同时显式写 `allowBuilds: true`。用项目固定的 `corepack pnpm@10.28.2` 不受这个问题影响（旧版本没有这层强制审批），但如果用系统/mise 装的更新版 pnpm（测试时是 11.15.1 / 11.17.0）跑 `pnpm install`/`pnpm build`，没这个文件会直接报错退出。
- 把 `box-frontend/` 下的全部内容（`src/`、`public/`、`index.html`、`vite.config.ts`、`tsconfig*.json`、`eslint.config.js`、`components.json`、`.env.development`、`.env.production`）搬到了仓库根目录，`box-frontend/` 目录本身已删除。
- 根 `package.json` 合并为单一 package（`name: box-frontend`），保留 frontend 的 `dev`/`build`/`lint`/`lint:fix`/`preview` 脚本，新增 `deploy` 脚本（`wrangler pages deploy dist --project-name=fu78sion-box`），并把 `wrangler` 挪进 `devDependencies`。
- 顺带清理了几处已经不再使用的死代码（这几项和 Supabase 迁移本身无关，但和 worker 一起属于本次“非必要文件”清理）：
  - 删除了空的 `src/client/` 目录树（生成客户端文件之前已删，只剩空文件夹）。
  - 删除未被任何页面引用的 shadcn 组件：`components/ui/{input,label,select,switch,textarea,sonner}.tsx`（这些是旧的可写后台遗留下来的表单/提示组件，读数据的 dashboard 用不到；`sonner` 的 `<Toaster />` 也从未被任何地方调用 `toast()`）。
  - 相应从 `package.json` 里移除了变得未使用的依赖：`@radix-ui/react-label`、`@radix-ui/react-select`、`@radix-ui/react-switch`、`sonner`。
  - `.github/workflows/deploy.yml` 的 build/deploy 步骤路径从 `box-frontend/*` 改为仓库根目录下的等价路径（`pnpm run build`、`pages deploy dist`）。
- 验证：`corepack pnpm@10.28.2 install`（在根目录）、`pnpm lint`、`pnpm build` 均通过，构建产物与之前一致（约 570 KB JS，gzip ~170 KB）。

云端资源现状（未变）：

- Cloudflare Worker 部署、D1 数据库、R2 bucket 均未被删除或修改，仍然是可用的回滚路径，只是本地已经没有 `box-worker/` 源码可以重新部署它们了——回滚该 Worker 需要先决定是否要重建/找回源码，或者接受直接切回旧的前端 build（如果还留着）。
- 如果之后确实需要回滚到 Worker 架构，`git log` 中仍能找到删除前的 `box-worker/` 版本（前提是这些改动被提交后才删除，而不是在同一次未提交的工作区改动里被覆盖——目前这些改动都还没有提交）。

## 已完成：merge 到 main

2026-07-26，用户确认后：

- 把 `codex/supabase-migration` fast-forward merge 进 `main`（`main` 从 `6dd5f5f` 直接前进到 `d8d3b5b`），并 push 到 `origin/main`。
- 这一次 push 触发的还是当时的 CI（wrangler 部署到 Cloudflare Pages），因为 GitHub Pages 切换是在 merge **之后**才做的（见下一节）。

## 已完成：部署迁移到 GitHub Pages

2026-07-26，用户决定放弃 Cloudflare Pages，改用 GitHub Pages（仓库已经切换成 public，用户接受 Supabase URL/publishable key 公开——这本来就是预期行为，安全边界是 RLS 而不是 URL 保密，见 CLAUDE.md）：

- `vite.config.ts` 新增 `base: '/box/'`，匹配 GitHub Pages 项目页的路径（`https://<user>.github.io/box/`）。这个仓库没有用 client-side 路由，所以不需要处理 SPA 404 fallback。
- `.github/workflows/deploy.yml` 从 `cloudflare/wrangler-action` 换成 `actions/upload-pages-artifact` + `actions/deploy-pages`，权限改成 `pages: write` / `id-token: write`，不再需要 `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` 这两个 repo secret。
- 顺带把 `pnpm/action-setup` 的版本从 `10.28.2` 改成了 `11.17.0`（用户要求不要再纠结跟旧版本对齐，直接换成本地默认在用的新版本）。
- 从 `package.json` 里删掉了 `deploy` 脚本（`wrangler pages deploy ...`）和 `wrangler` 依赖，因为不再需要用 wrangler 部署任何东西（Worker 源码已经删过了，Pages 现在也不用它）。
- `wrangler` 是 `sharp`/`workerd` 这两个原生构建依赖的唯一来源，删掉 wrangler 后这两个包也从依赖树里消失了；`pnpm-workspace.yaml` 里的 `onlyBuiltDependencies`/`allowBuilds` 相应精简为只剩 `esbuild`。
- 验证：`pnpm install`（系统默认 11.17.0）、`pnpm lint`、`pnpm build` 全部通过；构建产物里的资源路径确认带 `/box/` 前缀（`grep -o '/box/assets[^"]*' dist/index.html`）。

**还没做的**：

- 仓库 Settings → Pages → Build and deployment → Source 需要手动切成「GitHub Actions」（没有 `gh` CLI 或 token，这一步只能用户自己在网页上点一下）。
- 上面这些改动还没有 commit/push（当前在 `main` 分支，工作区未提交）。
- 没有再跑一次真正的 GitHub Pages 部署验证（工作流没跑过，只在本地验证了 build 产物）。
- Cloudflare Pages 项目 `fu78sion-box` 还没决定要不要弃用/删除，Cloudflare Worker/D1/R2 依然按原计划保留作为回滚路径（与 GitHub Pages 无关，见「暂时不要做」）。

## 已完成：验证

在当前未提交代码上：

- `corepack pnpm@10.28.2 lint`：通过，0 warning / 0 error（仓库拍平前是 `--dir box-frontend`，现在直接在根目录跑）。
- `corepack pnpm@10.28.2 build`：通过。
- 拍平后额外验证：用系统默认（非 corepack）的 `pnpm`（mise 装的 11.15.1 / 11.17.0）跑 `pnpm install` / `pnpm lint` / `pnpm build` 也全部通过，不再需要交互式 `pnpm approve-builds`。
- `git diff --check`：通过。
- 使用 publishable key 直接请求 Supabase REST：
  - 匿名产品查询成功。
  - `brands(name)` 返回预期的多对一对象。
- 直接请求迁移后的 Storage 图片：HTTP 200。

构建只有 Vite 的 bundle size 提示：主 JS 约 605 KB（gzip 约 180 KB）。这不是迁移阻塞项。

## 剩余工作

建议下一个 agent 按顺序继续：

1. ~~审查当前分支 diff，确认没有意外改动。~~ 已完成（多轮，包括 worker 删除和仓库拍平之后）。
2. 启动本地前端并做一次浏览器级 smoke test：
   - 页面能显示 105 个产品。
   - 品牌与分类筛选正常。
   - 图片正常显示。
   - 浏览器 console 没有 CORS、RLS 或网络错误。
   - **进度**：已经用 curl 模拟浏览器请求（带 `Origin` header）验证过 Supabase REST 查询、`brands` join、CORS 头，并确认 `pnpm dev` 能正常起服务、返回 200；但**还没有做真正的浏览器可视化检查**（没有 Playwright/截图工具），需要人工在浏览器里跑一遍。
3. 将已落地的 Supabase schema、约束、RLS policy 和 Storage 设置补成仓库内可追踪的 migration 文件。远程 schema 已经存在，处理 migration history 时不要重复执行破坏性 DDL。
4. 检查 Supabase Security/Performance Advisors，处理与本次 schema 直接相关的问题。
5. ~~在用户明确同意后再 commit、push，并部署一个 Cloudflare Pages 预览版本~~——已改变计划：用户在 2026-07-26 决定改用 GitHub Pages（不再是 Cloudflare Pages），并已把 `codex/supabase-migration` merge/push 到 `main`（见「已完成：merge 到 main」）。GitHub Pages 切换的代码改动见「已完成：部署迁移到 GitHub Pages」，但**还没 commit/push，也还没在仓库 Settings 里把 Pages source 切成 GitHub Actions，也没跑过一次真正的部署**。
6. 待办：commit 并 push 这次 GitHub Pages 的改动，用户手动把 repo Settings → Pages → Source 切成「GitHub Actions」，然后看一次真实的 Actions 部署 + 访问 `https://<user>.github.io/box/` 做 smoke test（页面、筛选、图片、console 有没有报错）。
7. Cloudflare Pages 项目 `fu78sion-box` 是否要弃用/删除，需要用户单独决定（不影响 Worker/D1/R2 的回滚计划）。
8. ~~稳定运行一段时间后，再单独征得用户授权，决定是否删除 box-worker/ 源码和根目录 Worker 脚本~~——用户已在 2026-07-26 提前明确授权，`box-worker/` 源码和根目录 `deploy:worker` 脚本已删除（见上面「已完成：worker 源码删除与仓库拍平」）。**仍然待用户单独授权**才能删除的是云端资源：
   - Cloudflare Worker deployment
   - D1 database
   - R2 bucket

## 暂时不要做

- 不要删除云端的 Cloudflare Worker deployment、D1 或 R2；它们仍是当前回滚路径（本地 `box-worker/` 源码已删除，但云端资源还在）。
- 不要把 Supabase secret/service-role key 放到前端。
- 不要给 `anon` 添加写权限。
- 不要在本次迁移中顺便重构 `products` / `brands`，或提前设计未来的菜谱、数码产品、买菜价格等表。
- 未经用户确认，不要 push、部署生产环境或删除云端资源。

## 常用命令

仓库已经拍平，前端代码现在直接在仓库根目录，不再有 `box-frontend/` 子目录：

```bash
cd /Users/shiro/workplace/box

corepack pnpm@10.28.2 install --frozen-lockfile
corepack pnpm@10.28.2 lint
corepack pnpm@10.28.2 build
corepack pnpm@10.28.2 dev

git status --short
git diff --check
```

