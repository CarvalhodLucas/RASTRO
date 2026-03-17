import fetch from "node-fetch";
import fs from "fs";

async function test() {
    try {
        const knowledge = fs.readFileSync("./src/lib/knowledge.ts", "utf-8");
        const safeKnowledge = knowledge.substring(0, 15000);
        const payload = {
            ticker: "TSLA",
            report: "Tesla summary 3000 chars",
            systemInstruction: safeKnowledge,
            isRatingRequest: true
        };
        const res = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
