// Vercel serverless proxy: forwards POST /api/generate-caption to configured BACKEND_URL
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const backend = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backend) {
    return res.status(500).json({ success: false, error: 'BACKEND_URL is not configured on the server' });
  }

  try {
    const upstream = `${String(backend).replace(/\/$/, '')}/generate-caption`;

    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      // keep credentials off; this proxies from server-side
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    const text = await response.text();
    // Upstream returned non-JSON (likely HTML). Return a structured error so the frontend won't attempt to parse HTML as JSON.
    return res.status(502).json({ success: false, error: `Upstream returned non-JSON: ${text.substring(0, 300)}` });
  } catch (err) {
    console.error('Proxy error to backend:', err);
    return res.status(502).json({ success: false, error: String(err) });
  }
}
