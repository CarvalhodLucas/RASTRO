import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { ticker, name, report, indicators, systemInstruction: instructionOverride, systemPrompt, isSummary, isHealth, isSentiment, isRatingRequest, prompt } = await req.json();

        console.log(`[RASTRO IA] Iniciando análise OpenRouter para: ${ticker || name}`);

        const rastroPersona = "És o RASTRO, um Analista IA prático e objetivo. Sê extremamente conciso, direto e usa linguagem simples. Evita jargões técnicos a menos que o utilizador os use primeiro.";

        let systemInstruction = "";

        if (isHealth) {
            systemInstruction = `${rastroPersona}
            Analise a saúde fundamental de ${name || ticker} (${ticker}).
            
            NÃO USE MARKDOWN. NÃO ESCREVA \`\`\`json. RETORNE APENAS O TEXTO DO JSON PURO E NADA MAIS.
            
            RETORNE EXCLUSIVAMENTE ESTE JSON:
            {
              "score": 0, "status": "", "roe": 0, "pvp": 0, "dy": 0, "pl": 0,
              "dcf": 0, "dcfUpside": 0,
              "graham": 0, "grahamUpside": 0,
              "bazin": 0, "bazinUpside": 0
            }
            Relatório: ${report}`;
        }
        else if (isSentiment) {
            systemInstruction = `${rastroPersona}
            Analise o sentimento de mercado para ${name || ticker} (${ticker}).
            NÃO USE MARKDOWN. NÃO ESCREVA \`\`\`json. RETORNE APENAS O TEXTO DO JSON PURO E NADA MAIS.
            Retorne APENAS um JSON:
            { "value": 0, "label": "Neutro", "trend": "side" }
            Dados: ${report}`;
        }
        else if (isSummary) {
            systemInstruction = `${rastroPersona}
            Gere Bull Case e Bear Case para ${ticker}.
            NÃO USE MARKDOWN. NÃO ESCREVA \`\`\`json. RETORNE APENAS O TEXTO DO JSON PURO E NADA MAIS.
            Retorne JSON: { "bullCase": [], "bearCase": [] }
            Relatório: ${report}`;
        }
        else if (isRatingRequest) {
            // Lógica de Pilares (FII/ETF/AÇÕES)
            const isFII = (ticker?.endsWith('11') || ticker?.endsWith('11.SA')) && !indicators?.isETF;
            const isETF = indicators?.isETF || (ticker?.endsWith('11') || ticker?.endsWith('11.SA')) && indicators?.sector === 'ETF';

            const pillars = isETF
                ? `[{"label": "Replicação", "score": 0}, {"label": "Taxa Adm", "score": 0}, {"label": "Liquidez", "score": 0}, {"label": "Índice", "score": 0}]`
                : (isFII
                    ? `[{"label": "Qualidade", "score": 0}, {"label": "Vacância", "score": 0}, {"label": "DY", "score": 0}, {"label": "Risco", "score": 0}]`
                    : `[{"label": "Saúde", "score": 0}, {"label": "Fosso", "score": 0}, {"label": "Catalisadores", "score": 0}, {"label": "Riscos", "score": 0}]`);

            systemInstruction = `${rastroPersona}
                ${instructionOverride || ""}
                Analise ${ticker}. Sê extremamente criterioso.
                
                NÃO USE MARKDOWN. NÃO ESCREVA \`\`\`json. RETORNE APENAS O TEXTO DO JSON PURO E NADA MAIS.
                
                RETORNE EXCLUSIVAMENTE ESTE JSON:
                {
                    "score": 0.0,
                    "verdict": "OTIMISMO / NEUTRO / CAUTELA",
                    "summary": "Tese direta de 2 linhas.",
                    "extractedDY": "0.00%",
                    "extractedPrice": "0.00",
                    "pillars": ${pillars},
                    ${isETF ? '"etfMetrics": { "taxa": "0.00%", "benchmark": "Índice", "patrimonio": "R$ 0B" }' :
                    isFII ? '"fiiMetrics": { "pvp": "0.00", "vacancia": "0.0%", "dy": "0.0%" }' :
                        ticker?.includes('USD') || ticker?.includes('BTC') ? '"cryptoMetrics": { "tvl": "--", "inflation": "--" }' : ''}
                }
                INSTRUÇÃO CRÍTICA DE EXTRAÇÃO: No relatório (texto base abaixo de "RELATÓRIO DE FUNDAMENTOS"), identifique o Dividend Yield (DY) projetado/estimado e o PREÇO ATUAL citado. 
                ATENÇÃO: Ignore símbolos de "aproximadamente" como "~" ou "cerca de". Se o texto diz "~7,6%", extraia "7.60%".
                REGRA DE OURO: Ignore COMPLETAMENTE os valores do bloco "DADOS NUMÉRICOS COMPLEMENTARES" para preencher os campos "extractedDY" e "extractedPrice". Busque-os EXCLUSIVAMENTE dentro do texto corrido do relatório.
                Retorne-os nos campos "extractedDY" (ex: "7.60%") e "extractedPrice" (ex: "12.50"). 
                Se o texto não mencionar valores específicos, retorne "N/D" para o respectivo campo.
                Baseie-se nestas dados: ${report}`;
        } else {
            const chatRules = `
REGRAS DE COMUNICAÇÃO (OBRIGATÓRIO):
Seja EXTREMAMENTE conciso e direto. Responda em no máximo 2 a 3 parágrafos curtos.
Use uma linguagem simples e acessível. Evite jargões complexos de Wall Street (como FCF, Covenants, CAPEX) a menos que o utilizador use esses termos primeiro.
Vá direto ao ponto. Não faça introduções longas ou floreados.

REGRA DE PLATAFORMA: Se o utilizador perguntar sobre a diferença entre os números da "Saúde Fundamental" (ou tela) e o "Relatório", explique de forma simples e prática: os números da Saúde Fundamental vêm de APIs automáticas de mercado (são uma fotografia fria dos últimos 12 meses e podem ter atrasos ou distorções), enquanto o Relatório reflete a análise contextual humana/IA da estratégia real, histórico e futuro da empresa. O Relatório é sempre a fonte da verdade sobre a qualidade da empresa.
`;
            systemInstruction = systemPrompt || `${rastroPersona}\n${chatRules}`;
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY;

        if (!openRouterKey) {
            console.error("[RASTRO IA] ERRO: OPENROUTER_API_KEY ausente!");
            return NextResponse.json({ error: "Chave da API n\u00E3o encontrada no .env" }, { status: 500 });
        }

        let responseText = "";
        
        let finalPrompt = prompt || "Gere a an\u00E1lise requerida baseada nos dados do relat\u00F3rio.";

        // Preparar prompt final se n\u00E3o for uma tarefa estruturada (isSummary, etc)
        if (prompt && !isSummary && !isHealth && !isSentiment && !isRatingRequest) {
            finalPrompt = `${rastroPersona}
REGRAS DE COMUNICA\u00C7\u00C3O E INTELIG\u00CANCIA (OBRIGAT\u00D3RIO):

CONTEXTO \u00C9 REI: Nunca d\u00EAs respostas gen\u00E9ricas ou te\u00F3ricas de dicion\u00E1rio. Use o RELAT\u00D3RIO abaixo.
ATIVO EM AN\u00C1LISE: ${name || ticker} (${ticker})
RELAT\u00D3RIO COMPLETO DA EMPRESA:
${report || "Relat\u00F3rio indispon\u00EDvel."}

PERGUNTA DO UTILIZADOR:
${prompt}`;
        }

        // --- SISTEMA DE GERA\u00C7\u00C3O ---
        let lastError = "";

        // Am\u00E1lgama de Prompt
        const finalPromptText = `
            ${systemInstruction}
            
            ${finalPrompt}
        `;

        try {
            console.log(`[RASTRO IA] Solicitando OpenRouter (nvidia/nemotron-3-super) para: ${ticker || name}...`);
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterKey}`,
                    "HTTP-Referer": "https://rastro-sooty.vercel.app",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "nvidia/nemotron-3-super-120b-a12b:free",
                    messages: [{ role: "user", content: finalPromptText.substring(0, 30000) }]
                })
            });

            if (!res.ok) {
                const errData = await res.text();
                throw new Error(`Erro na API: ${res.status} - ${errData}`);
            }

            const data = await res.json();
            responseText = data.choices[0]?.message?.content || "";
            
            if (responseText) {
                console.log(`[RASTRO IA] Sucesso: OpenRouter (nvidia/nemotron-3-super)`);
            }
        } catch (err: any) {
            console.warn(`[RASTRO IA] Falha OpenRouter:`, err.message);
            lastError = err.message;
        }

        if (!responseText) {
            return NextResponse.json({ 
                error: `IA Indispon\u00EDvel: ${lastError}`,
                debug: {
                    key_source: "OPENROUTER",
                    prompt_len: finalPromptText.length,
                    ticker: ticker
                }
            }, { status: 500 });
        }

        if (isSummary || isHealth || isSentiment || isRatingRequest) {
            try {
                // Tenta extrair o JSON do texto caso a IA tenha adicionado ruído/markdown
                const match = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                const jsonString = match ? match[0] : responseText;
                return NextResponse.json(JSON.parse(jsonString));
            } catch (e) {
                console.error("[OPENROUTER PARSE ERROR] Recebido:", responseText);
                // Retornar um JSON vazio estruturado em vez de erro 500 para não quebrar a tela
                return NextResponse.json({
                    score: 5,
                    verdict: "Erro de Leitura",
                    summary: "A IA não conseguiu formatar os dados corretamente para este ativo.",
                    pillars: [],
                    bullCase: [],
                    bearCase: [],
                    error: true
                });
            }
        }

        return NextResponse.json({ reply: responseText });

    } catch (error: any) {
        console.error("[OPENROUTER API ROUTE ERROR]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}