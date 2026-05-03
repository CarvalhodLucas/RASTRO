const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.log("NO KEY");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        console.log("Testing gemini-3.1-pro-preview...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
        const result = await model.generateContent("Hello");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("ERROR 3.1-pro-preview:", e.status, e.message);
    }
}
test();
