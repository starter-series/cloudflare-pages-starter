// Example: stateful Pages Function backed by Cloudflare KV.
//
// Requires a KV namespace bound as `VISITS` in wrangler.toml.
// When the binding is missing (e.g. first clone before running
// `wrangler kv namespace create VISITS`), we return 503 so the UI can
// degrade gracefully instead of throwing.
//
// The SAME 503 degradation contract covers a KV runtime failure (get/put
// throws — network blip, quota, transient backend error): we catch it and
// return 503 rather than letting an uncaught exception surface as a raw 500.
// A 503 tells the client "dependency unavailable, retry later"; a 500 would
// imply a bug in this handler. Both 503 paths carry the same
// `x-counter-consistency: eventual` header as the 200 path so the client sees
// one consistent contract regardless of outcome.
//
// NOTE on counter semantics:
//   KV is *eventually consistent* and has no compare-and-swap. The
//   read-modify-write below is best-effort and will undercount under
//   concurrent traffic — two simultaneous requests can each read N and
//   both write N+1, losing one increment.
//
//   For accurate counters use a Durable Object instead (see
//   docs/DURABLE_OBJECT_COUNTER.md). KV is fine for low-traffic demos
//   and explicitly documented as such here. We mark the response with
//   `X-Counter-Consistency: eventual` so the client can see the contract.

const COUNTER_KEY = 'count';

// JS numbers lose integer precision above Number.MAX_SAFE_INTEGER
// (2^53 − 1): `9007199254740993 === 9007199254740992`. A page-view counter
// that ever reached that range would start skipping/repeating values once it
// went through the lossy float `+ 1`. We do the increment in BigInt (exact at
// any magnitude) and persist the decimal string. Reads parse back through
// BigInt too, so a previously-stored huge value round-trips without ever
// touching a float.
const BASE = {
  'cache-control': 'no-store',
  'x-counter-consistency': 'eventual',
};

export async function onRequest(context) {
  const { env, request } = context;

  // GET is overloaded here as "increment + read" — reject other verbs so
  // a misbehaving client can't drive KV writes via unexpected methods.
  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      headers: { Allow: 'GET' },
    });
  }

  if (!env || !env.VISITS) {
    return jsonResponse(
      { error: 'KV binding "VISITS" not configured' },
      503,
      { ...BASE },
    );
  }

  let raw;
  try {
    raw = await env.VISITS.get(COUNTER_KEY);
  } catch (err) {
    // KV read failed at runtime (transient backend / network / quota). Degrade
    // exactly like a missing binding: 503, not an uncaught 500.
    console.warn(`VISITS KV get failed: ${err && err.message ? err.message : err}`);
    return jsonResponse({ error: 'KV temporarily unavailable' }, 503, { ...BASE });
  }

  // KV may return null (unset), '' (empty), a value padded with incidental
  // whitespace (e.g. '50000\n'), or a genuinely non-numeric string if it was
  // corrupted by a different writer.
  //
  // Trim FIRST, then gate: trimming means a valid number with stray surrounding
  // whitespace is treated as that number, not reset to 1. Only content that is
  // still non-`/^\d+$/` after trimming is treated as corruption.
  //
  // The strict `/^\d+$/` gate (post-trim) still rejects:
  //   - '123abc'  → partial-numeric corruption
  //   - '-5'      → negative; counter cannot decrease
  //   - '3.7'     → decimal noise
  //   - '' / 'abc' → empty / non-numeric
  // null/undefined map to '0' (fresh counter). Anything else fires recovery.
  const normalized = (raw ?? '0').trim();
  const isClean = /^\d+$/.test(normalized);
  const recovered = !isClean;
  if (recovered) {
    console.warn(`VISITS counter corrupted, raw=${JSON.stringify(raw)} — resetting to 1`);
  }
  // BigInt math: exact regardless of magnitude. `1n` recovery value matches the
  // historical reset-to-1 behaviour.
  const next = recovered ? 1n : BigInt(normalized) + 1n;

  try {
    await env.VISITS.put(COUNTER_KEY, next.toString());
  } catch (err) {
    // KV write failed at runtime. Same degradation as a read failure: the
    // increment did not persist, so report 503 rather than a 500 or a
    // misleading 200 with an unpersisted count.
    console.warn(`VISITS KV put failed: ${err && err.message ? err.message : err}`);
    return jsonResponse({ error: 'KV temporarily unavailable' }, 503, { ...BASE });
  }

  // `next` is a BigInt; JSON.stringify cannot serialize BigInt and would throw.
  // The historical wire contract is a JSON *number* (`{ visits: 6 }`). Values up
  // to MAX_SAFE_INTEGER convert losslessly via Number(); only beyond that range
  // (≈9.0e15 views — unreachable for a demo, but correct to handle) do we emit a
  // decimal string so no precision is silently lost on the wire either.
  const visits =
    next <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(next) : next.toString();

  return jsonResponse({ visits }, 200, {
    ...BASE,
    ...(recovered ? { 'x-counter-recovered': 'true' } : {}),
  });
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...extraHeaders,
    },
  });
}
