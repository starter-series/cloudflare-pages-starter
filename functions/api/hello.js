// Example: stateless Pages Function.
//
// Validates the `name` query param to bound the response size and reject
// obviously hostile input before reflecting it. The actual response body
// is JSON-encoded so injection-via-reflection is moot, but the size cap
// matters for cache behavior and abuse mitigation.

const NAME_PATTERN = /^[\p{L}\p{N} _.\-]{1,40}$/u;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const raw = url.searchParams.get('name');

  let name = 'World';
  if (raw !== null) {
    if (!NAME_PATTERN.test(raw)) {
      return new Response(
        JSON.stringify({ error: 'name must be 1–40 letters, digits, spaces, _, ., -' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }
    name = raw;
  }

  return new Response(JSON.stringify({ greeting: `Hello, ${name}!` }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
