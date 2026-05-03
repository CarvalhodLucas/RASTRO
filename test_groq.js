async function test() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.log("NO GROQ KEY");
        return;
    }
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{role: "user", content: "Hello"}]
            })
        });
        console.log("GROQ STATUS:", res.status);
        const data = await res.json();
        console.log("GROQ RESPONSE:", data);
    } catch (e) {
        console.error("GROQ ERROR:", e);
    }
}
test();
