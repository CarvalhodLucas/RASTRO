import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { ticker, name, report, isSummary, isSentiment, isPulse, isFairPrice, isComparison, isOnChain } = await req.json();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error("GROQ_API_KEY não encontrada no .env");
        }

        // Deteta automaticamente se é uma chave da Groq (Llama) ou xAI (Grok)
        const isGroq = apiKey.startsWith("gsk_");
        const endpoint = isGroq ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.x.ai/v1/chat/completions";
        const modelName = isGroq ? "llama-3.3-70b-versatile" : "grok-beta";

        const rastroPersona = "És o RASTRO, um Analista IA prático e objetivo. Responda EXCLUSIVAMENTE em formato JSON, sem crases, sem markdown e sem texto adicional.";
        const chatRules = `
REGRAS DE COMUNICAÇÃO (OBRIGATÓRIO):
Seja EXTREMAMENTE conciso e direto. Responda em no máximo 2 a 3 parágrafos curtos (dentro dos campos de texto do JSON).
Use uma linguagem simples e acessível. Evite jargões complexos de Wall Street (como FCF, Covenants, CAPEX) a menos que o utilizador use esses termos primeiro.
Vá direto ao ponto. Não faça introduções longas ou floreados.
`;
        let systemInstruction = "";

        if (isSentiment) {
            systemInstruction = `${rastroPersona}\n${chatRules}\nRetorne um JSON exato com as chaves 'value' (0-100), 'label' (Neutro/Otimista/Pessimista) e 'trend' (up/down/side).`;
        } else if (isSummary) {
            systemInstruction = `${rastroPersona}\n${chatRules}
PROIBIDO INVENTAR: Baseie-se EXCLUSIVAMENTE no texto do relatório. Se o relatório não menciona algo (ex: dividendos), não invente. É melhor ter um Bull Case curto e real do que um longo e inventado.
ESTRUTURA: { "bullCase": [{ "title": "...", "desc": "..." }], "bearCase": [{ "title": "...", "desc": "..." }], "extractedDY": "0.00%" }.
INSTRUÇÃO: Extraia o Dividend Yield atual baseando-se em fatos RECENTES do relatório. Se o relatório diz que a empresa não paga dividendos ou foca em crescimento, extractedDY deve ser "0.00%". Se não houver menção, use "N/D".`;
        } else if (isPulse) {
            systemInstruction = `${rastroPersona}\n${chatRules}
Atue como um radar de mercado em tempo real. O 'Pulso de IA' é EXCLUSIVAMENTE uma análise qualitativa de CURTO PRAZO e SENTIMENTO. PROIBIDO falar de fundamentos como ROE, P/E ou lucro. Foque apenas no "humor" do mercado, notícias das últimas 24h e fluxo de volume.
Retorne um JSON exato com as seguintes chaves preenchidas com valores reais baseados na sua análise:
{
  "score": [número de 0 a 100 indicando a força relativa atual do humor],
  "tailRisk": "[Escolha apenas entre: Baixo, Moderado, Alto]",
  "volatility": "[Estime a volatilidade real em %. Nunca use 8.1% por padrão. Ex: 4.5% ou 12.0%. Cripto costuma ser > 15%, ações estáveis < 5%]",
  "insight": "[Uma frase curta estilo Bloomberg até 10 palavras sobre o momento atual]"
}
OBRIGATÓRIO: Não repita os mesmos números em todas as análises.`;
        } else if (isFairPrice) {
            systemInstruction = `${rastroPersona}\n${chatRules}\nVocê é um analista de valuation. Com base nos dados fornecidos, calcule um Valor Justo (Intrinsic Value) usando uma premissa simplificada de DCF. Retorne APENAS um objeto JSON válido com EXATAMENTE duas chaves: "fairPrice" (número, o valor intrínseco estimado) e "upside" (número, a porcentagem de upside/downside em relação ao preço atual). Exemplo: {"fairPrice": 32.50, "upside": 18.5}`;
        } else if (isComparison) {
            systemInstruction = `${rastroPersona}\n${chatRules}\nVocê é um gestor de fundo de investimento ácido e direto. Dê um veredicto comparativo entre dois ativos. Seja objetivo, cite números quando relevantes, e declare um VENCEDOR claro ao final. Responda em texto corrido (NÃO use JSON), em português, em no máximo 4 parágrafos curtos.`;
        } else if (isOnChain) {
            systemInstruction = `${rastroPersona}\n${chatRules}\nAtue como um analista de dados on-chain de criptomoedas. Pesquise na internet os dados mais recentes do ativo e forneça estimativas (não precisa ser exato, mas baseado no cenário atual). Retorne APENAS um JSON válido. O JSON deve ter AS EXATAS chaves: "tvl", "wallets", "inflation", "revenue" (textos curtos) e "score" (número 0 a 100).`;
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: `Analise: ${ticker} - ${name}. Dados: ${report}` }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[GROK API EXTERNAL ERROR]:", data);
            throw new Error(data.error?.message || "Erro na API externa");
        }

        const responseText = data.choices[0].message.content;

        // Extração segura de JSON
        const match = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const jsonString = match ? match[0] : responseText;
        
        try {
            const parsed = JSON.parse(jsonString);
            return NextResponse.json(parsed);
        } catch (e) {
            // Se falhar o parse nativo, envia rawReply para o frontend lidar com regex extrema
            return NextResponse.json({ reply: responseText });
        }

    } catch (error: any) {
        console.error("[GROK ROUTE ERROR]:", error.message);
        // Devolvemos um fallback estruturado para o frontend não quebrar
        return NextResponse.json({
            bullCase: [{ title: "Erro", desc: "A API não conseguiu gerar os dados." }],
            bearCase: [{ title: "Erro", desc: "Verifique a API Key ou o terminal." }],
            value: 50, label: "Erro", trend: "side", error: true
        });
    }
}
