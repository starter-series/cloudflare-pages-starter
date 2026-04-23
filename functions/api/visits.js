// Example: stateful Pages Function backed by Cloudflare KV.
//
// Requires a KV namespace bound as `VISITS` in wrangler.toml.
// When the binding is missing (e.g. first clone before running
// `wrangler kv namespace create VISITS`), we return 503 so the UI can
// degrade gracefully instead of throwing.
export async function onRequest(context) {
  const { env } = context;

  if (!env || !env.VISITS) {
    return new Response(
      JSON.stringify({ error: 'KV binding "VISITS" not configured' }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  const current = parseInt(await env.VISITS.get('count'), 10) || 0;
  const next = current + 1;
  await env.VISITS.put('count', String(next));

  return new Response(JSON.stringify({ visits: next }), {
    headers: { 'content-type': 'application/json' },
  });
}
