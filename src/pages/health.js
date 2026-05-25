export function GET() {
  return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
