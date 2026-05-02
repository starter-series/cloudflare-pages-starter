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
  const { env } = context;

  if (!env || !env.VISITS) {
    return jsonResponse({ error: 'KV binding "VISITS" not configured' }, 503);
  }

  const current = parseInt((await env.VISITS.get(COUNTER_KEY)) ?? '0', 10);
  const next = Number.isFinite(current) ? current + 1 : 1;
  await env.VISITS.put(COUNTER_KEY, String(next));

  return jsonResponse({ visits: next }, 200, {
    'cache-control': 'no-store',
    'x-counter-consistency': 'eventual',
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
