const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = env.match(/GOOGLE_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function test() {
    if (!apiKey) {
        console.error("No API key found");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-1.5-flash"];
    
    for (const model of models) {
        try {
            console.log(`Testing model: ${model}`);
            const geminiModel = genAI.getGenerativeModel({ model: model });
            const result = await geminiModel.generateContent("Hello");
            console.log(`Result for ${model}: success`);
        } catch (e) {
            console.error(`Error for ${model}: ${e.message}`);
        }
    }
}

test();
