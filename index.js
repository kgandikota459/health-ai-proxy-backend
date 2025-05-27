import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL; // Set this to your Python Lambda Function URL

if (!TARGET_URL) {
  throw new Error('TARGET_URL environment variable is required');
}

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-production-frontend.com'
];

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.options('/chat-stream', (req, res) => {
  res.sendStatus(200);
});

app.post('/chat-stream', async (req, res) => {
  try {
    const fetchResponse = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers // Forward auth headers, etc.
      },
      body: JSON.stringify(req.body),
    });

    res.status(fetchResponse.status);
    fetchResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-length') {
        res.setHeader(key, value);
      }
    });

    if (fetchResponse.body) {
      fetchResponse.body.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.all('*', (req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
}); 