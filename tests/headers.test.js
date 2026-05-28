import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// `_headers` is consumed natively by Cloudflare Pages. There is no
// runtime to mock — the file IS the contract. This test acts as a
// deploy-time regression guard: a fat-finger commit that drops a
// security directive fails CI before the broken headers reach prod.
//
// IMPORTANT: the file is read from `src/_headers` — the same path Cloudflare
// Pages serves. Reading from any other location would test a file the
// deploy never uploads (verified: `wrangler pages deploy src` and
// `pages_build_output_dir = "src"` both anchor to src/).
const HERE = dirname(fileURLToPath(import.meta.url));
const headers = readFileSync(resolve(HERE, '..', 'src', '_headers'), 'utf8');

// Escape a literal directive name for embedding in a RegExp. CSP directive
// names today are all ASCII letters/digits/hyphen, but the helper is exposed
// to future tests and should not silently mis-match if a metachar shows up.
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extract the (first) enforced Content-Security-Policy directive line.
// - Case-insensitive: HTTP header names are case-insensitive per RFC 7230.
// - Multiline + start-anchor: avoid matching a comment line that quotes
//   "Content-Security-Policy:" inside `# ...` text.
// - Negative-lookahead for `-`: do NOT match `Content-Security-Policy-Report-Only:`
//   (which is a distinct header with weaker semantics).
function getCSP() {
  const m = headers.match(/^\s*Content-Security-Policy(?!-)\s*:[^\n]*/im);
  return m ? m[0] : null;
}

// Find a single CSP directive's source list. Returns null when the directive
// is ABSENT — distinct from "present but loose" so tests can assert presence
// before constraining values.
//
// Anchoring `(?:^|;)\\s*` (not `\\b`) is load-bearing: word-boundary on a
// hyphenated name like `script-src` puts the boundary between `-` and `s`,
// so `\\bscript-src\\s+` will silently match the tail of `not-script-src`
// or any future `*-script-src` directive — returning the wrong value.
//
// We strip the header-name prefix `Content-Security-Policy:` first so the
// first directive is preceded by start-of-string (not by `:`), keeping the
// `(?:^|;)` anchor simple and unambiguous.
function cspDirective(name) {
  const csp = getCSP();
  if (!csp) return null;
  const body = csp.replace(/^[^:]*:\s*/, '');
  const re = new RegExp(`(?:^|;)\\s*${escapeRe(name)}\\s+([^;]+?)(?:;|$)`, 'i');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

test('declares strict HSTS with at least a 1-year max-age', () => {
  // Two-step: find the header line first (no directive-order assumption),
  // then look for max-age=<int> anywhere on the same line. RFC 6797 allows
  // any directive order.
  const line = headers.match(/^\s*Strict-Transport-Security:[^\n]*/m);
  assert.ok(line, 'HSTS header must be present');
  const mAge = line[0].match(/\bmax-age=(\d+)\b/);
  assert.ok(mAge, 'HSTS must include a max-age directive');
  const seconds = Number(mAge[1]);
  // 31536000 = 365 days. Anything shorter is a degradation regardless of
  // how many digits the literal has — `\d{7,}` alone would accept
  // `max-age=0000001` (1 second).
  assert.ok(seconds >= 31536000, `HSTS max-age must be >= 1y, got ${seconds}s`);
  assert.match(line[0], /\bincludeSubDomains\b/, 'HSTS must include subdomains');
});

test('blocks framing globally', () => {
  assert.match(headers, /^\s*X-Frame-Options:\s*DENY/m);
});

test('disables MIME sniffing globally', () => {
  assert.match(headers, /^\s*X-Content-Type-Options:\s*nosniff/m);
});

test('sets a non-leaky Referrer-Policy', () => {
  assert.match(headers, /^\s*Referrer-Policy:\s*(no-referrer|strict-origin|strict-origin-when-cross-origin|same-origin)/m);
});

test('disables sensitive Permissions-Policy features by default', () => {
  for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
    const re = new RegExp(`Permissions-Policy:.*${feature}=\\(\\)`);
    assert.match(headers, re, `Permissions-Policy should disable ${feature} by default`);
  }
});

test('CSP declares the directives we depend on (absence ≠ safe)', () => {
  assert.ok(getCSP(), 'Content-Security-Policy header must be present');

  const defaultSrc = cspDirective('default-src');
  assert.ok(defaultSrc !== null, "CSP must declare default-src ('self' fallback)");
  assert.match(defaultSrc, /'self'/, "default-src must include 'self'");

  const frameAncestors = cspDirective('frame-ancestors');
  assert.ok(frameAncestors !== null, 'CSP must declare frame-ancestors');
  assert.match(frameAncestors, /'none'/, "frame-ancestors must be 'none'");

  const scriptSrc = cspDirective('script-src');
  assert.ok(scriptSrc !== null, 'CSP must declare script-src explicitly (not rely on default-src fallback)');
});

test('CSP forbids unsafe-eval and unsafe-inline scripts', () => {
  // Scope: check the *entire* _headers file for `unsafe-eval`, not just
  // the enforced CSP line. A future `Content-Security-Policy-Report-Only`
  // (telemetry / staging) line that permits unsafe-eval is still a leak —
  // and most-restrictive-wins semantics would NOT save us if the staging
  // policy ever gets promoted by accident.
  assert.doesNotMatch(headers, /'unsafe-eval'/, "_headers must not allow 'unsafe-eval' in any policy line");

  // style-src 'unsafe-inline' is deliberately permitted for the demo;
  // script-src 'unsafe-inline' is not. Pin both: the directive must
  // exist AND must not include 'unsafe-inline'.
  const scriptSrc = cspDirective('script-src');
  assert.ok(scriptSrc !== null, 'script-src must be declared (asserted above; re-asserting locally for failure clarity)');
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'/, "script-src must not allow 'unsafe-inline'");
});

test('CSP3 script-src-elem / script-src-attr (if declared) inherit the unsafe-inline ban', () => {
  // CSP3 introduced `script-src-elem` (inline <script>) and `script-src-attr`
  // (inline event handlers). Either override `script-src` for the relevant
  // context. If they are absent, browsers fall back to `script-src` which we
  // already constrained above. If they are present, they must be at least as
  // strict — otherwise the script-src 'unsafe-inline' ban is silently lifted.
  for (const name of ['script-src-elem', 'script-src-attr']) {
    const value = cspDirective(name);
    if (value === null) continue;
    assert.doesNotMatch(value, /'unsafe-inline'/, `${name} must not allow 'unsafe-inline'`);
    assert.doesNotMatch(value, /'unsafe-eval'/, `${name} must not allow 'unsafe-eval'`);
  }
});

test('/api/* is marked Cache-Control: no-store', () => {
  assert.match(headers, /^\/api\/\*$/m);
  // The /api/* block must include no-store; we accept any whitespace.
  const apiBlock = headers.split(/^\/api\/\*$/m)[1] || '';
  assert.match(apiBlock, /Cache-Control:\s*no-store/);
});
