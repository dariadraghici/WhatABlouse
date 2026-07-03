// server.js
// Tiny backend that holds the remove.bg API key and proxies requests to it.
// The browser NEVER sees this key — it only ever talks to our own /api/remove-bg route.

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer(); // keeps uploaded file in memory, doesn't write to disk

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

if (!REMOVE_BG_API_KEY) {
  console.error('ERROR: REMOVE_BG_API_KEY is not set. Create a .env file (see .env.example).');
  process.exit(1);
}

// Serve your existing frontend (index.html and friends) as static files
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image_file provided.' });
    }

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append(
      'image_file',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname
    );

    const rbgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY, // stays on the server, never sent to the browser
      },
      body: formData,
    });

    if (!rbgResponse.ok) {
      const errText = await rbgResponse.text();
      console.error('remove.bg error:', rbgResponse.status, errText);
      return res.status(rbgResponse.status).json({ error: 'remove.bg request failed.' });
    }

    const arrayBuffer = await rbgResponse.arrayBuffer();
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`What A Blouse server running at http://localhost:${PORT}`);
});
