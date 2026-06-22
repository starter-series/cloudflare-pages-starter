<div align="center">

# Cloudflare Pages Starter

**Static site + Cloudflare Pages + GitHub Actions CI/CD.**

Build your site. Push to deploy. Free and fast.

[![CI](https://github.com/starter-series/cloudflare-pages-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/starter-series/cloudflare-pages-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-ready-F38020.svg)](https://pages.cloudflare.com/)

**English** | [한국어](README.ko.md)

</div>

---

> **Part of [Starter Series](https://github.com/starter-series/starter-series)** — Stop explaining CI/CD to your AI every time. Clone and start.
>
> [Docker Deploy](https://github.com/starter-series/docker-deploy-starter) · [Discord Bot](https://github.com/starter-series/discord-bot-starter) · [Telegram Bot](https://github.com/starter-series/telegram-bot-starter) · [Browser Extension](https://github.com/starter-series/browser-extension-starter) · [Electron App](https://github.com/starter-series/electron-app-starter) · [npm Package](https://github.com/starter-series/npm-package-starter) · [React Native](https://github.com/starter-series/react-native-starter) · [VS Code Extension](https://github.com/starter-series/vscode-extension-starter) · [MCP Server](https://github.com/starter-series/mcp-server-starter) · [Python MCP Server](https://github.com/starter-series/python-mcp-server-starter) · **Cloudflare Pages**

---

## Quick Start

**Via [create-starter](https://github.com/starter-series/create-starter)** (recommended):

```bash
npx @starter-series/create my-site --template cloudflare-pages
cd my-site && npm install && npm run dev
```

**Or clone directly:**

```bash
git clone https://github.com/starter-series/cloudflare-pages-starter my-site
cd my-site && npm install && npm run dev
```

> ⚠️ **Before deploying:** set the GitHub Actions variable `PROJECT_NAME` to your Cloudflare Pages project name and update `repository.url` (replace `YOUR_USERNAME/YOUR_SITE`). For local `npm run deploy`, rename `package.json` `name` from `"my-site"` to the same project name because that script uses `$npm_package_name`. (create-starter handles the package name automatically; you still need to set `PROJECT_NAME` and `repository.url`.)
>
> For local shell deploys, copy `.env.example` to `.env`, fill the values locally, and keep `.env` untracked.

## Project Scope

**Currently implemented**
- Static site + Cloudflare Pages deploy via Wrangler (`src/` → `*.pages.dev`).
- Pages Functions example (`functions/api/hello.js`) with `node:test` unit tests.
- KV-backed counter (`functions/api/visits.js`) — best-effort counter (KV is eventually consistent — no compare-and-swap; may undercount under concurrent traffic; use a Durable Object for exact counts) + NaN recovery.
- CI: gitleaks secret scan, ESLint v10, `npm ci --ignore-scripts`, large-file guard.
- Build contract: `npm run build` verifies the static deploy boundary (`src/`, `_headers`, Pages Functions, `wrangler.toml`, and `package.json` deploy/files settings) without adding a bundler.
- CD: manual deploy + tagged GitHub Release; version guard rejects duplicate tags.
- Security headers — `_headers` ships CSP / HSTS / Permissions-Policy / X-Content-Type-Options, locked by a regression test.
- Weekly CodeQL + maintenance health check + stale-bot.

**Planned**
- None on the public roadmap. This template is intentionally feature-frozen; downstream projects add framework, auth, and data layers themselves.

**Design intent**
- Framework-free by default — `src/` is plain HTML/CSS/JS so adopting Vite, Astro, or React is a single command, not a migration.
- `--ignore-scripts` everywhere (CI + local `npm install`) — prevents transitive postinstall hooks from running supply-chain payloads.
- KV example validates the stored value with a strict `/^\d+$/` gate (after trimming incidental whitespace), increments with `BigInt` so large counts never go through a lossy float, and degrades to `503` — never a raw `500` — when the binding is missing *or* a KV get/put throws. The counter is a demo, not a system of record.
- `_headers` regression test exists because security policy drift is the kind of change that silently lands inside an unrelated "small CSS fix."

**Non-goals**
- Server-side rendering or SSG build pipeline. Use Astro / Next / Vite if you need them.
- Edge SQL / D1 wiring. KV is the simplest stateful primitive to demo; D1 belongs in a feature repo, not a template.
- Custom CD beyond Cloudflare Pages. The CD workflow is single-target by design.

**Redacted**
- Cloudflare account IDs and API tokens — placeholders only; populate via GitHub Secrets per [docs/CLOUDFLARE_PAGES_SETUP.md](docs/CLOUDFLARE_PAGES_SETUP.md).

> **Part of: Human-Controlled AI Systems** — safe-by-default deploy template for AI-assisted projects.

## What's Included

```
├── src/
│   ├── index.html              # Site entry point (replace with your site)
│   ├── style.css               # Styles
│   ├── main.js                 # JavaScript
│   └── _headers                # CSP / HSTS / Permissions-Policy (Cloudflare native)
├── functions/
│   └── api/
│       ├── hello.js            # Example Pages Function → GET /api/hello
│       └── visits.js           # KV-backed visit counter → GET /api/visits
├── tests/
│   ├── functions.test.js       # node:test unit tests for /api/hello
│   ├── visits.test.js          # Unit tests for /api/visits with mock KV
│   ├── headers.test.js         # _headers regression guard (CSP/HSTS/Permissions-Policy)
│   └── bump-version.test.js    # version-bump script behavior + pre-release refusal
├── wrangler.toml               # Pages config + commented KV binding example
├── .env.example                # Local deploy env placeholders; copy to untracked .env
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Secret scan, audit, lint, test, build contract
│   │   ├── cd.yml              # Deploy to Cloudflare Pages
│   │   └── setup.yml           # Auto setup checklist on first use
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── CLOUDFLARE_PAGES_SETUP.md  # Deployment setup guide
│   └── BRANCH_PROTECTION.md       # Recommended main ruleset + gh api payload
├── scripts/
│   ├── bump-version.cjs           # Strict-semver version bumper
│   ├── check-build-output.cjs     # Validates the Cloudflare Pages deploy contract
│   └── check-placeholders.cjs     # postinstall placeholder warning
├── eslint.config.js            # ESLint v10 flat config
├── .gitignore
└── package.json
```

## Features

- **Cloudflare Pages** — Global CDN, unlimited bandwidth, free
- **Wrangler CLI** — Deploy via CI or locally with `npm run deploy`
- **CI Pipeline** — Secret scan, large-file check, lint, `npm ci --ignore-scripts` supply-chain guard
- **Security headers** — `_headers` ships CSP / HSTS / Permissions-Policy / X-Content-Type-Options, locked by a regression test
- **CD Pipeline** — One-click deploy to Cloudflare Pages + auto GitHub Release
- **Version management** — `npm run version:patch/minor/major`
- **Local dev** — `npm run dev` with Cloudflare Pages emulation
- **Build contract** — `npm run build` validates the no-bundler deploy surface
- **Template setup** — Auto-creates setup checklist issue on first use
- **Minimal** — 4 devDependencies, no bundler required

## CI/CD

### CI (every PR + push to main)

| Step | What it does |
|------|-------------|
| Secret scan | gitleaks scans for leaked credentials |
| Large file check | Prevents files over 5 MB (Cloudflare limit: 25 MB) |
| Install | `npm ci` with lockfile verification |
| Audit | `npm audit --audit-level=high` blocks high-severity dependency issues |
| Lint | ESLint v10 flat config |
| Test | `node --test` runs Pages Functions unit tests |
| Build contract | `npm run build` validates the static Pages deploy boundary |

### Security & Maintenance

| Workflow | What it does |
|----------|-------------|
| CodeQL (`codeql.yml`) | Static analysis for security vulnerabilities (push/PR + weekly) |
| Maintenance (`maintenance.yml`) | Weekly CI health check — auto-creates issue on failure |
| Stale (`stale.yml`) | Labels inactive issues/PRs after 30 days, auto-closes after 7 more |

### CD (manual trigger via Actions tab)

| Step | What it does |
|------|-------------|
| CI | Runs full CI pipeline first |
| Version guard | Fails if git tag already exists for this version |
| Deploy preflight | Fails if `PROJECT_NAME`, `package.json` `name`, or `repository.url` still uses starter defaults |
| Deploy | `wrangler pages deploy src` to Cloudflare Pages |
| GitHub Release | Creates a tagged release with auto-generated notes |

**How to deploy:**

1. Set up Cloudflare (see below)
2. Bump version: `npm run version:patch` (or `version:minor` / `version:major`)
3. Commit and push to `main`
4. Go to **Actions** tab → **Deploy to Cloudflare Pages** → **Run workflow**

### GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler authentication |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account |

See [docs/CLOUDFLARE_PAGES_SETUP.md](docs/CLOUDFLARE_PAGES_SETUP.md) for the one-time setup.

## Deploying Your Site

### One-Time Setup

1. Create a [Cloudflare account](https://dash.cloudflare.com) (free)
2. Create a Pages project (Workers & Pages → Create → Pages)
3. Create an API token with **Cloudflare Pages: Edit** permission
4. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Secrets
5. Create a GitHub Environment named `cloudflare`
6. Set `PROJECT_NAME` as a GitHub variable
7. Optional for local deploys: copy `.env.example` to `.env`, fill it locally, then run `set -a && . ./.env && set +a` before `npm run deploy`

That's it. See [docs/CLOUDFLARE_PAGES_SETUP.md](docs/CLOUDFLARE_PAGES_SETUP.md) for detailed steps.

### Every Release

```bash
npm run version:patch   # 0.1.0 → 0.1.1
# commit, push
# Actions → Deploy to Cloudflare Pages → Run workflow
```

Your site will be live at `https://PROJECT_NAME.pages.dev`.

## Development

```bash
# Local dev server (Cloudflare Pages emulation)
npm run dev

# Bump version
npm run version:patch   # 0.1.0 → 0.1.1
npm run version:minor   # 0.1.0 → 0.2.0
npm run version:major   # 0.1.0 → 1.0.0

# Lint
npm run lint

# Run tests
npm test

# Validate the static deploy contract
npm run build

# Fail deploy preflight if project metadata still uses starter defaults
npm run deploy:preflight

# Audit high-severity dependency issues
npm audit --audit-level=high

# Inspect the intended npm pack boundary
npm pack --dry-run --json

# Deploy manually
npm run deploy
```

## Pages Functions

Need an API route? Add a file to `functions/` — it's picked up automatically, no config.

```
functions/api/hello.js   →   GET /api/hello
functions/users/[id].js  →   GET /users/:id
```

This starter ships with `functions/api/hello.js` wired into `src/index.html` as a demo. Reading the request and returning a `Response` is the whole API:

```js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name') ?? 'World';
  return new Response(JSON.stringify({ greeting: `Hello, ${name}!` }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

**Local dev** — `wrangler pages dev` auto-discovers `functions/` next to your assets directory:

```bash
npm run dev
# which runs: wrangler pages dev src --port 3000
# Open http://localhost:3000 — the page calls /api/hello and renders the greeting.
```

If you want to pin a Workers runtime version, pass `--compatibility-date`:

```bash
npx wrangler pages dev src --compatibility-date=2026-04-24
```

**Testing** — Pages Functions are plain ES modules that accept a `Request` and return a `Response`, so `node:test` runs them with zero mocks:

```bash
npm test
```

See [Cloudflare Pages Functions docs](https://developers.cloudflare.com/pages/functions/) for middleware, `[param]` routing, `env` bindings (KV, D1, R2), and more.

### Pages KV (stateful example)

`functions/api/visits.js` is a tiny visit counter backed by [Cloudflare Workers KV](https://developers.cloudflare.com/kv/). It reads `count` from a KV namespace bound as `VISITS`, increments it, and returns JSON:

```js
export async function onRequest(context) {
  const { env } = context;
  const current = parseInt(await env.VISITS.get('count'), 10) || 0;
  const next = current + 1;
  await env.VISITS.put('count', String(next));
  return new Response(JSON.stringify({ visits: next }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

The snippet above is the *idea*; the shipped `functions/api/visits.js` hardens it: a strict `/^\d+$/` validation gate (with whitespace trimmed first, so `'50000\n'` is not mistaken for corruption), `BigInt` math so the count stays exact past `Number.MAX_SAFE_INTEGER`, a `503` (not `500`) when KV get/put throws, and an `X-Counter-Consistency: eventual` header advertising the lost-update contract. See the file and `tests/visits.test.js` for the full behaviour.

**One-time setup** — create a KV namespace (plus a preview one for local dev):

```bash
npx wrangler kv namespace create VISITS
npx wrangler kv namespace create VISITS --preview
```

Each command prints an ID. Open `wrangler.toml`, uncomment the `[[kv_namespaces]]` block, and paste the IDs:

```toml
[[kv_namespaces]]
binding = "VISITS"
id = "<paste-production-namespace-id-here>"
preview_id = "<paste-preview-namespace-id-here>"
```

**Local dev** — `wrangler pages dev` uses a local KV simulator by default, so you don't need to touch production data:

```bash
npm run dev
# Open http://localhost:3000 — /api/visits increments on each page load.
```

Until you create the namespace, `/api/visits` returns `503` and the counter element is hidden on the page — `wrangler pages dev` still boots cleanly.

**Deploy** — once the IDs are in `wrangler.toml`, the existing CD workflow deploys the binding automatically (no extra secrets).

See the [KV bindings](https://developers.cloudflare.com/kv/concepts/kv-bindings/) and [Wrangler KV commands](https://developers.cloudflare.com/kv/reference/kv-commands/) docs for the full API.

## Why Cloudflare Pages?

|  | Cloudflare Pages | GitHub Pages | Vercel / Netlify |
|---|---|---|---|
| Bandwidth | Unlimited (free) | 100 GB/month | 100 GB/month |
| Global CDN | 300+ edge locations | Limited | Yes |
| Custom domains | Free SSL, auto-config | Free SSL | Free SSL |
| Build minutes | 500/month (free) | 10 min/build | 6000 min/month |
| Pricing | Free | Free | Free tier + paid |

## Adding a Framework

This template starts with plain HTML/CSS/JS. To add a framework:

**Vite:**
```bash
npm install -D vite
# Add "build": "vite build --outDir dist" to package.json scripts
# Change deploy directory from src/ to dist/ in cd.yml and package.json
```

**Astro:**
```bash
npm create astro@latest
# Follow the prompts, then update cd.yml deploy directory
```

The template is intentionally framework-free so you can add what you need.

## Contributing

PRs welcome. Please use the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

## License

[MIT](LICENSE)
