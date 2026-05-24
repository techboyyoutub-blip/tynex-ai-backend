const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const API_PROVIDERS = [
    {
        name: 'Google Gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        model: 'gemini-2.0-flash',
        key: 'AIzaSyBq4xp6VgiA23f5Oh9RMpyMoLqdZJKwSK0'
    },
    {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.2-3b-preview',
        key: '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'
    },
    {
        name: 'Cerebras',
        url: 'https://api.cerebras.ai/v1/chat/completions',
        model: 'llama-3.3-8b',
        key: 'csk-thy85wjcevdjtp3x3pv63225v64pe2v2ykhxvd58myknmtnj'
    },
    {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.5-flash-preview:free',
        key: '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'
    },
    {
        name: 'SambaNova',
        url: 'https://api.sambanova.ai/v1/chat/completions',
        model: 'Meta-Llama-3.2-3B-Instruct',
        key: '6130c44f-d3f2-4dbd-b966-f1f6b100dfb6'
    },
    {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        model: 'mistral-tiny',
        key: 'vcsjOX0iklAa2X6BzwjM3znlD1ZC9Zie'
    },
    {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
        key: 'sk-497fa2351ca94994bf8bcd22b7cf21e5'
    }
];

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.json({ message: 'TYNEX AI Backend Active' }));

app.post('/chat', async (req, res) => {
    const { message, history } = req.body;
    
    for (const provider of API_PROVIDERS) {
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

            if (!response.ok) continue;
            
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
