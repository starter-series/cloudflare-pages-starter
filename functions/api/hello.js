export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name') ?? 'World';
  return new Response(JSON.stringify({ greeting: `Hello, ${name}!` }), {
    headers: { 'content-type': 'application/json' },
  });
}
