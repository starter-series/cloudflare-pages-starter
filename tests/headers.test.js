import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// `_headers` is consumed natively by Cloudflare Pages. There is no
// runtime to mock — the file IS the contract. This test acts as a
// deploy-time regression guard: a fat-finger commit that drops a
// security directive fails CI before the broken headers reach prod.
const HERE = dirname(fileURLToPath(import.meta.url));
const headers = readFileSync(resolve(HERE, '..', '_headers'), 'utf8');

// Extract the single Content-Security-Policy directive line once.
// Cloudflare _headers uses one line per header, so the CSP is a single
// physical line. CSP directives are separated by `;`.
function getCSP() {
  const m = headers.match(/Content-Security-Policy:[^\n]*/);
  return m ? m[0] : null;
}

// Find a single CSP directive's source list (e.g. cspDirective('script-src')
// returns "'self'" if the directive declares `script-src 'self';`).
// Returns null if the directive is absent. This is the key adversarial
// affordance: `null` lets a test distinguish "directive missing" (which
// silently falls back to default-src) from "directive present but loose."
function cspDirective(name) {
  const csp = getCSP();
  if (!csp) return null;
  // Match `<name> <values>` terminated by `;` or end-of-line.
  const re = new RegExp(`\\b${name}\\s+([^;]+?)(?:;|$)`);
  const m = csp.match(re);
  return m ? m[1].trim() : null;
}

test('declares strict HSTS with at least a 1-year max-age', () => {
  const m = headers.match(/^\s*Strict-Transport-Security:\s*max-age=(\d+)([^\n]*)/m);
  assert.ok(m, 'HSTS header should be present');
  const seconds = Number(m[1]);
  // 31536000 = 365 days. Anything shorter is a degradation regardless of
  // how many digits the literal has — `\d{7,}` alone would accept
  // `max-age=0000001`.
  assert.ok(seconds >= 31536000, `HSTS max-age must be >= 1y, got ${seconds}s`);
  assert.match(m[2], /includeSubDomains/, 'HSTS must include subdomains');
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
  // Adversarial: the previous version of this test used
  // `assert.match(headers, /.*frame-ancestors 'none'/)`, which passes
  // vacuously if the directive is deleted entirely. Assert presence
  // first; THEN constrain the value.
  assert.ok(getCSP(), 'Content-Security-Policy header must be present');

  const defaultSrc = cspDirective('default-src');
  assert.ok(defaultSrc !== null, "CSP must declare default-src ('self' fallback)");
  assert.match(defaultSrc, /'self'/, "default-src must include 'self'");

  const frameAncestors = cspDirective('frame-ancestors');
  assert.ok(frameAncestors !== null, 'CSP must declare frame-ancestors');
  assert.match(frameAncestors, /'none'/, "frame-ancestors must be 'none'");

  const scriptSrc = cspDirective('script-src');
  assert.ok(scriptSrc !== null, "CSP must declare script-src explicitly (not rely on default-src fallback)");
});

test('CSP forbids unsafe-eval and unsafe-inline scripts', () => {
  const csp = getCSP();
  assert.doesNotMatch(csp, /'unsafe-eval'/, "CSP must not allow 'unsafe-eval' anywhere");

  // style-src 'unsafe-inline' is deliberately permitted for the demo;
  // script-src 'unsafe-inline' is not. Pin both: the directive must
  // exist AND must not include 'unsafe-inline'.
  const scriptSrc = cspDirective('script-src');
  assert.ok(scriptSrc !== null, "script-src must be declared (asserted above; re-asserting locally for failure clarity)");
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'/, "script-src must not allow 'unsafe-inline'");
});

test('/api/* is marked Cache-Control: no-store', () => {
  assert.match(headers, /^\/api\/\*$/m);
  // The /api/* block must include no-store; we accept any whitespace.
  const apiBlock = headers.split(/^\/api\/\*$/m)[1] || '';
  assert.match(apiBlock, /Cache-Control:\s*no-store/);
});
