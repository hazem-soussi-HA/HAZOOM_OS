require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path for persisting API keys
const keysFile = path.join(__dirname, 'data', 'keys.json');
const apiKeys = new Set();
if (fs.existsSync(keysFile)) {
  try {
    const stored = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
    stored.forEach(k => apiKeys.add(k));
  } catch (e) {
    console.warn('Could not parse keys file, starting fresh');
  }
}
function saveKeys() {
  fs.writeFileSync(keysFile, JSON.stringify(Array.from(apiKeys), null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Generate a new API key
app.post('/api/generate-key', (req, res) => {
  const newKey = uuidv4();
  apiKeys.add(newKey);
  saveKeys();
  res.json({ apiKey: newKey });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !apiKeys.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const selfHostedUrl = process.env.SELF_HOSTED_API_URL || '';
  if (!selfHostedUrl) {
    const lastUser = messages.filter(m => m.role === 'user').pop();
    const reply = lastUser ? `You said: ${lastUser.content}` : 'Hello!';
    return res.json({ reply });
  }

  try {
    const response = await fetch(selfHostedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'phi3:mini', messages, stream: false }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Self‑hosted API error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || data.message?.content || data.reply || '';
    res.json({ reply });
  } catch (err) {
    console.error('Chat forwarding error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ChatDev server running at http://localhost:${PORT}`);
});
