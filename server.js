const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Your API keys (hidden from frontend)
const API_KEYS = {
  gemini: 'AIzaSyBq4xp6VgiA23f5Oh9RMpyMoLqdZJKwSK0',
  groq: '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',
  cerebras: 'csk-thy85wjcevdjtp3x3pv63225v64pe2v2ykhxvd58myknmtnj',
  openrouter: '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',
  sambanova: '6130c44f-d3f2-4dbd-b966-f1f6b100dfb6',
  mistral: 'vcsjOX0iklAa2X6BzwjM3znlD1ZC9Zie',
  deepseek: 'sk-497fa2351ca94994bf8bcd22b7cf21e5'
};

// API configurations
const APIS = [
  {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    key: API_KEYS.gemini
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.2-3b-preview',
    key: API_KEYS.groq
  },
  {
    name: 'Cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-8b',
    key: API_KEYS.cerebras
  },
  {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemini-2.5-flash-preview:free',
    key: API_KEYS.openrouter
  },
  {
    name: 'SambaNova',
    url: 'https://api.sambanova.ai/v1/chat/completions',
    model: 'Meta-Llama-3.2-3B-Instruct',
    key: API_KEYS.sambanova
  },
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-tiny',
    key: API_KEYS.mistral
  },
  {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    key: API_KEYS.deepseek
  }
];

// Try each API until one works
app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  for (const api of APIS) {
    try {
      const response = await fetch(api.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.key}`,
          'HTTP-Referer': 'https://tynex-ai.vercel.app',
          'X-Title': 'TYNEX AI'
        },
        body: JSON.stringify({
          model: api.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.log(`${api.name} failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return res.json({
          success: true,
          reply: data.choices[0].message.content,
          provider: api.name
        });
      }
    } catch (error) {
      console.log(`${api.name} error:`, error.message);
      continue;
    }
  }

  res.status(503).json({
    success: false,
    error: 'All APIs exhausted. Please try again later.'
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'TYNEX AI Backend Running', apis: APIS.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TYNEX AI backend running on port ${PORT}`);
});
