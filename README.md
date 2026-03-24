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
> [Docker Deploy](https://github.com/starter-series/docker-deploy-starter) · [Discord Bot](https://github.com/starter-series/discord-bot-starter) · [Telegram Bot](https://github.com/starter-series/telegram-bot-starter) · [Browser Extension](https://github.com/starter-series/browser-extension-starter) · [Electron App](https://github.com/starter-series/electron-app-starter) · [npm Package](https://github.com/starter-series/npm-package-starter) · [React Native](https://github.com/starter-series/react-native-starter) · [VS Code Extension](https://github.com/starter-series/vscode-extension-starter) · [MCP Server](https://github.com/starter-series/mcp-server-starter) · [Cloudflare Pages](https://github.com/starter-series/cloudflare-pages-starter)

---

## Quick Start

```bash
# 1. Click "Use this template" on GitHub (or clone)
git clone https://github.com/starter-series/cloudflare-pages-starter.git my-site
cd my-site

# 2. Install dependencies
npm install

# 3. Start local dev server
npm run dev

# 4. Start coding
#    → Replace src/ with your site files
#    → Update package.json (name, description)
```

## What's Included

```
├── src/
│   ├── index.html              # Site entry point (replace with your site)
│   ├── style.css               # Styles
│   └── main.js                 # JavaScript
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Lint, security scan
│   │   ├── cd.yml              # Deploy to Cloudflare Pages
│   │   └── setup.yml           # Auto setup checklist on first use
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   └── CLOUDFLARE_PAGES_SETUP.md  # Deployment setup guide
├── scripts/
│   └── bump-version.js         # Semver version bumper
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

# Deploy manually
npm run deploy
```

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
