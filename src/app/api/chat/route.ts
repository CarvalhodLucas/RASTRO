import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const dynamic = "force-dynamic";

// Inicializa o SDK usando a variável GOOGLE_API_KEY ou GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { ticker, name, report, indicators, systemInstruction: instructionOverride, systemPrompt, isSummary, isHealth, isSentiment, isRatingRequest, prompt } = await req.json();

        console.log(`[RASTRO IA] Iniciando análise Gemini para: ${ticker || name}`);

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("[RASTRO IA] Erro: API_KEY não encontrada no servidor.");
            return NextResponse.json({ error: "Chave da API não configurada no servidor." }, { status: 500 });
        }

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

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        // Preparar el prompt final enriquecido si es una pregunta del chat
        let finalPrompt = prompt || "Gere a análise requerida baseada nos dados do relatório.";

        if (prompt && !isSummary && !isHealth && !isSentiment && !isRatingRequest) {
            finalPrompt = `${rastroPersona}
REGRAS DE COMUNICAÇÃO E INTELIGÊNCIA (OBRIGATÓRIO):

CONTEXTO É REI: Nunca dês respostas genéricas ou teóricas de dicionário (ex: "Um score reflete a saúde da empresa"). Se o utilizador perguntar sobre uma nota, score ou dados, LÊ O RELATÓRIO DO ATIVO ABAIXO e elenca os motivos REAIS E ESPECÍFICOS desta empresa.

Sê inteligente, analítico e específico, mostrando que leste os fundamentos.

Mantém a resposta concisa e em linguagem simples.

ATIVO EM ANÁLISE: ${name || ticker} (${ticker})

RELATÓRIO COMPLETO DA EMPRESA:
${report || "Relatório indisponível."}

PERGUNTA DO UTILIZADOR:
${prompt}`;
        }

        // Chamada com o contexto e regras completos
        const result = await model.generateContent(finalPrompt);

        const response = await result.response;
        const responseText = response.text();

        if (isSummary || isHealth || isSentiment || isRatingRequest) {
            try {
                // Tenta extrair o JSON do texto caso a IA tenha adicionado ruído/markdown
                const match = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                const jsonString = match ? match[0] : responseText;
                return NextResponse.json(JSON.parse(jsonString));
            } catch (e) {
                console.error("[GEMINI PARSE ERROR] Recebido:", responseText);
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
        console.error("[GEMINI API ROUTE ERROR]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}