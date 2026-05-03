const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.log("NO KEY");
        return;
    }
    
    // Direct fetch to list models since the SDK doesn't expose it cleanly in older versions
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log("Available models:");
    data.models.forEach(m => console.log(m.name));
}
test();
