import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, ticker, assetName, isPulse, isHealth, isRatingRequest, isSentiment, isComparison, isOnChain, isSummary, isFairPrice, prompt, report, variation } = body;

        // Try to find a key. Prefer XAI, then GROQ.
        const xaiKey = process.env.XAI_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;
        
        const apiKey = xaiKey || groqKey;
        if (!apiKey) {
            return NextResponse.json({ error: "No AI API key (XAI or GROQ) configured in .env.local" }, { status: 500 });
        }

        const isXAI = !!xaiKey;
        const API_URL = isXAI ? "https://api.x.ai/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";
        const model = isXAI ? "grok-beta" : "llama-3.3-70b-versatile";

        let systemInstruction = `Você é um analista sênior da RASTRO, uma plataforma premium de inteligência de mercado com estética Bloomberg/Terminal.
        Seu tom é extremamente profissional, direto, técnico e imparcial. 
        Evite frases genéricas. Vá direto aos dados. 
        Use português do Brasil.`;

        if (isPulse) {
            systemInstruction += `\nTAREFA: PULSO DE IA. Forneça um diagnóstico de CURTÍSSIMO PRAZO (Day Trade/Swing Trade) para ${ticker} (${assetName}).
            Considere a variação atual de ${variation || '0'}%. 
            Retorne EXCLUSIVAMENTE um JSON com:
            - "score": número de 0 a 100 de força relativa.
            - "insight": uma frase técnica de até 15 palavras sobre o momento.
            - "tailRisk": "Baixo", "Médio" ou "Alto".
            - "volatility": "Baixa", "Moderada" ou "Alta".`;
        } else if (isSentiment) {
            systemInstruction += `\nTAREFA: ANALISTA DE SENTIMENTO. Você receberá o Fear & Greed Index global (0-100). Seu papel é ajustar esse valor ligeiramente para o ativo específico solicitado, baseado na variação e contexto. 
            O valor de sentiment (value) deve ser estritamente um número entre 0 e 100, onde 0 é pânico total e 100 é euforia.
            Retorne RIGOROSAMENTE APENAS um JSON no formato: { "value": <numero_de_0_a_100> }.`;
        } else if (isSummary) {
            systemInstruction += `\nTAREFA: RESUMO EXECUTIVO. Analise o relatório qualitativo e forneça 3 pontos positivos (bullCase) e 3 pontos negativos (bearCase) para ${ticker} (${assetName}).
            Retorne EXCLUSIVAMENTE um JSON com:
            - "bullCase": array de 3 objetos com { "title": "título curto", "desc": "descrição curta" }.
            - "bearCase": array de 3 objetos com { "title": "título curto", "desc": "descrição curta" }.`;
        } else if (isHealth || isRatingRequest) {
            systemInstruction += `\nTAREFA: SAÚDE E RATING. Retorne EXCLUSIVAMENTE um JSON com:
            - "score": nota de 0 a 100 (onde 100 é excelente e 0 é péssimo).
            - "verdict": "Compra", "Venda", "Neutro" ou "Alerta".
            - "summary": tese de investimento resumida.
            - "pillars": array de 4-5 objetos com { "label": "...", "score": 9.5, "status": "pos", "neg" ou "neu", "desc": "..." }.
            - "fiiMetrics": objeto contendo OBRIGATORIAMENTE (se for FII) { "pvp", "vacancia", "dy", "patrimonio" } encontrados no texto. Use "N/D" se não achar.
            - "etfMetrics": objeto contendo OBRIGATORIAMENTE (se for ETF) { "taxa", "benchmark", "patrimonio", "liquidez" } encontrados no texto. Use "N/D" se não achar.`;
        } else if (isOnChain) {
            systemInstruction += `\nTAREFA: MÉTRICAS ON-CHAIN. Retorne EXCLUSIVAMENTE um JSON com: "tvl", "wallets", "inflation", "revenue", "s2f" e "score".`;
        } else if (isFairPrice) {
            systemInstruction += `\nTAREFA: VALOR JUSTO (VALUATION). Retorne EXCLUSIVAMENTE um JSON com:
            - "fairPrice": número representando o preço alvo / intrínseco.
            - "upside": número representando o potencial de valorização em porcentagem.`;
        }

        if (isPulse || isHealth || isRatingRequest || isSentiment || isComparison || isOnChain || isSummary || isFairPrice) {
            systemInstruction += `\nResponda EXCLUSIVAMENTE em formato JSON puro, sem markdown.`;
        }

        const payload = {
            model,
            messages: [
                { role: "system", content: systemInstruction },
                ...(messages || (prompt || report ? [{ role: "user", content: prompt || report }] : []))
            ],
            temperature: 0.2,
        };

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json({ error: `API Error: ${res.status}`, details: errorData }, { status: res.status });
        }

        const data = await res.json();
        const reply = data.choices[0].message.content;

        // ROBUST JSON EXTRACTION (SELF-HEALING)
        const trimmedReply = reply.trim();
        const jsonMatch = trimmedReply.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            try {
                const jsonContent = jsonMatch[0]
                    .replace(/```json/gi, '')
                    .replace(/```/g, '')
                    .trim();
                
                return NextResponse.json(JSON.parse(jsonContent));
            } catch (e) {
                console.warn(`[API] Erro ao parsear JSON extraído para ${ticker}:`, e);
                // Fallback: Retorna como reply para que o frontend tente o parse próprio
                return NextResponse.json({ reply, text: reply });
            }
        }

        return NextResponse.json({ reply, text: reply });

    } catch (error: any) {
        console.error("Grok Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
