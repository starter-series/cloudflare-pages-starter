import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/hello.js';

test('GET /api/hello returns greeting with default name', async () => {
  const response = await onRequest({
    request: new Request('https://example.com/api/hello'),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  const body = await response.json();
  assert.deepEqual(body, { greeting: 'Hello, World!' });
});

test('GET /api/hello?name=test returns personalised greeting', async () => {
  const response = await onRequest({
    request: new Request('https://example.com/api/hello?name=test'),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { greeting: 'Hello, test!' });
});

test('GET /api/hello rejects name with HTML-injection characters', async () => {
  const response = await onRequest({
    request: new Request('https://example.com/api/hello?name=%3Cscript%3E'),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /name must be/);
});

test('GET /api/hello rejects oversize name (>40 chars)', async () => {
  const tooLong = 'a'.repeat(41);
  const response = await onRequest({
    request: new Request(`https://example.com/api/hello?name=${tooLong}`),
  });
  assert.equal(response.status, 400);
});

test('GET /api/hello accepts unicode names', async () => {
  const response = await onRequest({
    request: new Request('https://example.com/api/hello?name=' + encodeURIComponent('レン')),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { greeting: 'Hello, レン!' });
});
