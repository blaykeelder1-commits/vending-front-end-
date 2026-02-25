export default async function handler(req, res) {
  const backendUrl = process.env.REACT_APP_API_URL || 'https://vending-backend-nk0m.onrender.com/api';
  const healthUrl = backendUrl.replace(/\/api$/, '') + '/api/health';

  try {
    const start = Date.now();
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(55000),
      headers: { 'Origin': 'https://my-react-app-brown-three.vercel.app' },
    });
    const elapsed = Date.now() - start;
    res.status(200).json({
      status: 'ok',
      backend: response.status,
      latency: `${elapsed}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(200).json({
      status: 'ping_sent',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
