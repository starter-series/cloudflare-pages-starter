<div align="center">

# Cloudflare Pages Starter

**정적 사이트 + Cloudflare Pages + GitHub Actions CI/CD.**

사이트를 만들고, push하면 배포됩니다. 무료, 빠름.

[![CI](https://github.com/starter-series/cloudflare-pages-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/starter-series/cloudflare-pages-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-ready-F38020.svg)](https://pages.cloudflare.com/)

[English](README.md) | **한국어**

</div>

---

> **[Starter Series](https://github.com/starter-series/starter-series)** — 매번 AI한테 CI/CD 설명하지 마세요. clone하고 바로 시작하세요.
>
> [Docker Deploy](https://github.com/starter-series/docker-deploy-starter) · [Discord Bot](https://github.com/starter-series/discord-bot-starter) · [Telegram Bot](https://github.com/starter-series/telegram-bot-starter) · [Browser Extension](https://github.com/starter-series/browser-extension-starter) · [Electron App](https://github.com/starter-series/electron-app-starter) · [npm Package](https://github.com/starter-series/npm-package-starter) · [React Native](https://github.com/starter-series/react-native-starter) · [VS Code Extension](https://github.com/starter-series/vscode-extension-starter) · [MCP Server](https://github.com/starter-series/mcp-server-starter) · [Python MCP Server](https://github.com/starter-series/python-mcp-server-starter) · **Cloudflare Pages**

---

## 빠른 시작

**[create-starter](https://github.com/starter-series/create-starter) 사용** (추천):

```bash
npx @starter-series/create my-site --template cloudflare-pages
cd my-site && npm install && npm run dev
```

**또는 직접 clone:**

```bash
git clone https://github.com/starter-series/cloudflare-pages-starter my-site
cd my-site && npm install && npm run dev
```

> ⚠️ **배포 전 필수:** GitHub Actions 변수 `PROJECT_NAME`을 실제 Cloudflare Pages 프로젝트 이름으로 설정하고, `repository.url`의 `YOUR_USERNAME/YOUR_SITE`를 교체하세요. 로컬에서 `npm run deploy`를 사용할 경우 해당 스크립트가 `$npm_package_name`을 사용하므로 `package.json`의 `name`도 `"my-site"`에서 같은 프로젝트 이름으로 바꾸세요. (create-starter는 패키지 이름을 자동으로 설정합니다. `PROJECT_NAME`과 `repository.url`은 여전히 직접 설정해야 합니다.)
>
> 로컬 shell 배포용 값은 `.env.example`을 `.env`로 복사해 채우고, `.env`는 커밋하지 마세요.

## 프로젝트 범위

**Currently implemented (현재 구현됨)**
- Wrangler 기반 정적 사이트 + Cloudflare Pages 배포 (`src/` → `*.pages.dev`).
- Pages Functions 예시 (`functions/api/hello.js`) + `node:test` 유닛 테스트.
- KV 기반 카운터 (`functions/api/visits.js`) — best-effort 카운터 (KV는 eventually consistent — compare-and-swap 없음; 동시 트래픽에서 undercount 가능; 정확한 카운트가 필요하면 Durable Object 사용) + NaN 복구.
- CI: gitleaks 시크릿 스캔, ESLint v10, `npm ci --ignore-scripts`, 대용량 파일 가드.
- 빌드 계약: `npm run build`가 번들러 없이 정적 배포 경계(`src/`, `_headers`, Pages Functions, `wrangler.toml`, `package.json` deploy/files 설정)를 검증.
- CD: 수동 배포 + 태그된 GitHub Release; version guard로 중복 태그 차단.
- 보안 헤더 — `_headers` 가 CSP / HSTS / Permissions-Policy / X-Content-Type-Options 를 제공하며 회귀 테스트로 잠겨 있음.
- 주간 CodeQL + maintenance health check + stale-bot.

**Planned (로드맵)**
- 공개 로드맵상 추가 기능 없음. 의도적으로 feature-frozen 템플릿이며, 프레임워크·인증·데이터 레이어는 downstream 프로젝트에서 직접 도입.

**Design intent (설계 의도)**
- 기본 프레임워크 없음 — `src/`는 plain HTML/CSS/JS 이므로 Vite·Astro·React 도입이 마이그레이션이 아니라 한 줄 명령으로 끝남.
- `--ignore-scripts` 전면 적용 (CI + 로컬 `npm install`) — transitive dep 의 postinstall hook 으로 흘러드는 공급망 페이로드를 사전에 차단.
- KV 예시는 저장값을 strict `/^\d+$/` gate 로 검증하고(앞뒤 공백은 먼저 trim 하므로 `'50000\n'` 같은 값은 손상으로 오인하지 않음), `BigInt` 로 증가시켜 큰 카운트가 lossy float 를 거치지 않으며, 바인딩 부재 *또는* KV get/put 예외 시 raw `500` 이 아니라 `503` 으로 degrade — 카운터는 데모이며 system of record 가 아님.
- `_headers` 회귀 테스트는 "사소한 CSS 수정" 안에 묻혀 보안 정책이 drift 하는 패턴을 막기 위해 존재.

**Non-goals (의도적 제외)**
- SSR / SSG 빌드 파이프라인. 필요하다면 Astro / Next / Vite 를 직접 도입.
- Edge SQL / D1 연결. KV 가 가장 단순한 stateful primitive 로 시연되며, D1 은 feature 레포의 몫.
- Cloudflare Pages 외 커스텀 CD. CD 워크플로우는 단일 타겟이 의도된 설계.

**Redacted (비공개)**
- Cloudflare 계정 ID 및 API 토큰 — README 에는 placeholder 만; GitHub Secrets 로 주입 ([docs/CLOUDFLARE_PAGES_SETUP.md](docs/CLOUDFLARE_PAGES_SETUP.md) 참고).

> **Part of: Human-Controlled AI Systems** — AI 보조 프로젝트를 위한 safe-by-default 배포 템플릿.

## 포함된 구성

```
├── src/
│   ├── index.html              # 사이트 진입점 (직접 작성한 사이트로 교체)
│   ├── style.css               # 스타일
│   ├── main.js                 # JavaScript
│   └── _headers                # CSP / HSTS / Permissions-Policy (Cloudflare 네이티브)
├── functions/
│   └── api/
│       ├── hello.js            # Pages Function 예시 → GET /api/hello
│       └── visits.js           # KV 기반 방문 카운터 → GET /api/visits
├── tests/
│   ├── functions.test.js       # /api/hello용 node:test 유닛 테스트
│   ├── visits.test.js          # /api/visits용 KV 목 테스트
│   ├── headers.test.js         # _headers 회귀 가드 (CSP/HSTS/Permissions-Policy)
│   └── bump-version.test.js    # version-bump 스크립트 동작 + pre-release 거부 검증
├── wrangler.toml               # Pages 설정 + 주석 처리된 KV 바인딩 예시
├── .env.example                # 로컬 배포 env placeholder; untracked .env로 복사
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # 시크릿 스캔, audit, 린트, 테스트, 빌드 계약
│   │   ├── cd.yml              # Cloudflare Pages 배포
│   │   └── setup.yml           # 첫 사용 시 자동 설정 체크리스트
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── CLOUDFLARE_PAGES_SETUP.md  # 배포 설정 가이드
│   └── BRANCH_PROTECTION.md       # 권장 main 보호 정책 + gh api payload
├── scripts/
│   ├── bump-version.cjs           # 엄격 semver 버전 범퍼
│   ├── check-build-output.cjs     # Cloudflare Pages 배포 계약 검증
│   └── check-placeholders.cjs     # postinstall placeholder 경고
├── eslint.config.js            # ESLint v10 flat config
├── .gitignore
└── package.json
```

## 주요 기능

- **Cloudflare Pages** — 글로벌 CDN, 무제한 대역폭, 무료
- **Wrangler CLI** — CI 또는 로컬에서 `npm run deploy`로 배포
- **CI 파이프라인** — 시크릿 스캔, 대용량 파일 체크, 린트, `npm ci --ignore-scripts` 공급망 가드
- **보안 헤더** — `_headers` 가 CSP / HSTS / Permissions-Policy / X-Content-Type-Options 를 제공하며 회귀 테스트로 잠겨 있음
- **CD 파이프라인** — 원클릭 Cloudflare Pages 배포 + GitHub Release 자동 생성
- **버전 관리** — `npm run version:patch/minor/major`
- **로컬 개발** — `npm run dev`로 Cloudflare Pages 에뮬레이션
- **빌드 계약** — `npm run build`로 no-bundler 배포 표면 검증
- **템플릿 셋업** — 첫 사용 시 설정 체크리스트 이슈 자동 생성
- **최소 의존성** — devDependency 4개, 번들러 불필요

## CI/CD

### CI (모든 PR + main push 시)

| 단계 | 역할 |
|------|------|
| 시크릿 스캔 | gitleaks로 유출된 자격증명 감지 |
| 대용량 파일 체크 | 5 MB 초과 파일 방지 (Cloudflare 제한: 25 MB) |
| Install | `npm ci` lockfile 검증 |
| Audit | `npm audit --audit-level=high`로 high severity 의존성 이슈 차단 |
| 린트 | ESLint v10 flat config |
| 테스트 | `node --test`로 Pages Functions 유닛 테스트 실행 |
| 빌드 계약 | `npm run build`로 정적 Pages 배포 경계 검증 |

### 보안 & 유지보수

| 워크플로우 | 역할 |
|-----------|------|
| CodeQL (`codeql.yml`) | 보안 취약점 정적 분석 (push/PR + 주간) |
| Maintenance (`maintenance.yml`) | 주간 CI 헬스 체크 — 실패 시 이슈 자동 생성 |
| Stale (`stale.yml`) | 비활성 이슈/PR 30일 후 라벨링, 7일 후 자동 종료 |

### CD (Actions 탭에서 수동 실행)

| 단계 | 역할 |
|------|------|
| CI | 전체 CI 파이프라인 먼저 실행 |
| 버전 가드 | 해당 버전의 git 태그가 이미 있으면 실패 |
| 배포 preflight | `PROJECT_NAME`, `package.json` `name`, `repository.url`이 starter 기본값이면 실패 |
| 배포 | `wrangler pages deploy src`로 Cloudflare Pages에 배포 |
| GitHub Release | 자동 생성된 릴리즈 노트와 함께 태그 생성 |

**배포 방법:**

1. Cloudflare 설정 (아래 참조)
2. 버전 업: `npm run version:patch` (또는 `version:minor` / `version:major`)
3. 커밋 후 `main`에 push
4. **Actions** 탭 → **Deploy to Cloudflare Pages** → **Run workflow**

### GitHub Secrets

| Secret | 용도 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Wrangler 인증 |
| `CLOUDFLARE_ACCOUNT_ID` | 대상 Cloudflare 계정 |

일회성 설정은 [docs/CLOUDFLARE_PAGES_SETUP.md](docs/CLOUDFLARE_PAGES_SETUP.md)를 참고하세요.

## 사이트 배포하기

### 최초 설정 (한 번만)

1. [Cloudflare 계정](https://dash.cloudflare.com) 생성 (무료)
2. Pages 프로젝트 생성 (Workers & Pages → Create → Pages)
3. **Cloudflare Pages: Edit** 권한으로 API 토큰 생성
4. GitHub Secrets에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 추가
5. GitHub Environment `cloudflare` 생성
6. GitHub 변수 `PROJECT_NAME`에 Cloudflare Pages 프로젝트 이름 설정
7. 로컬 배포가 필요하면 `.env.example`을 `.env`로 복사해 로컬에서만 값을 채운 뒤 `set -a && . ./.env && set +a` 실행 후 `npm run deploy`

끝. 자세한 가이드는 [docs/CLOUDFLARE_PAGES_SETUP.md](docs/CLOUDFLARE_PAGES_SETUP.md)를 참고하세요.

### 매 릴리즈

```bash
npm run version:patch   # 0.1.0 → 0.1.1
# 커밋, push
# Actions → Deploy to Cloudflare Pages → Run workflow
```

사이트가 `https://PROJECT_NAME.pages.dev`에 배포됩니다.

## 개발

```bash
# 로컬 개발 서버 (Cloudflare Pages 에뮬레이션)
npm run dev

# 버전 업
npm run version:patch   # 0.1.0 → 0.1.1
npm run version:minor   # 0.1.0 → 0.2.0
npm run version:major   # 0.1.0 → 1.0.0

# 린트
npm run lint

# 테스트 실행
npm test

# 정적 배포 계약 검증
npm run build

# 프로젝트 metadata가 starter 기본값이면 배포 preflight 실패
npm run deploy:preflight

# high severity 의존성 이슈 audit
npm audit --audit-level=high

# 의도한 npm pack 경계 확인
npm pack --dry-run --json

# 수동 배포
npm run deploy
```

## Pages Functions

API 라우트가 필요하면 `functions/`에 파일만 넣으세요. 설정 없이 자동으로 인식됩니다.

```
functions/api/hello.js   →   GET /api/hello
functions/users/[id].js  →   GET /users/:id
```

이 스타터에는 `functions/api/hello.js`가 포함되어 있고, `src/index.html`에서 호출해 결과를 렌더링합니다. 요청을 받고 `Response`를 돌려주는 게 API의 전부입니다:

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

**로컬 개발** — `wrangler pages dev`가 에셋 디렉토리 옆에 있는 `functions/`를 자동으로 찾습니다:

```bash
npm run dev
# 실행 내용: wrangler pages dev src --port 3000
# http://localhost:3000 열기 → 페이지가 /api/hello를 호출해 인사말을 렌더링.
```

Workers 런타임 버전을 고정하고 싶다면 `--compatibility-date`를 넘기세요:

```bash
npx wrangler pages dev src --compatibility-date=2026-04-24
```

**테스트** — Pages Functions는 `Request`를 받고 `Response`를 돌려주는 평범한 ES 모듈이라, `node:test`에서 모킹 없이 바로 돌아갑니다:

```bash
npm test
```

미들웨어, `[param]` 라우팅, `env` 바인딩 (KV, D1, R2) 등 자세한 내용은 [Cloudflare Pages Functions 문서](https://developers.cloudflare.com/pages/functions/)를 참고하세요.

### Pages KV (상태 저장 예시)

`functions/api/visits.js`는 [Cloudflare Workers KV](https://developers.cloudflare.com/kv/) 기반의 작은 방문 카운터입니다. `VISITS`로 바인딩된 KV 네임스페이스에서 `count`를 읽고, 1 증가시킨 뒤 JSON으로 돌려줍니다:

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

위 스니펫은 *개념*이고, 실제 `functions/api/visits.js`는 더 단단하게 구현되어 있습니다: strict `/^\d+$/` 검증 gate(공백을 먼저 trim 하므로 `'50000\n'` 을 손상으로 오인하지 않음), `Number.MAX_SAFE_INTEGER` 를 넘어서도 정확한 `BigInt` 연산, KV get/put 예외 시 `500` 이 아닌 `503`, 그리고 lost-update 계약을 알리는 `X-Counter-Consistency: eventual` 헤더를 포함합니다. 전체 동작은 해당 파일과 `tests/visits.test.js` 를 참고하세요.

**최초 설정 (한 번만)** — KV 네임스페이스를 만드세요 (로컬 개발용 preview 네임스페이스도 함께):

```bash
npx wrangler kv namespace create VISITS
npx wrangler kv namespace create VISITS --preview
```

각 명령이 ID를 출력합니다. `wrangler.toml`을 열어 `[[kv_namespaces]]` 블록의 주석을 풀고 ID를 붙여넣으세요:

```toml
[[kv_namespaces]]
binding = "VISITS"
id = "<운영 네임스페이스 ID 붙여넣기>"
preview_id = "<preview 네임스페이스 ID 붙여넣기>"
```

**로컬 개발** — `wrangler pages dev`는 기본적으로 로컬 KV 시뮬레이터를 쓰므로 운영 데이터를 건드리지 않습니다:

```bash
npm run dev
# http://localhost:3000 열기 → 새로고침할 때마다 /api/visits 카운터가 증가.
```

네임스페이스를 만들기 전까지는 `/api/visits`가 `503`을 반환하고 페이지의 카운터 엘리먼트가 숨겨집니다 — `wrangler pages dev` 자체는 정상 기동합니다.

**배포** — `wrangler.toml`에 ID만 넣으면 기존 CD 워크플로우가 바인딩도 함께 배포합니다 (추가 시크릿 불필요).

전체 API는 [KV bindings](https://developers.cloudflare.com/kv/concepts/kv-bindings/)와 [Wrangler KV 명령어](https://developers.cloudflare.com/kv/reference/kv-commands/) 문서를 참고하세요.

## 왜 Cloudflare Pages?

|  | Cloudflare Pages | GitHub Pages | Vercel / Netlify |
|---|---|---|---|
| 대역폭 | 무제한 (무료) | 월 100 GB | 월 100 GB |
| 글로벌 CDN | 300+ 엣지 | 제한적 | 있음 |
| 커스텀 도메인 | 무료 SSL, 자동 설정 | 무료 SSL | 무료 SSL |
| 빌드 분 | 월 500회 (무료) | 빌드당 10분 | 월 6000분 |
| 가격 | 무료 | 무료 | 무료 티어 + 유료 |

## 프레임워크 추가

이 템플릿은 순수 HTML/CSS/JS로 시작합니다. 프레임워크를 추가하려면:

**Vite:**
```bash
npm install -D vite
# package.json scripts에 "build": "vite build --outDir dist" 추가
# cd.yml과 package.json에서 배포 디렉토리를 src/에서 dist/로 변경
```

**Astro:**
```bash
npm create astro@latest
# 안내에 따라 설정 후, cd.yml 배포 디렉토리 업데이트
```

프레임워크는 강제가 아니라 선택입니다.

## 기여

PR 환영합니다. [PR 템플릿](.github/PULL_REQUEST_TEMPLATE.md)을 사용해 주세요.

## 라이선스

[MIT](LICENSE)
