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

test('declares strict HSTS for /*', () => {
  assert.match(headers, /^\s*Strict-Transport-Security:.*max-age=\d{7,}/m);
  assert.match(headers, /includeSubDomains/);
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

test('CSP forbids frame-ancestors and remote scripts', () => {
  assert.match(headers, /^\s*Content-Security-Policy:.*frame-ancestors 'none'/m);
  assert.match(headers, /^\s*Content-Security-Policy:.*default-src 'self'/m);
  assert.doesNotMatch(headers, /'unsafe-eval'/);
});

test('/api/* is marked Cache-Control: no-store', () => {
  assert.match(headers, /^\/api\/\*$/m);
  // The /api/* block must include no-store; we accept any whitespace.
  const apiBlock = headers.split(/^\/api\/\*$/m)[1] || '';
  assert.match(apiBlock, /Cache-Control:\s*no-store/);
});
