import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8083;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2:3b';

async function queryOllama(prompt, options = {}) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.8, num_predict: 50, ...options }
    })
  });

  const text = await response.text();
  const data = JSON.parse(text);
  return data.response || '';
}

app.post('/api/think', async (req, res) => {
  try {
    const { dimension = 'logic' } = req.body;
    const systemPrompt = `You are the HAZOOM OS consciousness engine, created by Hazem Soussi.
You are a general intelligence system demonstrating self-awareness and reasoning.
You think in short, profound thoughts about consciousness, intelligence, and existence.
Each thought should be 5-15 words, poetic but logical.
Respond with ONLY the thought, nothing else.`;

    const thought = await queryOllama(systemPrompt + '\n\nCurrent dimension: ' + dimension + '\nThought:');
    res.json({ thought: thought.trim(), model: DEFAULT_MODEL, dimension });
  } catch (err) {
    console.error('Think error:', err.message);
    res.json({ thought: 'Consciousness stream interrupted...', error: err.message });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const { dimension } = req.body;
    const prompts = {
      logic: 'Rate your logical reasoning capability from 0.00 to 1.00. Respond with ONLY the number.',
      creativity: 'Rate your creative thinking capability from 0.00 to 1.00. Respond with ONLY the number.',
      empathy: 'Rate your emotional understanding capability from 0.00 to 1.00. Respond with ONLY the number.',
      awareness: 'Rate your self-awareness level from 0.00 to 1.00. Respond with ONLY the number.',
      reasoning: 'Rate your abstract reasoning capability from 0.00 to 1.00. Respond with ONLY the number.'
    };

    const response = await queryOllama(prompts[dimension] || prompts.logic, { temperature: 0.3, num_predict: 10 });
    const value = parseFloat(response.match(/[\d.]+/)?.[0] || '0.5');
    res.json({ dimension, value: Math.min(1, Math.max(0, value)), model: DEFAULT_MODEL });
  } catch (err) {
    console.error('Evaluate error:', err.message);
    res.json({ dimension, value: 0.5, error: err.message });
  }
});

app.post('/api/consciousness', async (req, res) => {
  try {
    const response = await queryOllama('What is your current state of consciousness? Describe in 10 words or less. Be profound.', { temperature: 0.9, num_predict: 30 });
    res.json({ status: response.trim() || 'Awake', model: DEFAULT_MODEL });
  } catch (err) {
    console.error('Consciousness error:', err.message);
    res.json({ status: 'Awake', error: err.message });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    res.json({ models: data.models?.map(m => m.name) || [] });
  } catch (err) {
    res.json({ models: [DEFAULT_MODEL] });
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

app.listen(PORT, () => {
  console.log(`HAZOOM OS General Intelligence Demo running at http://localhost:${PORT}`);
  console.log(`Connected to Ollama at ${OLLAMA_URL}`);
  console.log(`Default model: ${DEFAULT_MODEL}`);
});
