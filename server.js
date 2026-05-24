const express = require('express');
const cors = require('cors');

const app = express();

// Middleware (ORDER MATTERS — must come BEFORE routes)
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Keys from environment variables (secure — not hardcoded)
// Set these in your Render dashboard: Dashboard → Environment → Add Environment Variable
const API_PROVIDERS = [
    {
        name: 'Google Gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        model: 'gemini-2.0-flash',
        key: process.env.GEMINI_KEY || ''
    },
    {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.2-3b-preview',
        key: process.env.GROQ_KEY || ''
    },
    {
        name: 'Cerebras',
        url: 'https://api.cerebras.ai/v1/chat/completions',
        model: 'llama-3.3-8b',
        key: process.env.CEREBRAS_KEY || ''
    },
    {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.5-flash-preview:free',
        key: process.env.OPENROUTER_KEY || ''
    },
    {
        name: 'SambaNova',
        url: 'https://api.sambanova.ai/v1/chat/completions',
        model: 'Meta-Llama-3.2-3B-Instruct',
        key: process.env.SAMBANOVA_KEY || ''
    },
    {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-tiny',
        key: process.env.MISTRAL_KEY || ''
    },
    {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
        key: process.env.DEEPSEEK_KEY || ''
    }
];

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'TYNEX AI Backend Active' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    for (const provider of API_PROVIDERS) {
        // Skip providers with no API key
        if (!provider.key) {
            console.log(`Skipping ${provider.name}: No API key configured`);
            continue;
        }

        try {
            const response = await fetch(provider.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.key}`
                },
                body: JSON.stringify({
                    model: provider.model,
                    messages: [
                        { role: 'system', content: 'You are TYNEX AI, a helpful assistant.' },
                        ...(history || []),
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                console.log(`${provider.name} returned ${response.status}`);
                continue;
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;

            if (reply) {
                return res.json({ response: reply, provider: provider.name });
            }
        } catch (e) {
            console.log(`${provider.name} failed:`, e.message);
        }
    }

    res.status(503).json({ error: 'All AI providers failed' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
