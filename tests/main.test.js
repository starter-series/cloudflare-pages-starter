import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initGreeting, initVisits } from '../src/main.js';

// ── Why no jsdom ──────────────────────────────────────────────────────────
// This starter's design rule is "lightweight: clone → done, no heavyweight
// frameworks". jsdom pulls ~20 transitive packages into an otherwise tiny dep
// tree. The client only ever touches three DOM surfaces — getElementById,
// element.textContent, element.hidden — so we model exactly those with a faithful
// stub and drive the *real* src/main.js functions through an injected fetch.
// The tests are behavioural (they assert what the user sees), and they fail if
// the corresponding bug is reintroduced — see the inline notes per test.

// Minimal faithful element: textContent is a string, hidden is a boolean,
// both default to the pre-script HTML state.
function makeElement(initialText = '') {
  return { textContent: initialText, hidden: false };
}

// Minimal document with only getElementById, backed by an id→element map.
function makeDocument(elements) {
  return {
    getElementById: (id) => elements[id] ?? null,
  };
}

// Build a fetch stub from a map of url → handler. Handler returns the Response
// (or a value/thrower) for that URL. Records calls for assertions.
function makeFetch(routes) {
  const calls = [];
  const fetchFn = async (url) => {
    calls.push(url);
    const handler = routes[url];
    if (!handler) throw new TypeError(`unexpected fetch: ${url}`);
    return handler();
  };
  fetchFn.calls = calls;
  return fetchFn;
}

// Response factories mirroring the real fetch Response surface used by the code
// (.ok, .status, .json()).
function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}
function nonJsonResponse(status = 200) {
  // .json() rejects, as a real Response does for a non-JSON body (e.g. an HTML
  // error page served by the edge in front of the function).
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  };
}

// ── greeting ────────────────────────────────────────────────────────────────

test('greeting: 200 JSON fills #greeting with the server greeting', async () => {
  const greeting = makeElement('Calling /api/hello...');
  const doc = makeDocument({ greeting });
  const fetchFn = makeFetch({
    '/api/hello?name=world': () => jsonResponse({ greeting: 'Hello, world!' }),
  });

  await initGreeting(doc, fetchFn);

  assert.equal(greeting.textContent, 'Hello, world!');
  assert.equal(greeting.hidden, false);
  assert.deepEqual(fetchFn.calls, ['/api/hello?name=world']);
});

test('greeting: non-2xx shows a visible error (NOT "Hello, undefined")', async () => {
  // Reconciliation bug guard: pre-fix the hello fetch did `.then(r => r.json())`
  // without checking r.ok, so a 400/500 whose body is `{error: ...}` (no
  // `greeting` field) destructured to `greeting === undefined` and rendered the
  // literal string "undefined". The okJson() guard now throws on non-2xx and the
  // catch surfaces a real error.
  const greeting = makeElement('Calling /api/hello...');
  const doc = makeDocument({ greeting });
  const fetchFn = makeFetch({
    '/api/hello?name=world': () => jsonResponse({ error: 'boom' }, 500),
  });

  await initGreeting(doc, fetchFn);

  assert.match(greeting.textContent, /^Error: /);
  assert.doesNotMatch(greeting.textContent, /undefined/);
});

test('greeting: non-JSON body shows a visible error (does not throw out of init)', async () => {
  // A 200 with an unparseable body (edge returns HTML) must not crash the page;
  // the catch turns the JSON parse failure into a visible error line.
  const greeting = makeElement('Calling /api/hello...');
  const doc = makeDocument({ greeting });
  const fetchFn = makeFetch({
    '/api/hello?name=world': () => nonJsonResponse(200),
  });

  await assert.doesNotReject(initGreeting(doc, fetchFn));
  assert.match(greeting.textContent, /^Error: /);
});

test('greeting: network rejection shows a visible error', async () => {
  const greeting = makeElement('Calling /api/hello...');
  const doc = makeDocument({ greeting });
  const fetchFn = makeFetch({
    '/api/hello?name=world': () => {
      throw new TypeError('Failed to fetch');
    },
  });

  await initGreeting(doc, fetchFn);
  assert.equal(greeting.textContent, 'Error: Failed to fetch');
});

