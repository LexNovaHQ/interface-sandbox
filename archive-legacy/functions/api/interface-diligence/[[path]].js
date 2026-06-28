export function onRequest() {
  return new Response(JSON.stringify({ ok: false, error: 'ARCHIVED_NON_LIVE_PROXY' }), {
    status: 410,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
