# Cloudflare Pages Starter

Static site with Cloudflare Pages deployment and GitHub Actions CI/CD.

## Project Structure

```
src/
  index.html    → Site entry point
  style.css     → Styles
  main.js       → JavaScript
scripts/
  bump-version.js → Version bumping
docs/
  CLOUDFLARE_PAGES_SETUP.md → Deployment setup guide
```

## CI/CD Pipeline

- **ci.yml**: Push/PR to main. Gitleaks + large file check + ESLint. No secrets.
- **cd.yml**: Manual trigger. CI gate → Wrangler deploy to Cloudflare Pages → GitHub Release.
- **setup.yml**: First push only. Creates setup checklist Issue.

## Secrets Required

| Secret | Where | Purpose |
|--------|-------|---------|
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | Wrangler authentication |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | Target Cloudflare account |
| `PROJECT_NAME` | GitHub Variables | Cloudflare Pages project name |

See docs/CLOUDFLARE_PAGES_SETUP.md for how to create these.

## What to Modify

- `src/` → Your site files (HTML, CSS, JS, images)
- `package.json` → Update these fields:
  - `name` → Your project name
  - `description`
  - `repository.url` → Your repo URL
  - `deploy` script → Change `--project-name` to your Cloudflare project name
- Version → `npm run version:patch|minor|major`

## Do NOT Modify

- `cd.yml` environment name (`cloudflare`)
  - **Why**: GitHub Environment에서 시크릿 보호 설정을 참조. 이름 불일치 시 시크릿에 접근 불가.
- `cd.yml` Wrangler env vars (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
  - **Why**: Wrangler CLI가 이 환경변수명을 내부적으로 사용. 변경 시 인증 실패.
- Version guard logic
  - **Why**: 이미 존재하는 태그로 배포하면 릴리즈 충돌. guard가 미리 잡아줌.
- Large file check in CI
  - **Why**: Cloudflare Pages는 파일당 25 MB 제한. 5 MB 체크가 미리 경고해줌.

## Key Patterns

- `src/` is the deploy directory — Wrangler uploads this folder directly
- No build step by default — add a framework (Astro, Vite, etc.) if needed
- `wrangler pages dev` for local development with Cloudflare Pages emulation
- Static assets (images, fonts) go in `src/` alongside HTML
