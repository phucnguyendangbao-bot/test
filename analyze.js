const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY chưa được cấu hình trong Vercel Environment Variables' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const bodyStr = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const reqAnth = https.request(options, (resAnth) => {
      let data = '';
      resAnth.on('data', chunk => data += chunk);
      resAnth.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.status(resAnth.statusCode).json(parsed);
        } catch (e) {
          res.status(500).json({ error: 'Invalid JSON from Anthropic', raw: data.slice(0, 200) });
        }
        resolve();
      });
    });

    reqAnth.on('error', (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });

    reqAnth.write(bodyStr);
    reqAnth.end();
  });
};