test('greeting: missing #greeting element is a no-op (no throw, no fetch)', async () => {
  const doc = makeDocument({}); // no greeting element
  const fetchFn = makeFetch({});
  await assert.doesNotReject(initGreeting(doc, fetchFn));
  assert.deepEqual(fetchFn.calls, [], 'must not fetch when the target element is absent');
});

// ── visits ────────────────────────────────────────────────────────────────

test('visits: 200 numeric payload fills #visits and leaves it visible', async () => {
  const visits = makeElement('Loading page views...');
  const doc = makeDocument({ visits });
  const fetchFn = makeFetch({
    '/api/visits': () => jsonResponse({ visits: 42 }),
  });

  await initVisits(doc, fetchFn);

  assert.equal(visits.textContent, 'Page views: 42');
  assert.equal(visits.hidden, false);
});

test('visits: 503 (KV unavailable) HIDES the element', async () => {
  // Core documented degradation: when /api/visits returns 503 (missing binding
  // or KV runtime failure) the counter element must be hidden, not show an
  // error. Pre-reconciliation the guard was `r.ok ? r.json() : null`, which
  // happened to hide on 503; this test pins that behaviour so a future refactor
  // (e.g. dropping the r.ok guard) that surfaces an error instead fails here.
  const visits = makeElement('Loading page views...');
  const doc = makeDocument({ visits });
  const fetchFn = makeFetch({
    '/api/visits': () => jsonResponse({ error: 'KV temporarily unavailable' }, 503),
  });

  await initVisits(doc, fetchFn);

  assert.equal(visits.hidden, true, '#visits must be hidden on 503');
  // Must not have rendered the server error string into the element.
  assert.doesNotMatch(visits.textContent, /KV temporarily unavailable/);
  assert.doesNotMatch(visits.textContent, /Error/);
});

test('visits: non-JSON body hides the element (no crash)', async () => {
  const visits = makeElement('Loading page views...');
  const doc = makeDocument({ visits });
  const fetchFn = makeFetch({
    '/api/visits': () => nonJsonResponse(200),
  });

  await assert.doesNotReject(initVisits(doc, fetchFn));
  assert.equal(visits.hidden, true);
});

test('visits: 200 with non-numeric visits hides the element', async () => {
  // The function above falls back to a decimal *string* above MAX_SAFE_INTEGER.
  // The client only renders a numeric `visits`; a string payload must hide the
  // element rather than print "Page views: <huge string>".
  const visits = makeElement('Loading page views...');
  const doc = makeDocument({ visits });
  const fetchFn = makeFetch({
    '/api/visits': () => jsonResponse({ visits: '9007199254740993' }),
  });

  await initVisits(doc, fetchFn);
  assert.equal(visits.hidden, true);
});

test('visits: network rejection hides the element', async () => {
  const visits = makeElement('Loading page views...');
  const doc = makeDocument({ visits });
  const fetchFn = makeFetch({
    '/api/visits': () => {
      throw new TypeError('Failed to fetch');
    },
  });

  await initVisits(doc, fetchFn);
  assert.equal(visits.hidden, true);
});

test('visits: missing #visits element is a no-op (no throw, no fetch)', async () => {
  const doc = makeDocument({}); // no visits element
  const fetchFn = makeFetch({});
  await assert.doesNotReject(initVisits(doc, fetchFn));
  assert.deepEqual(fetchFn.calls, [], 'must not fetch when the target element is absent');
});

test('both fetches guard r.ok identically (reconciled error contract)', async () => {
  // Symmetry assertion: feed BOTH endpoints a non-2xx JSON body and verify each
  // surface reacts per its contract — greeting shows an error, visits hides —
  // i.e. neither silently renders the error body as success. This is the single
  // test that fails if the two fetches' error handling diverges again.
  const greeting = makeElement('Calling /api/hello...');
  const visits = makeElement('Loading page views...');
  const doc = makeDocument({ greeting, visits });
  const fetchFn = makeFetch({
    '/api/hello?name=world': () => jsonResponse({ error: 'nope' }, 502),
    '/api/visits': () => jsonResponse({ error: 'nope' }, 502),
  });

  await Promise.all([initGreeting(doc, fetchFn), initVisits(doc, fetchFn)]);

  assert.match(greeting.textContent, /^Error: /);
  assert.doesNotMatch(greeting.textContent, /undefined|nope/);
  assert.equal(visits.hidden, true);
  assert.doesNotMatch(visits.textContent, /nope/);
});
