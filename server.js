require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10mb" }));

// ======================
// AI PROVIDERS
// ======================

const PROVIDERS = [
    {
        name: "Gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemini-2.0-flash",
        key: process.env.GEMINI_KEY
    },
    {
        name: "Groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile",
        key: process.env.GROQ_KEY
    },
    {
        name: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemini-2.5-flash-preview",
        key: process.env.OPENROUTER_KEY
    },
    {
        name: "DeepSeek",
        url: "https://api.deepseek.com/chat/completions",
        model: "deepseek-chat",
        key: process.env.DEEPSEEK_KEY
    }
];

// ======================
// HEALTH CHECK
// ======================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        name: "TYNEX AI",
        version: "8.0"
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ======================
// DEBUG
// ======================

app.get("/debug", (req, res) => {
    res.json({
        GEMINI_KEY: !!process.env.GEMINI_KEY,
        GROQ_KEY: !!process.env.GROQ_KEY,
        OPENROUTER_KEY: !!process.env.OPENROUTER_KEY,
        DEEPSEEK_KEY: !!process.env.DEEPSEEK_KEY
    });
});

// ======================
// CHAT ENDPOINT
// ======================

app.post("/chat", async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const cleanHistory = history
            .filter(m => m.role && m.content)
            .map(m => ({
                role: m.role,
                content: m.content
            }));

        const messages = [
            {
                role: "system",
                content:
                    "You are TYNEX AI, a powerful, intelligent and helpful AI assistant."
            },
            ...cleanHistory,
            {
                role: "user",
                content: message
            }
        ];

        for (const provider of PROVIDERS) {

            if (!provider.key) {
                console.log(`${provider.name}: No API key`);
                continue;
            }

            try {

                console.log(`Trying ${provider.name}`);

                const controller = new AbortController();

                const timeout = setTimeout(() => {
                    controller.abort();
                }, 30000);

                const response = await fetch(provider.url, {
                    method: "POST",
                    signal: controller.signal,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${provider.key}`
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages,
                        temperature: 0.7,
                        max_tokens: 2048
                    })
                });

                clearTimeout(timeout);

                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.log(
                        `${provider.name} failed:`,
                        response.status,
                        errorText
                    );

                    continue;
                }

                const data = await response.json();

                const reply =
                    data?.choices?.[0]?.message?.content;

                if (reply) {

                    console.log(
                        `Success via ${provider.name}`
                    );

                    return res.json({
                        response: reply,
                        provider: provider.name,
                        model: provider.model
                    });
                }

            } catch (err) {

                console.log(
                    `${provider.name} error:`,
                    err.message
                );
            }
        }

        return res.status(503).json({
            error:
                "All AI providers unavailable"
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 TYNEX AI running on port ${PORT}`);
    console.log("Keys loaded:");
    console.log({
        GEMINI: !!process.env.GEMINI_KEY,
        GROQ: !!process.env.GROQ_KEY,
        OPENROUTER: !!process.env.OPENROUTER_KEY,
        DEEPSEEK: !!process.env.DEEPSEEK_KEY
    });
});
