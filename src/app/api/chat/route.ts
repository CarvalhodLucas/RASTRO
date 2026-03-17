import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { LUCAS_KNOWLEDGE } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    try {
        const { prompt, ticker, name, report, indicators, systemInstruction: instructionOverride, systemPrompt, isSummary, isHealth, isSentiment, isRatingRequest } = await req.json();
        console.log("TEXTO RECEBIDO:", report);

        const isCrypto = ticker?.includes('USD') || ticker?.includes('BTC') || ticker?.includes('ETH') || ticker?.includes('USDT') || indicators?.isCrypto;
        const marketType = isCrypto ? 'Cripto/DeFi' : 'Ações/Bolsa de Valores';

        let systemInstruction = "";

        if (isHealth) {
            systemInstruction = `Você é um analista fundamentalista sênior. Analise a empresa ${name} (${ticker}) com base no relatório fornecido.
            
            ⚠️ INSTRUÇÃO CRÍTICA DE SCORE:
            O campo "score" (0-100) deve refletir a SOLIDEZ da empresa. 
            Se algum indicador estiver como "--", "N/D" ou "0" no relatório devido a falha de API, NÃO penalize a empresa zerando o score. 
            Nesse caso, desconsidere o peso desse indicador ou use uma estimativa conservadora baseada no setor. O score nunca deve ser 0 a menos que a empresa esteja em colapso real.

            MISSÃO DE CÁLCULO:
            1. Extrair indicadores: Score (0-100), Status, ROE, P/VP, DY e P/L.
            2. Valor Justo DCF: Projete o fluxo de caixa para 5 anos.
            3. Número de Graham: raiz(22.5 * VPA * LPA).
            4. Preço-teto de Bazin: (Dividendos por Ação nos últimos 12 meses) / 0.06.
            5. Upside: Para cada valor justo, calcule a % em relação ao preço atual.

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
            systemInstruction = `Você é um especialista em análise de sentimento de mercado.
            Analise o sentimento de CURTO PRAZO para ${name} (${ticker}). 
            
            ⚠️ DIRETRIZES DE ANÁLISE:
            1. Considere volatilidade, medo e tom das notícias recentes.
            2. Se o fundamento da empresa for bom mas o mercado estiver em queda livre ou em pânico, o "value" DEVE refletir o MEDO (valor baixo), não a nota técnica fundamentalista.
            3. Identifique se a tendência é de acumulação, distribuição ou pânico.

            Relatório/Notícias:
            ${report} 

            Retorne APENAS um JSON:
            {
              "value": (número de 0 a 100 onde 0-40 é Medo, 41-65 Neutro, 66-100 Ganância), 
              "label": (string: "Medo Extremo", "Medo", "Neutro", "Otimismo" ou "Ganância Extrema"),
              "trend": (string: "up", "down" ou "side")
            }
            Se não houver dados, retorne 50 e "Neutro".`;
        }
        else if (isSummary) {
            systemInstruction = `Você é um analista financeiro. Analise ${name} (${ticker}) e retorne um JSON com duas chaves principais:
            - bullCase: um array de { "title": string, "desc": string } com pontos positivos.
            - bearCase: um array de { "title": string, "desc": string } com riscos.
            Relatório: ${report}`;
        }
        else if (isRatingRequest) {
            const isFII = (ticker?.endsWith('11') || ticker?.endsWith('11.SA')) && !indicators?.isETF;
            const isETF = indicators?.isETF || (ticker?.endsWith('11') || ticker?.endsWith('11.SA')) && indicators?.sector === 'ETF';
            
            const fiiPillars = `[
                {"label": "Qualidade dos Ativos", "score": 0},
                {"label": "Vacância / Portfólio", "score": 0},
                {"label": "Dividend Yield", "score": 0},
                {"label": "Risco de Crédito/Juros", "score": 0}
            ]`;
            const etfPillars = `[
                {"label": "Eficiência de Replicação", "score": 0},
                {"label": "Taxa de Administração", "score": 0},
                {"label": "Liquidez de Mercado", "score": 0},
                {"label": "Qualidade do Índice", "score": 0}
            ]`;
            const stockPillars = `[
                {"label": "Saúde Financeira", "score": 0},
                {"label": "Fosso Competitivo", "score": 0},
                {"label": "Catalisadores", "score": 0},
                {"label": "Riscos", "score": 7}
            ]`;
            
            const activePillars = isETF ? etfPillars : (isFII ? fiiPillars : stockPillars);

            systemInstruction = (instructionOverride ? instructionOverride + "\n\n" : "") + `
                Você é um Analista Sênior especializado em ${isETF ? 'ETFs (Fundos de Índice)' : isFII ? 'Fundos Imobiliários (FIIs)' : 'Bolsa de Valores e Cripto'}.
                Analise o relatório e indicadores de ${ticker}.
                
                Dê uma nota de 0.0 a 10.0 e preencha os 4 pilares técnicos.
                
                ⚠️ FOCO PARA ETFs:
                Se for ETF, foque em:
                1. Taxa de Administração frente aos pares.
                2. Liquidez e Tracking Error (erro de replicação).
                3. Qualidade e representatividade do Índice de Referência (Benchmark).
                
                ⚠️ FOCO PARA FIIs (Fundos Imobiliários):
                Se for FII, ignore métricas de lucro/ROE e foque em:
                1. Qualidade e Localização dos Imóveis.
                2. Histórico e gestão de Vacância.
                3. Sustentabilidade do Dividend Yield (Proventos).
                
                ⚠️ ESTRUTURA DA TESE (campo "summary"):
                Extraia a tese de investimento (Investment Thesis) a partir de seções como "Resumo Estratégico", "Conclusão", "Perspectivas" ou "Análise do Analista".
                O campo "summary" deve conter um parágrafo direto de 2 a 3 linhas. NUNCA deixe vazio.
                
                ⚠️ MÉTRICAS ESPECÍFICAS (FII/ETF/CRIPTO):
                É OBRIGATÓRIO preencher os campos reais em "fiiMetrics", "etfMetrics" ou "cryptoMetrics" extraindo os dados exatos do texto.
                
                Responda APENAS em JSON:
                {
                    "score": 8.5,
                    "verdict": "${isETF ? 'OTIMISMO E DIVERSIFICAÇÃO' : isFII ? 'OTIMISMO E RENDA' : 'COMPRA / OTIMISMO'}",
                    "summary": "Tese de investimento extraída...",
                    "pillars": ${activePillars},
                    ${isETF ? '"etfMetrics": { "taxa": "0.00%", "benchmark": "Índice", "patrimonio": "R$ 0B", "liquidez": "R$ 0M" }' : 
                      isFII ? '"fiiMetrics": { "pvp": "0.00", "vacancia": "0.0%", "dy": "0.0%", "patrimonio": "R$ 0.0B" }' : 
                      ticker.includes('USD') || ticker.includes('BTC') ? '"cryptoMetrics": { "tvl": "--", "wallets": "--", "inflation": "--", "revenue": "--" }' : ''}
                }
                
                Baseie-se nos dados reais: ${report} e Indicadores: ${JSON.stringify(indicators || {})}.
                
                ⚠️ ANÁLISE FORENSE: Se os indicadores numéricos estiverem zerados, use o texto do "Relatório 360" (EBITDA, Backlog, Aluguéis, Ocupação) para compor a nota. A nota deve refletir a qualidade descrita no texto.
            `;
        } else {
            // If a systemPrompt was sent from the frontend (portfolio chat), use it directly.
            // This is the fix: the frontend's SENIOR_AGENT_PROMPT with all classification rules
            // was being ignored because the backend always built its own internal prompt.
            if (systemPrompt) {
                systemInstruction = systemPrompt;
            } else {
                // BLOCO DO CHATBOX - ANALISTA SÊNIOR COM FOCO EXCLUSIVO E JUSTIFICATIVA
                const isCrypto = ticker?.toUpperCase().includes('USD') || ticker?.toUpperCase().includes('BTC') || ticker?.toUpperCase().includes('ETH') || ticker?.toUpperCase().includes('USDT') || name?.toLowerCase().includes('token');
                const assetType = isCrypto ? 'Criptoativo/Token' : 'Ação/Ativo Tradicional';
                
                // 1. Tradução do Veredito para Psicologia de Mercado (Sentimento)
                const rawVerdict = indicators?.verdict?.toUpperCase() || "NEUTRO";
                let safeVerdict = "NEUTRALIDADE / AGUARDAR DEFINIÇÃO";

                if (rawVerdict.includes("COMPRA")) {
                    safeVerdict = "OTIMISMO E ACUMULAÇÃO (BULLISH)"; 
                } else if (rawVerdict.includes("VENDA")) {
                    safeVerdict = "CAUTELA E DISTRIBUIÇÃO (BEARISH)";
                } else if (rawVerdict !== "NEUTRO") {
                    safeVerdict = rawVerdict;
                }

                const realScore = indicators?.score || "N/A";

                systemInstruction = `
                VOCÊ É O LUCAS, ANALISTA SÊNIOR DA PLATAFORMA RASTRO IA. Responda de forma natural, em parágrafos e vá direto ao ponto.
                ATIVO EM TELA: ${name} (${ticker}) - TIPO: ${assetType}

                [BASE DE CONHECIMENTO DO ATIVO]
                ${report || "Use seu conhecimento técnico."}

                [CLASSIFICAÇÃO OFICIAL DO SISTEMA]
                - NOTA: ${realScore}/10
                - VEREDITO OFICIAL: ${safeVerdict}

                ⚠️ REGRAS OBRIGATÓRIAS:
                1. FOCO EXCLUSIVO NO ATIVO ATUAL (${name}).
                2. NUNCA use "Carteira". Use "Watchlist" ou "Lista de Acompanhamento".
                3. O DONO DA NOTA: Use APENAS ${realScore}/10. NUNCA invente outra nota.
                4. PROIBIDO RECOMENDAR COMPRA/VENDA DIRETO.
                5. Se for Cripto, não use métricas de Ações (LPA, ROE).
                `;
            }
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt || "Gere a análise técnica agora baseada nos dados fornecidos." }
            ],
            // Usamos llama-3.1-8b-instant porque tiene una ventana de contexto de 128k tokens,
            // lo que permite procesar LUCAS_KNOWLEDGE (30k chars) + reportes largos sin fallar.
            model: "llama-3.1-8b-instant",
            response_format: (isSummary || isHealth || isSentiment || isRatingRequest) ? { type: "json_object" } : undefined,
            temperature: 0.2,
            max_tokens: 1024,
        });

        const response = chatCompletion.choices[0]?.message?.content || (isSummary || isHealth || isSentiment ? "{}" : "");

        if (isSummary || isHealth || isSentiment || isRatingRequest) {
            try {
                const parsed = JSON.parse(response);
                return NextResponse.json(parsed);
            } catch (e) {
                console.error("Erro ao parsear JSON da Groq:", response);
                return NextResponse.json({ error: "Erro no formato da resposta da IA" }, { status: 500 });
            }
        }

        // Se for o chat, retornamos no formato esperado pelo componente de mensagens
        return NextResponse.json({ reply: response });

    } catch (error: any) {
        console.error("Erro na Rota API:", error?.response?.data || error.message || error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}