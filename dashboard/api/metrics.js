function parseDays(value) {
  const days = Number(value || 30);
  if (!Number.isFinite(days)) return 30;
  return Math.max(1, Math.min(180, Math.floor(days)));
}

function formatError(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const parts = [
      error.message,
      error.code ? `code: ${error.code}` : null,
      error.details ? `details: ${error.details}` : null,
      error.hint ? `hint: ${error.hint}` : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(' | ');
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('allow', 'GET');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.DASHBOARD_API_TOKEN;
  const endpoint = process.env.DASHBOARD_API_URL;
  if (!token) {
    return response.status(500).json({ ok: false, error: 'DASHBOARD_API_TOKEN is not configured' });
  }
  if (!endpoint) {
    return response.status(500).json({ ok: false, error: 'DASHBOARD_API_URL is not configured' });
  }

  const days = parseDays(request.query.days);
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return response.status(500).json({ ok: false, error: 'DASHBOARD_API_URL is invalid' });
  }
  url.searchParams.set('days', String(days));

  try {
    const upstream = await fetch(url, {
      headers: {
        'x-deskcat-dashboard-token': token,
      },
    });
    const contentType = upstream.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await upstream.json()
      : { ok: false, error: await upstream.text() };
    response.setHeader('cache-control', 'no-store');
    if (payload && typeof payload === 'object' && payload.error) {
      payload.error = formatError(payload.error);
    }
    return response.status(upstream.status).json(payload);
  } catch (error) {
    const message = formatError(error);
    return response.status(502).json({ ok: false, error: message });
  }
}
