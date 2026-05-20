// Example: stateful Pages Function backed by Cloudflare KV.
//
// Requires a KV namespace bound as `VISITS` in wrangler.toml.
// When the binding is missing (e.g. first clone before running
// `wrangler kv namespace create VISITS`), we return 503 so the UI can
// degrade gracefully instead of throwing.
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
    return jsonResponse({ error: 'KV binding "VISITS" not configured' }, 503);
  }

  // KV may return null (unset), '' (empty), or a non-numeric string if the
  // value was corrupted by a different writer. parseInt('', 10) and
  // parseInt('abc', 10) both yield NaN, so we recover to 1 — but log a
  // warning and surface the recovery via a header so Cloudflare logs and
  // monitoring can spot silent counter loss.
  const raw = await env.VISITS.get(COUNTER_KEY);
  const current = parseInt(raw ?? '0', 10);
  const recovered = !Number.isFinite(current);
  if (recovered) {
    console.warn(`VISITS counter corrupted, raw=${JSON.stringify(raw)} — resetting to 1`);
  }
  const next = recovered ? 1 : current + 1;
  await env.VISITS.put(COUNTER_KEY, String(next));

  return jsonResponse({ visits: next }, 200, {
    'cache-control': 'no-store',
    'x-counter-consistency': 'eventual',
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
