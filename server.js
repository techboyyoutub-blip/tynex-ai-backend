const express = require('express');
const cors = require('cors');

const app = express();

// CRITICAL: Handle OPTIONS preflight for ALL routes BEFORE other middleware
app.options('*', cors());

// Main CORS setup
app.use(cors({ 
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));

// ... rest of your code (health, chat endpoints, etc.)

