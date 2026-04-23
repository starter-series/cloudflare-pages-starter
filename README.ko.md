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

> ⚠️ **가장 먼저 할 일: `package.json`의 `name`을 바꾸세요** (`"my-site"` → 실제 프로젝트 이름), 그리고 `repository.url`의 `YOUR_USERNAME/YOUR_SITE`도 교체하세요. `deploy` 스크립트가 `$npm_package_name`을 Cloudflare Pages 프로젝트 이름으로 사용합니다 — **건너뛰면 CD가 엉뚱한 프로젝트에 배포하거나 실패합니다.**

```bash
# 1. GitHub에서 "Use this template" 클릭 (또는 clone)
git clone https://github.com/starter-series/cloudflare-pages-starter.git my-site
cd my-site

# 2. ⚠️ 필수 — package.json 수정
#    → "name"을 "my-site"에서 Cloudflare Pages 프로젝트 이름으로 변경
#    → repository.url의 YOUR_USERNAME/YOUR_SITE 교체
#    → description 업데이트

# 3. 의존성 설치
npm install

# 4. 로컬 개발 서버 시작
npm run dev

# 5. src/를 직접 작성한 사이트 파일로 교체
```

## 포함된 구성

```
├── src/
│   ├── index.html              # 사이트 진입점 (직접 작성한 사이트로 교체)
│   ├── style.css               # 스타일
│   └── main.js                 # JavaScript
├── functions/
│   └── api/
│       ├── hello.js            # Pages Function 예시 → GET /api/hello
│       └── visits.js           # KV 기반 방문 카운터 → GET /api/visits
├── tests/
│   ├── functions.test.js       # /api/hello용 node:test 유닛 테스트
│   └── visits.test.js          # /api/visits용 KV 목 테스트
├── wrangler.toml               # Pages 설정 + 주석 처리된 KV 바인딩 예시
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # 린트, 보안 스캔
│   │   ├── cd.yml              # Cloudflare Pages 배포
│   │   └── setup.yml           # 첫 사용 시 자동 설정 체크리스트
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   └── CLOUDFLARE_PAGES_SETUP.md  # 배포 설정 가이드
├── scripts/
│   └── bump-version.cjs        # Semver 버전 범퍼
├── eslint.config.js            # ESLint v9 flat config
├── .gitignore
└── package.json
```

## 주요 기능

- **Cloudflare Pages** — 글로벌 CDN, 무제한 대역폭, 무료
- **Wrangler CLI** — CI 또는 로컬에서 `npm run deploy`로 배포
- **CI 파이프라인** — 모든 push와 PR에서 시크릿 스캔, 대용량 파일 체크, 린트
- **CD 파이프라인** — 원클릭 Cloudflare Pages 배포 + GitHub Release 자동 생성
- **버전 관리** — `npm run version:patch/minor/major`
- **로컬 개발** — `npm run dev`로 Cloudflare Pages 에뮬레이션
- **템플릿 셋업** — 첫 사용 시 설정 체크리스트 이슈 자동 생성
- **최소 의존성** — devDependency 4개, 빌드 단계 불필요

## CI/CD

### CI (모든 PR + main push 시)

| 단계 | 역할 |
|------|------|
| 시크릿 스캔 | gitleaks로 유출된 자격증명 감지 |
| 대용량 파일 체크 | 5 MB 초과 파일 방지 (Cloudflare 제한: 25 MB) |
| Install | `npm ci` lockfile 검증 |
| 린트 | ESLint v9 flat config |
| 테스트 | `node --test`로 Pages Functions 유닛 테스트 실행 |

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
