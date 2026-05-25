const express = require('express');
const cors = require('cors');

const app = express();

// Handle OPTIONS preflight for ALL routes
app.options('*', cors());

// Main CORS setup
app.use(cors({ 
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));

// API Keys from environment variables
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
    res.json({ message: 'TYNEX AI Backend Active', version: '7.0' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = { 
        role: 'system', 
        content: 'You are TYNEX AI, a helpful, creative, and accurate AI assistant.' 
    };

    for (const provider of API_PROVIDERS) {
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
                    messages: [systemPrompt, ...history, { role: 'user', content: message }],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                console.log(`${provider.name}: HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;

            if (reply) {
                return res.json({ 
                    response: reply, 
                    provider: provider.name,
                    model: provider.model 
                });
            }
        } catch (err) {
            console.log(`${provider.name} failed: ${err.message}`);
        }
    }

    res.status(503).json({ error: 'All AI providers unavailable. Please try again later.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 TYNEX AI Backend running on port ${PORT}`));

