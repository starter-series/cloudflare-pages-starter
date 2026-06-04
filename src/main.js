// Client for the two demo Pages Functions.
//
// Both fetches guard `response.ok` BEFORE calling `.json()` — this is the
// reconciled error contract:
//   - hello:  a non-2xx (or non-JSON) response shows a visible error in the
//             greeting line instead of rendering "Hello, undefined".
//   - visits: a non-2xx (e.g. the documented 503 when KV is unavailable) or a
//             non-JSON body hides the counter element.
//
// Each init function is exported and returns a Promise so the behaviour is
// unit-testable with an injected `fetch` and `document`; in the browser they
// auto-run against the real globals at the bottom of this file.

// Parse a Response as JSON, throwing on non-2xx first so a JSON-shaped error
// body (e.g. `{ "error": "..." }`) is never mistaken for a success payload.
async function okJson(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// GET /api/hello → fill #greeting, or show "Error: ..." on any failure
// (network error, non-2xx, or a body that is not valid JSON).
export async function initGreeting(doc, fetchFn) {
  const el = doc.getElementById('greeting');
  if (!el) return;
  try {
    const { greeting } = await okJson(await fetchFn('/api/hello?name=world'));
    el.textContent = greeting;
  } catch (err) {
    el.textContent = `Error: ${err.message}`;
  }
}

// GET /api/visits → fill #visits, or hide it. The element is hidden on:
//   - the documented 503 (KV binding missing or KV runtime failure),
//   - any other non-2xx,
//   - a non-JSON body,
//   - a 200 whose payload is not a numeric `visits`.
export async function initVisits(doc, fetchFn) {
  const el = doc.getElementById('visits');
  if (!el) return;
  try {
    const data = await okJson(await fetchFn('/api/visits'));
    if (data && typeof data.visits === 'number') {
      el.textContent = `Page views: ${data.visits}`;
    } else {
      el.hidden = true;
    }
  } catch {
    el.hidden = true;
  }
}

// Auto-run in the browser only. `import.meta.main` is undefined in jsdom/node
// imports, and `document`/`fetch` are absent under `node --test`, so guarding
// on their presence keeps this module side-effect-free when imported by tests.
if (typeof document !== 'undefined' && typeof fetch !== 'undefined') {
  initGreeting(document, fetch);
  initVisits(document, fetch);
}
