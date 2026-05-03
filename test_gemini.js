const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.log("NO KEY");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        console.log("Testing gemini-3.1-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro" });
        const result = await model.generateContent("Hello");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("ERROR 3.1-pro:", e.status, e.message);
    }

    try {
        console.log("Testing gemini-1.5-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result2 = await model2.generateContent("Hello");
        console.log("SUCCESS 1.5-pro:", result2.response.text());
    } catch (e) {
        console.error("ERROR 1.5-pro:", e.status, e.message);
    }
}
test();
