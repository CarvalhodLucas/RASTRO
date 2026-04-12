import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

async function fetchLatestNews(ticker: string) {
    try {
        let query = ticker;
        if (ticker.includes(".SA")) {
            query = ticker.replace(".SA", "") + " B3";
        } else if (ticker.includes("-USD") || ticker.endsWith("USD")) {
            query = ticker.replace("-USD", "").replace("USD", "") + " crypto news";
        }
        
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        const rs = await fetch(rssUrl);
        if (rs.ok) {
            const xml = await rs.text();
            const titles: string[] = [];
            const regex = /<title>(.*?)<\/title>/g;
            let match;
            while ((match = regex.exec(xml)) !== null) {
                if (match[1]) titles.push(match[1]);
            }
            const finalTitles = titles.slice(1, 6);
            return finalTitles.join(" | ").replace(/ - Google Notícias/g, '');
        }
    } catch (e) {
        console.error("News fetch error", e);
    }
    return "";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, ticker, assetName, isPulse, isHealth, isRatingRequest, isSentiment, isComparison, isOnChain, isSummary, isFairPrice, isChat, prompt, report, variation } = body;

        // --- DEFINIÇÃO DO MOTOR DE IA ---
        // Desativando Gemini devido a limites de tokens, conforme solicitado.
        const useGemini = false;
        // O usuário solicitou que Score de IA (Rating) use Llama 3 (Groq/Original Engine).
        const useOpenRouter = isSentiment ? true : false;
        
        let apiURL = "";
        let apiKey = "";
        let model = "";
        let headers: Record<string, string> = { "Content-Type": "application/json" };

        if (useGemini) {
            // MOTOR Google Gemini
            apiKey = process.env.GOOGLE_API_KEY || "";
        } else if (useOpenRouter) {
            // MOTOR OpenRouter
            apiKey = process.env.OPENROUTER_API_KEY || "";
            apiURL = "https://openrouter.ai/api/v1/chat/completions";
            // Rating usa Nemotron (potente/lento). Saúde e Sentimento usam Llama 3 70B (rápido e inteligente).
            model = isHealth || isSentiment ? "meta-llama/llama-3.3-70b-instruct:free" : "nvidia/nemotron-3-super-120b-a12b:free";
            headers["Authorization"] = `Bearer ${apiKey}`;
            headers["HTTP-Referer"] = "https://rastro-sooty.vercel.app";
        } else {
            // MOTOR ORIGINAL (XAI ou GROQ) - Pulse, Sentiment, OnChain, etc.
            const xaiKey = process.env.XAI_API_KEY;
            const groqKey = process.env.GROQ_API_KEY;
            const isXAI = !!xaiKey;
            
            apiKey = (xaiKey || groqKey) || "";
            apiURL = isXAI ? "https://api.x.ai/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";
            model = isXAI ? "grok-beta" : "llama-3.3-70b-versatile";
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        if (!apiKey) {
            return NextResponse.json({ error: "Chave de API não configurada." }, { status: 500 });
        }

        let recentNews = "";
        if (isSentiment) {
            recentNews = await fetchLatestNews(ticker);
        }

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
            const isCryptoFlag = body.isCrypto || ticker.includes('-') || ticker.includes('BTC') || ticker.includes('ETH');
            
            systemInstruction += `\nVocê é um analista de sentimento de alta frequência especializado no mercado ${isCryptoFlag ? 'Cripto' : 'brasileiro (B3)'}. Sua tarefa é definir o nível de ganância/medo do mercado de 0 a 100.
            REGRAS CRÍTICAS:
            - Não se baseie apenas no preço.
            - Ignore quedas técnicas de preço se as manchetes recentes forem de dividendos, lucros ou fatos relevantes positivos. Nesses casos, o sentimento deve ser Ganância/Otimismo (Divergência Bullish).
            - Se o preço subiu, mas há notícias de escândalos ou bolha, o sentimento é MEDO/CAUTELA.`;

            if (isCryptoFlag) {
                systemInstruction += `\nREGRAS EXTRAS PARA CRIPTO:
                1. Filtro de Euforia: Desconte pontos de ganância se as notícias forem muito 'mainstream' (como parcerias de cartões), pois isso costuma indicar topo de curto prazo.
                2. Indicadores On-chain e Volatilidade: Considere que volatilidade de 3% no BTC é baixa; o sentimento só deve ir para 'Extremo' acima de 8-10% de variação ou notícias regulatórias pesadas.
                3. Contexto de Halving: Estamos em um ciclo pós-halving. Analise se a alta é estrutural ou apenas ruído de notícias.`;
            }

            systemInstruction += `\nSaída obrigatória em JSON: { "score": number, "label": string, "analysis": string }.`;
        } else if (isSummary) {
        } else if (isSummary) {
            systemInstruction += `\nTAREFA: RESUMO EXECUTIVO. Analise o relatório qualitativo e forneça 3 pontos positivos (bullCase) e 3 pontos negativos (bearCase) para ${ticker} (${assetName}).
            Retorne EXCLUSIVAMENTE um JSON com:
            - "bullCase": array de 3 objetos com { "title": "título curto", "desc": "descrição curta" }.
            - "bearCase": array de 3 objetos com { "title": "título curto", "desc": "descrição curta" }.`;
        } else if (isHealth || isRatingRequest) {
            systemInstruction += `\nTAREFA: SAÚDE E RATING. Retorne EXCLUSIVAMENTE um JSON com:
            - "score": nota de 0 a 100 (onde 100 é excelente e 0 é péssimo).
            - "obs": um Veredito/Opinião curtíssima (máx 12 palavras) avaliando a qualidade dos fundamentos. Exemplo: "Boa rentabilidade, mas muito cara." NÃO repita os números.
            - "verdict": "Compra", "Venda", "Neutro" ou "Alerta".
            - "summary": tese de investimento resumida.
            - "pillars": array de 4-5 objetos com { "label": "...", "score": 9.5, "status": "pos", "neg" ou "neu", "desc": "..." }.
            - "fiiMetrics": objeto contendo OBRIGATORIAMENTE (se for FII) { "pvp", "vacancia", "dy", "patrimonio" } encontrados no texto. Use "N/D" se não achar.
            - "etfMetrics": objeto contendo OBRIGATORIAMENTE (se for ETF) { "taxa", "benchmark", "patrimonio", "liquidez" } encontrados no texto. Use "N/D" se não achar.
            - "stockMetrics": objeto contendo OBRIGATORIAMENTE (se for ação tradicional/stock) { "roe", "pvp", "pl", "dy" }. INSTRUÇÃO PARA O DY: Procure o valor verdadeiro e atualizado do Dividend Yield (DY) EXCLUSIVAMENTE dentro do 'RELATÓRIO DE FUNDAMENTOS' (texto 360). Se não encontrar de forma alguma no texto, use o valor fornecido nos 'DADOS NUMÉRICOS COMPLEMENTARES'. Use "N/D" se não existir em nenhum dos dois.`;
        } else if (isOnChain) {
            systemInstruction += `\nTAREFA: MÉTRICAS ON-CHAIN. Retorne EXCLUSIVAMENTE um JSON com: "tvl", "wallets", "inflation", "revenue", "s2f" e "score".`;
        } else if (isFairPrice) {
            systemInstruction += `\nTAREFA: VALOR JUSTO (VALUATION). Retorne EXCLUSIVAMENTE um JSON com:
            - "fairPrice": número representando o preço alvo / intrínseco.
            - "upside": número representando o potencial de valorização em porcentagem.`;
        } else if (isChat) {
            systemInstruction += `\nTAREFA: ANALISTA DE CHAT. RESPONDA ao usuário sobre o ativo ${ticker} (${assetName}) baseando-se no relatório fornecido.
            Seja curto, grosso, técnico e sênior. Não use frases amigáveis demais.
            Retorne EXCLUSIVAMENTE um JSON com a chave "reply".`;
        }

        if (useOpenRouter) {
            systemInstruction += `\nINSTRUÇÃO CRÍTICA: Responda APENAS com o objeto JSON. Não inclua nenhuma introdução, explicação, comentários ou blocos de código markdown (\`\`\`json). O retorno deve ser parseável diretamente por JSON.parse().`;
        } else {
            systemInstruction += `\nResponda EXCLUSIVAMENTE em formato JSON puro, sem markdown.`;
        }

        // --- CONSTRUÇÃO DAS MENSAGENS COM CONTEXTO ---
        let finalMessages = messages;
        if (!finalMessages) {
            let userContent = prompt || report || "";
            if (prompt && report) {
                userContent = `RELATÓRIO DE FUNDAMENTOS (${ticker}):\n${report}\n\nPERGUNTA DO USUÁRIO: ${prompt}`;
            }
            if (isSentiment) {
                userContent = `ATIVO: ${ticker} (${assetName})\nVARIAÇÃO DE PREÇO(24H): ${variation || '0'}%\nÚLTIMAS MANCHETES DE NOTÍCIAS: ${recentNews || 'Nenhuma manchete disponível hoje.'}\n\n${prompt || ''}`;
            }
            finalMessages = [{ role: "user", content: userContent }];
        }

        let reply = "";

        if (useGemini) {
            // EXECUÇÃO DIRETA COM GEMINI SDK
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
                
                const result = await geminiModel.generateContent({
                    contents: [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + (prompt || report || "") }] }],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: "application/json",
                    },
                });
                
                reply = result.response.text() || "";
            } catch (geminiError: any) {
                console.error("❌ Erro no Gemini (Acionando Fallback Groq):", geminiError.message);
                // Se Gemini falhar, não retornamos erro 500, simplesmente permitimos que o fluxo continue
                // para o motor Groq (Llama-3) abaixo.
            }
        }

        // Se Gemini não foi usado ou se falhou (e não temos reply ainda)
        if (!reply) {
            // FLUXO NORMAL (OpenRouter / Groq / XAI)
            const fallbackModel = "llama-3.3-70b-versatile";
            const payload = {
                model: useOpenRouter ? model : fallbackModel,
                messages: [
                    { role: "system", content: systemInstruction },
                    ...finalMessages
                ],
                temperature: useOpenRouter ? 0.1 : 0.2,
            };

            let res: Response | null = null;
            let fetchError: any = null;

            try {
                res = await fetch(apiURL, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload)
                });
            } catch (e: any) {
                fetchError = e;
            }

            // --- FALLBACK ROBUSTO: Se o OpenRouter cair ou demorar, desvia para Llama3 na hora! ---
            if ((!res || !res.ok) && useOpenRouter) {
                console.warn(`🔄 [FALLBACK IA] OpenRouter falhou (Status: ${res?.status}). Acionando Llama-3...`);
                
                const fallbackKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || "";
                if (fallbackKey) {
                    headers["Authorization"] = `Bearer ${fallbackKey}`;
                    payload.model = "llama-3.3-70b-versatile";
                    payload.temperature = 0.2;
                    
                    try {
                        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers,
                            body: JSON.stringify(payload)
                        });
                        fetchError = null; 
                    } catch (e: any) {
                        fetchError = e;
                    }
                }
            }

            if (fetchError) {
                return NextResponse.json({ error: "Network/Timeout Error", details: fetchError.message }, { status: 504 });
            }

            if (!res || !res.ok) {
                const errorText = res ? await res.text() : "No response object";
                return NextResponse.json({ error: `AI API Error: ${res?.status || 500}`, details: errorText }, { status: res?.status || 500 });
            }

            const data = await res.json();
            reply = data.choices[0]?.message?.content || "";
        }

        if (!reply) {
            return NextResponse.json({ error: "Resposta vazia da IA" }, { status: 500 });
        }

        // ROBUST JSON EXTRACTION (SELF-HEALING)
        try {
            const cleanReply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
            const startIdx = cleanReply.indexOf('{');
            const endIdx = cleanReply.lastIndexOf('}');
            
            if (startIdx !== -1 && endIdx !== -1) {
                const jsonContent = cleanReply.substring(startIdx, endIdx + 1);
                return NextResponse.json(JSON.parse(jsonContent));
            }
            return NextResponse.json(JSON.parse(cleanReply));
        } catch (e) {
            console.warn(`[API] Erro ao parsear JSON para ${ticker}:`, e);
            return NextResponse.json({ reply, text: reply, parseError: true });
        }

    } catch (error: any) {
        console.error("AI Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
