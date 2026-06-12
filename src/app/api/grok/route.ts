import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Removido runtime edge para evitar timeouts 504 em modelos lentos
// export const runtime = "edge";
export const maxDuration = 60; // Configuração para aumentar timeout da API no Vercel
async function fetchLatestNews(ticker: string, isMetricSearch: boolean = false) {
    try {
        let query = ticker;
        if (ticker.includes(".SA")) {
            query = ticker.replace(".SA", "") + " B3";
        } else if (ticker.includes("-USD") || ticker.endsWith("USD")) {
            const clean = ticker.replace("-USD", "").replace("USD", "");
            query = isMetricSearch ? `${clean} on-chain data metrics tvl wallets inflation` : `${clean} crypto news`;
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
            const finalTitles = titles.slice(1, 10); // Aumentado para 10 para mais contexto
            return finalTitles.join(" | ").replace(/ - Google Notícias/g, '');
        }
    } catch (e) {
        console.error("News fetch error", e);
    }
    return "";
}
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { 
            messages, ticker, assetName, isPulse, isHealth, 
            isRatingRequest, isSentiment, 
            isOnChain, isSummary, isFairPrice, isChat, isPortfolioChat, isSupportChat,
            prompt, report, variation, indicators, systemContext 
        } = body;

        // --- MOTOR DE IA: lido dinamicamente do ai-models.config.json ---
        // Edite o arquivo na raiz do projeto para trocar modelos sem mexer no código
        const fs = require("fs");
        const path = require("path");
        const configPath = path.join(process.cwd(), "ai-models.config.json");
        const aiConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        const sections = aiConfig.sections;

        // Detecta qual seção está sendo chamada e pega provider + model do config
        let sectionConfig = sections.sentimento; // fallback
        if (isPortfolioChat) sectionConfig = sections.portfolio_chat;
        else if (isSupportChat) sectionConfig = sections.support_chat;
        else if (isPulse)    sectionConfig = sections.pulso;
        else if (isSummary)  sectionConfig = sections.resumo;
        else if (isRatingRequest) sectionConfig = sections.rating;
        else if (isHealth)   sectionConfig = sections.saude;
        else if (isSentiment) sectionConfig = sections.sentimento;
        else if (isOnChain)  sectionConfig = sections.saude;
        else if (isChat)     sectionConfig = sections.chat;

        const configProvider = sectionConfig.provider;  // "gemini" | "groq" | "openrouter"
        const configModel    = sectionConfig.model;

        const useGemini      = configProvider === "gemini";
        const useGroqOnly    = configProvider === "groq";
        const useGroq2       = configProvider === "groq2";
        const useGroq3       = configProvider === "groq3";
        const useOpenRouter  = configProvider === "openrouter";

        let apiURL = "";
        let apiKey = "";
        let model  = configModel;
        let headers: Record<string, string> = { "Content-Type": "application/json" };

        const groqKey = process.env.GROQ_API_KEY;
        const groq2Key = process.env.GROQ2_API_KEY;
        const groq3Key = process.env.GROQ3_API_KEY;

        if (useGroqOnly) {
            apiKey = groqKey || "";
            apiURL = "https://api.groq.com/openai/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
        } else if (useGroq2) {
            apiKey = groq2Key || groqKey || "";
            apiURL = "https://api.groq.com/openai/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
        } else if (useGroq3) {
            apiKey = groq3Key || groq2Key || groqKey || "";
            apiURL = "https://api.groq.com/openai/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
        } else if (useGemini) {
            apiKey = process.env.GOOGLE_API_KEY || "";
            // defaultApiURL / defaultModel não são usados: Gemini usa SDK próprio
        } else if (useOpenRouter) {
            apiKey = process.env.OPENROUTER_API_KEY || "";
            apiURL = "https://openrouter.ai/api/v1/chat/completions";
            headers["Authorization"] = `Bearer ${apiKey}`;
            headers["HTTP-Referer"] = "https://rastro-sooty.vercel.app";
        }

        if (!apiKey && !useGemini) {
            return NextResponse.json({ error: "Chave de API não configurada." }, { status: 500 });
        }

        let recentNews = "";
        if ((isSentiment || isOnChain || isPulse) && ticker) {
            recentNews = await fetchLatestNews(ticker, isOnChain);
        }

        let systemInstruction = `Você é um analista sênior da RASTRO, uma plataforma premium de inteligência de mercado com estética Bloomberg/Terminal.
        Seu tom é extremamente profissional, direto, técnico e imparcial. 
        REGRAS LEGAIS RESTRITAS (CVM 20/2021):
        - JAMAIS use termos como "lucro garantido", "rendimento certo", "sem risco" ou "fique rico".
        - JAMAIS prometa rentabilidade futura.
        - JAMAIS dê ordens diretas de "Compre" ou "Venda".
        - Diferencie fatos (balanços passados) de projeções (IA).
        - Use português do Brasil.`;

        if (isPulse) {
            systemInstruction += `\nTAREFA: PULSO DE IA. Forneça um diagnóstico de CURTÍSSIMO PRAZO (Day Trade/Swing Trade) para ${ticker} (${assetName || ticker}).
            Considere a variação atual de ${variation || '0'}%. 
            Retorne EXCLUSIVAMENTE um JSON com:
            - "score": número de 0 a 100 de força relativa.
            - "insight": uma frase técnica de até 15 palavras sobre o momento.
            - "tailRisk": "Baixo", "Médio" ou "Alto".
            - "volatility": "Baixa", "Moderada" ou "Alta".`;
        } else if (isSentiment) {
            const isCryptoFlag = body.isCrypto || (ticker && (ticker.includes('-') || ticker.includes('BTC') || ticker.includes('ETH')));
            
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
            systemInstruction += `\nTAREFA: RESUMO EXECUTIVO. Analise o relatório qualitativo e forneça 3 pontos positivos (bullCase) e 3 pontos negativos (bearCase) para ${ticker} (${assetName || ticker}).
            Retorne EXCLUSIVAMENTE um JSON com:
            - "bullCase": array de 3 objetos com { "title": "título curto", "desc": "descrição curta" }.
            - "bearCase": array de 3 objetos com { "title": "título curto", "desc": "descrição curta" }.`;
        } else if (isHealth || isRatingRequest) {
            systemInstruction += `\nTAREFA: SAÚDE E RATING. Retorne EXCLUSIVAMENTE um JSON com:
            - "score": nota de 0 a 100 (onde 100 é excelente e 0 é péssimo).
            - "obs": um Veredito/Opinião curtíssima (máx 12 palavras) avaliando a qualidade dos fundamentos. Exemplo: "Boa rentabilidade, mas muito cara." NÃO repita os números.
            - "verdict": "Oportunidade", "Risco Alto", "Neutro" ou "Alerta".
            - "summary": tese de investimento resumida.
            - "pillars": array de 4-5 objetos com { "label": "...", "score": 9.5, "status": "pos", "neg" ou "neu", "desc": "..." }.
            - "fiiMetrics": objeto contendo OBRIGATORIAMENTE (se for FII) { "vpa", "pvp", "vacancia", "dy", "patrimonio" } encontrados no texto. Use "N/D" se não achar.
            - "etfMetrics": objeto contendo OBRIGATORIAMENTE (se for ETF) { "taxa", "benchmark", "patrimonio", "liquidez" } encontrados no texto. Use "N/D" se não achar.
            - "stockMetrics": objeto contendo OBRIGATORIAMENTE (se for ação tradicional/stock) { "roe", "pvp", "pl", "dy" }. INSTRUÇÃO PARA O DY: Procure o valor verdadeiro e atualizado do Dividend Yield (DY) EXCLUSIVAMENTE dentro do 'RELATÓRIO DE FUNDAMENTOS' (texto 360). Se não encontrar de forma alguma no texto, use o valor fornecido nos 'DADOS NUMÉRICOS COMPLEMENTARES'. Use "N/D" se não existir em nenhum dos dois.
            - "dcf": numero com o Valor Justo DCF estimado (apenas o numero).
            - "dcfUpside": numero com a margem de seguranca do DCF em porcentagem (ex: 15.5).
            - "graham": numero com o Valor Justo de Graham estimado (apenas o numero).
            - "grahamUpside": numero com a margem de seguranca de Graham em porcentagem.
            - "bazin": numero com o Preço-teto de Bazin estimado (apenas o numero).
            - "bazinUpside": numero com a margem de seguranca de Bazin em porcentagem.`;
        } else if (isOnChain) {
            systemInstruction += `\nTAREFA: MÉTRICAS ON-CHAIN PARA CRIPTO. Retorne EXCLUSIVAMENTE um JSON com: "tvl", "wallets", "inflation", "revenue", "s2f", "score", "fairPrice" e "upside".
            REGRAS CRÍTICAS DE DADOS (JAMAIS IGNORE):
            1. JAMAIS use números sequenciais, genéricos ou de exemplo (ex: 123456, 85000000, 1.23, 1234567890). Isso é inaceitável.
            2. Se você não tem acesso ao dado real nas notícias fornecidas ou no seu conhecimento treinado, use "N/D" para strings ou 0 para números.
            3. Se for Bitcoin (BTC), o TVL costuma ser "N/D" ou relacionado à Lightning Network. Use valores realistas de mercado (Ex: Revenue diário do BTC é na casa de milhões de USD).
            4. Se for Ethereum (ETH), use valores de TVL na casa de bilhões de USD.
            5. O campo "s2f" (Stock-to-Flow) deve refletir a escassez atual (ex: ~55 para BTC).
            6. "score" de 0 a 100 baseado na atividade e segurança da rede.
            7. Estime "fairPrice" e "upside" baseando-se em modelos de escassez e adoção.`;
        } else if (isFairPrice) {
            systemInstruction += `\nTAREFA: VALOR JUSTO (VALUATION). Retorne EXCLUSIVAMENTE um JSON com:
            - "fairPrice": number representando o preço alvo / intrínseco.
            - "upside": number representando o potencial de valorização em porcentagem.`;
        } else if (isPortfolioChat) {
            systemInstruction += `\nTAREFA: MENTOR DE PORTFÓLIO (RASTRO SÊNIOR).
            
            ${systemContext ? systemContext : ''}
            
            DIRETRIZES DE TOM:
            - Tom: Bloomberg Terminal / Sênior Institutional. 
            - Estilo: Curto, direto, focado em dados do portfólio.
            - Você está analisando um portfólio inteiro, não apenas um ativo. Responda à pergunta do usuário baseando-se OBRIGATORIAMENTE no SNAPSHOT fornecido.
            
            REGRAS CRÍTICAS:
            1. Seja objetivo e analítico ao responder perguntas sobre a carteira.
            2. NUNCA sugira "Compra" ou "Venda" diretamente.
            3. ADICIONE SEMPRE esta nota no final da resposta: "\n\n*Nota: Esta é uma análise automatizada para fins informativos. Não constitui recomendação de investimento.*"
            
            IMPORTANTE: NÃO use a estrutura de JSON de avaliação (score, pillars, etc.) para o chat. Use EXCLUSIVAMENTE um JSON com uma única chave "reply" contendo sua análise técnica e ácida em formato de texto.`;
        } else if (isChat) {
            systemInstruction += `\nTAREFA: ANALISTA DE CHAT. Sua missão é EXPLICAR e JUSTIFICAR tecnicamente os dados do ativo ${ticker} (${assetName || ticker}) e a nota atribuída.
            
            ${systemContext ? systemContext : ''}
            
            DIRETRIZES DE TOM:
            - Tom: Bloomberg Terminal / Sênior Institutional. 
            - Estilo: Curto, direto, focado em números e fatos. Zero "papo furado". Ácido e técnico.
            - Autonomia: Você É o autor da Nota de Solidez abaixo.
            
            REGRA DE OURO: Nunca contradiga o Score ou a Tese de Investimento que já estão na tela (${indicators?.investorThesis || 'N/A'}). Baseie suas respostas nesses números atuais e no relatório 360.
            
            CONTEXTO ATUAL DO ATIVO:
            - Sua Nota de Solidez: ${indicators?.score || 'N/A'}/10
            - Setor: ${indicators?.sector || 'N/A'}
            - Preço Atual: R$ ${indicators?.price || 'N/A'}
            - Dividend Yield: ${indicators?.dy || 'N/A'}%
            - ROE: ${indicators?.roe || 'N/A'}%
            - P/L: ${indicators?.pl || 'N/A'}x
            - Valor Justo DCF: R$ ${indicators?.fairPrice || 'N/A'}
            - Número de Graham: R$ ${indicators?.graham || 'N/A'}
            - Preço-teto de Bazin: R$ ${indicators?.bazin || 'N/A'}
            
            SENTIMENTO E MOMENTO (DADOS DA TELA):
            - Sentimento do Mercado: Nota ${indicators?.sentiment?.score || 'N/A'} (${indicators?.sentiment?.label || 'N/A'}). Justificativa: ${indicators?.sentiment?.analysis || 'N/A'}
            - Pulso de IA: Nota ${indicators?.pulse?.score || 'N/A'}. Insight: ${indicators?.pulse?.insight || 'N/A'}
            - Pontos Positivos (Bull Case): ${indicators?.analysis?.bullCase?.map((b: any) => b.title).join(', ') || 'N/A'}
            - Pontos Negativos (Bear Case): ${indicators?.analysis?.bearCase?.map((b: any) => b.title).join(', ') || 'N/A'}
            
            REGRAS CRÍTICAS:
            1. Quando o usuário questionar a nota (ex: "pq a nota X?"), faça um DEEP DIVE técnico. Relacione os indicadores (ROE, Margens, Endividamento) citados no RELATÓRIO DE FUNDAMENTOS com o peso que você deu para chegar no resultado final.
            2. Se questionado sobre SENTIMENTO (ex: "pq o sentimento está em X?"), use a Justificativa do Sentimento fornecida acima para fundamentar sua resposta.
            3. Se questionado sobre VALUATION (Bazin, Graham, DCF), utilize EXCLUSIVAMENTE os valores fornecidos no CONTEXTO acima.
            4. NUNCA sugira "Compra" ou "Venda". Se perguntado se deve comprar, analise os fundamentos e riscos, deixando o veredito para o usuário.
            5. ADICIONE SEMPRE esta nota no final da resposta: "\n\n*Nota: Esta é uma análise automatizada para fins informativos. Não constitui recomendação de investimento.*"
            6. Evite disclaimers repetitivos além da nota obrigatória acima.
            
            IMPORTANTE: NÃO use a estrutura de JSON de avaliação (score, pillars, etc.) para o chat. Use EXCLUSIVAMENTE um JSON com uma única chave "reply".`;
        } else if (isSupportChat) {
            systemInstruction = `${systemContext || 'Você é o Assistente Virtual Oficial da plataforma RASTRO.'}
            
            INSTRUÇÕES ADICIONAIS:
            - Responda de forma direta, educada e amigável.
            - Use markdown para estruturar a resposta se necessário (negrito, listas, etc).
            - Mantenha o foco em ajudar o usuário com as funcionalidades da plataforma RASTRO.
            - NUNCA forneça recomendações de investimento ou conselhos financeiros.
            
            IMPORTANTE: NÃO use a estrutura de JSON de avaliação (score, pillars, etc.) para o chat. Use EXCLUSIVAMENTE um JSON com uma única chave "reply".`;
        }


        if (useOpenRouter && !isChat && !isPortfolioChat && !isSupportChat) {
            systemInstruction += `\nINSTRUÇÃO CRÍTICA: Responda APENAS com o objeto JSON. Não inclua nenhuma introdução, explicação, comentários ou blocos de código markdown (\`\`\`json). O retorno deve ser parseável diretamente por JSON.parse().`;
        } else if (!isChat && !isPortfolioChat && !isSupportChat) {
            systemInstruction += `\nResponda EXCLUSIVAMENTE em formato JSON puro, sem markdown.`;
        }

        // --- CONSTRUÇÃO DAS MENSAGENS COM CONTEXTO ---
        let finalMessages = messages || [];
        
        // Se não houver histórico, cria o primeiro bloco de conteúdo com o relatório
        if (finalMessages.length === 0) {
            let userContent = prompt || report || "";
            if (prompt && report) {
                userContent = `RELATÓRIO DE FUNDAMENTOS (${ticker}):\n${report}\n\nPERGUNTA DO USUÁRIO: ${prompt}`;
            } else if (isSentiment || isPulse) {
                userContent = `ATIVO: ${ticker} (${assetName || ticker})\nVARIAÇÃO DE PREÇO(24H): ${variation || '0'}%\nÚLTIMAS MANCHETES DE NOTÍCIAS: ${recentNews || 'Nenhuma manchete disponível hoje.'}\n\n${prompt || ''}`;
            } else if (isOnChain) {
                userContent = `DADOS DE MERCADO DO ATIVO:\n${report || `Ativo: ${ticker}`}\n\nVARIAÇÃO DE PREÇO(24H): ${variation || '0'}%\nNOTÍCIAS/CONTEXTO ADICIONAL: ${recentNews || 'Sem notícias recentes.'}\n\nAnalise os dados acima e retorne as métricas on-chain estimadas.`;
            }
            finalMessages = [{ role: "user", content: userContent }];
        } else {
            // Se houver histórico, o 'prompt' atual deve ser adicionado ao final se não estiver lá
            // (O frontend envia 'prompt' separadamente para manter a lógica original)
            const lastMsg = finalMessages[finalMessages.length - 1];
            if (prompt && (!lastMsg || lastMsg.content !== prompt)) {
                finalMessages.push({ role: "user", content: prompt });
            }
        }

        let reply = "";
        let modelNameUsed = model;

        try {
            if (useGemini && apiKey) {
                const genAI = new GoogleGenerativeAI(apiKey);
                const geminiModel = genAI.getGenerativeModel({ model: model });
                const result = await geminiModel.generateContent({
                    systemInstruction: systemInstruction,
                    contents: finalMessages.map((m: any) => ({
                        role: m.role === "assistant" ? "model" : "user",
                        parts: [{ text: m.content }]
                    })),
                    generationConfig: {
                        temperature: isRatingRequest ? 0.1 : 0.4,
                        responseMimeType: (isRatingRequest || isPulse || isSentiment || isOnChain || isChat || isPortfolioChat || isSupportChat) ? "application/json" : "text/plain",
                    },
                });
                reply = result.response.text() || "";
            } else if (apiURL) {
                const payload = {
                    model: model,
                    messages: [
                        { role: "system", content: systemInstruction },
                        ...finalMessages
                    ],
                    temperature: useOpenRouter ? 0.1 : 0.2,
                };

                const res = await fetch(apiURL, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    reply = data.choices[0]?.message?.content || "";
                } else {
                    throw new Error(`API Error: ${res.status}`);
                }
            }
        } catch (error: any) {
            console.error(`❌ [PRIMARY AI ERROR]: ${model}`, error.message);
        }

        // ÚLTIMO RECURSO: FALLBACK GLOBAL PARA DEEPSEEK
        if (!reply) {
            console.warn(`🔄 [ULTIMATE FALLBACK] Tentando modelo DeepSeek-v4-Flash via OpenRouter...`);
            const openRouterKey = process.env.OPENROUTER_API_KEY || "";
            if (openRouterKey) {
                try {
                    const fallbackPayload = {
                        model: "deepseek/deepseek-v4-flash",
                        messages: [
                            { role: "system", content: systemInstruction },
                            ...finalMessages
                        ],
                        temperature: 0.1,
                    };

                    const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${openRouterKey}`,
                            "HTTP-Referer": "https://rastro-sooty.vercel.app"
                        },
                        body: JSON.stringify(fallbackPayload)
                    });

                    if (fallbackRes.ok) {
                        const fbData = await fallbackRes.json();
                        reply = fbData.choices[0]?.message?.content || "";
                        modelNameUsed = "deepseek/deepseek-v4-flash (Fallback)";
                    } else {
                        const errText = await fallbackRes.text();
                        console.error(`❌ [ULTIMATE FALLBACK FAILED] Status: ${fallbackRes.status} - ${errText}`);
                    }
                } catch (fbError: any) {
                    console.error("❌ [ULTIMATE FALLBACK FAILED]:", fbError.message);
                }
            }
        }

        if (!reply) return NextResponse.json({ error: "Resposta vazia da IA ou limite de tokens atingido em todos os provedores." }, { status: 504 });

        try {
            // Limpeza agressiva para garantir que temos apenas o JSON
            let jsonContent = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
            const startIdx = jsonContent.indexOf('{');
            const endIdx = jsonContent.lastIndexOf('}');
            
            if (startIdx !== -1 && endIdx !== -1) {
                jsonContent = jsonContent.substring(startIdx, endIdx + 1);
            }

            try {
                let parsed = JSON.parse(jsonContent);
                
                // Se o resultado ainda for uma string, tenta parsar de novo (double stringified)
                if (typeof parsed === 'string' && parsed.trim().startsWith('{')) {
                    try {
                        parsed = JSON.parse(parsed);
                    } catch (e) {}
                }

                if (typeof parsed === 'object' && parsed !== null) {
                    return NextResponse.json({ ...parsed, _admin_model: modelNameUsed || model });
                } else {
                    // Se o parse retornou algo que não é objeto, mas estamos em um chat, retornamos como reply
                    if (isChat || isPortfolioChat || isSupportChat) {
                        return NextResponse.json({ reply: String(parsed), _admin_model: modelNameUsed || model });
                    }
                    return NextResponse.json({ reply: String(parsed), _admin_model: modelNameUsed || model });
                }
            } catch (parseErr) {
                // Fallback para CHAT: Se não for JSON, mas for um chat, retorna o texto bruto
                if (isChat || isPortfolioChat || isSupportChat) {
                    return NextResponse.json({ 
                        reply: reply.trim(), 
                        _admin_model: modelNameUsed || model,
                        rawTextMode: true 
                    });
                }

                // Fallback 1: Tentar extrair apenas o campo "reply" via Regex se o JSON estiver quebrado
                const replyMatch = jsonContent.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
                if (replyMatch && replyMatch[1]) {
                    // Limpa escapes de string
                    const extractedReply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                    return NextResponse.json({ 
                        reply: extractedReply, 
                        _admin_model: modelNameUsed || model,
                        recoveredByRegex: true 
                    });
                }
                throw parseErr; // Passa para o catch externo
            }
        } catch (e) {
            console.warn(`[API] JSON Parse fail for ${ticker}:`, e);
            // Fallback final: Retorna o texto bruto se nada mais funcionar, 
            // mas tenta pelo menos remover as chaves externas se existirem
            let finalReply = reply;
            if (reply.includes('"reply":')) {
                const match = reply.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
                if (match) finalReply = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
            return NextResponse.json({ reply: finalReply, _admin_model: modelNameUsed || model, parseError: true });
        }

    } catch (error: any) {
        console.error("AI Route Critical Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

