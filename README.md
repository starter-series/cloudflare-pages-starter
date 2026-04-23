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

> ⚠️ **Before deploying: rename `package.json` `name`** (from `"my-site"` to your Cloudflare Pages project name) and update `repository.url` (replace `YOUR_USERNAME/YOUR_SITE`). The `deploy` script uses `$npm_package_name` as the Cloudflare Pages project name — **CD will silently deploy to the wrong project (or fail) if you skip this.** (create-starter handles the `name` automatically; you still need to set `repository.url`.)

## What's Included

```
├── src/
│   ├── index.html              # Site entry point (replace with your site)
│   ├── style.css               # Styles
│   └── main.js                 # JavaScript
├── functions/
│   └── api/
│       ├── hello.js            # Example Pages Function → GET /api/hello
│       └── visits.js           # KV-backed visit counter → GET /api/visits
├── tests/
│   ├── functions.test.js       # node:test unit tests for /api/hello
│   └── visits.test.js          # Unit tests for /api/visits with mock KV
├── wrangler.toml               # Pages config + commented KV binding example
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Lint, security scan
│   │   ├── cd.yml              # Deploy to Cloudflare Pages
│   │   └── setup.yml           # Auto setup checklist on first use
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   └── CLOUDFLARE_PAGES_SETUP.md  # Deployment setup guide
├── scripts/
│   └── bump-version.cjs        # Semver version bumper
├── eslint.config.js            # ESLint v9 flat config
├── .gitignore
└── package.json
```

## Features

- **Cloudflare Pages** — Global CDN, unlimited bandwidth, free
- **Wrangler CLI** — Deploy via CI or locally with `npm run deploy`
- **CI Pipeline** — Secret scanning, large file check, lint on every push and PR
- **CD Pipeline** — One-click deploy to Cloudflare Pages + auto GitHub Release
- **Version management** — `npm run version:patch/minor/major`
- **Local dev** — `npm run dev` with Cloudflare Pages emulation
- **Template setup** — Auto-creates setup checklist issue on first use
- **Minimal** — 4 devDependencies, no build step required

## CI/CD

### CI (every PR + push to main)

| Step | What it does |
|------|-------------|
| Secret scan | gitleaks scans for leaked credentials |
| Large file check | Prevents files over 5 MB (Cloudflare limit: 25 MB) |
| Install | `npm ci` with lockfile verification |
| Lint | ESLint v9 flat config |
| Test | `node --test` runs Pages Functions unit tests |

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
