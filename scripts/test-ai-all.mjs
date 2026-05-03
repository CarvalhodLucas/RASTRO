import fs from 'fs';
import path from 'path';

// Helper to load env variables from .env.local
function loadEnv() {
    const envPath = path.resolve('.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

loadEnv();

async function testProvider(name, url, headers, body) {
    console.log(`\n--- Testing ${name} ---`);
    try {
        const start = Date.now();
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        });
        const duration = Date.now() - start;
        const status = res.status;
        const data = await res.json();
        
        if (res.ok) {
            console.log(`✅ ${name} Success (${duration}ms)`);
            console.log(`Response Snippet: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
            console.log(`❌ ${name} Failed (${status})`);
            console.log(`Error: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.log(`❌ ${name} Error: ${error.message}`);
    }
}

async function runTests() {
    // 1. Test OpenRouter Direct
    if (process.env.OPENROUTER_API_KEY) {
        await testProvider('OpenRouter (Direct)', 'https://openrouter.ai/api/v1/chat/completions', {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }, {
            model: 'nvidia/nemotron-3-super-120b-a12b:free',
            messages: [{ role: 'user', content: 'Say "OpenRouter OK"' }]
        });
    }

    // 2. Test Groq Direct
    if (process.env.GROQ_API_KEY) {
        await testProvider('Groq (Direct)', 'https://api.groq.com/openai/v1/chat/completions', {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        }, {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say "Groq OK"' }]
        });
    }

    // 3. Test Gemini Direct
    if (process.env.GOOGLE_API_KEY) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;
        await testProvider('Gemini (Direct)', geminiUrl, {}, {
            contents: [{ parts: [{ text: 'Say "Gemini OK"' }] }]
        });
    }

    // 4. Test Local API Routes (Requires server running)
    console.log('\n--- Testing Local Routes (Requires npm run dev) ---');
    
    await testProvider('Local /api/chat', 'http://localhost:3000/api/chat', {}, {
        ticker: 'AAPL',
        prompt: 'Say "Local Chat OK"',
        report: 'Test report'
    });

    await testProvider('Local /api/grok (Pulse)', 'http://localhost:3000/api/grok', {}, {
        ticker: 'AAPL',
        isPulse: true,
        report: 'Test report'
    });
}

runTests();
