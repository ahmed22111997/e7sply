// Proxy: the browser never sees the Apps Script URL or the secret key.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: '{"error":"bad json"}' }; }
  if (!['sync', 'setAutoReport'].includes(body.fn)) return { statusCode: 400, body: '{"error":"bad function"}' };
  if (process.env.APP_PASSWORD && body.pw !== process.env.APP_PASSWORD)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '{"error":"unauthorized"}' };
  try {
    const r = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: body.fn, args: body.args, key: process.env.API_KEY }),
      redirect: 'follow'
    });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: await r.text() };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
