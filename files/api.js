// Proxy: the browser never sees the Apps Script URL or the secret key.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: '{"error":"bad json"}' }; }
  if (!['sync', 'setAutoReport'].includes(body.fn)) return { statusCode: 400, body: '{"error":"bad function"}' };
  if (process.env.APP_PASSWORD && body.pw !== process.env.APP_PASSWORD)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '{"error":"unauthorized"}' };
  if (!process.env.APPS_SCRIPT_URL || !process.env.API_KEY)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '{"error":"Netlify env vars APPS_SCRIPT_URL / API_KEY missing"}' };
  try {
    const r = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: body.fn, args: body.args, key: process.env.API_KEY }),
      redirect: 'follow'
    });
    const text = await r.text();
    let out = text;
    try { JSON.parse(text); } catch (_) {
      out = JSON.stringify({ error: 'Apps Script returned non-JSON (HTTP ' + r.status + '): ' + (text.slice(0, 150) || 'empty') });
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: out };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
