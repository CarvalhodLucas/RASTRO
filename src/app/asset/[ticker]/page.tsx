"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assetsDatabase } from "@/lib/data";
import { LUCAS_KNOWLEDGE } from "@/lib/knowledge";
import Header from "@/components/Header";
const BRAPI_TOKEN = "";
type Status = "loading" | "success" | "error";

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="relative group inline-block">
        <span className="material-symbols-outlined !text-[11px] ml-1 cursor-help text-slate-400">help_outline</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-zinc-800 text-slate-200 text-xs rounded p-2 z-50 shadow-lg text-center whitespace-normal pointer-events-none">
            {text}
        </div>
    </div>
);

// Função para gerir horários internacionais e contagem regressiva
const getMarketStatus = (asset: any) => {
    try {
        // 1. Identificação Robusta de Cripto
        const ticker = asset?.ticker?.toUpperCase() || "";
        // Se tiver 'isCrypto' no banco, ou se o ticker contiver padrões comuns de cripto
        const isCrypto = asset?.isCrypto ||
            ticker.includes("BTC") ||
            ticker.includes("ETH") ||
            ticker.includes("USDT") ||
            (!ticker.includes(".SA") && !asset?.fundamentalData); // Criptos não têm P/L

        if (isCrypto) {
            return { isOpen: true, label: "LIVE 24/7", countdown: "" };
        }

        // 2. Lógica de Horário para B3 e EUA
        const brTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const hours = brTime.getHours();
        const minutes = brTime.getMinutes();
        const day = brTime.getDay();
        const currentTime = hours * 60 + minutes;

        const isWeekend = day === 0 || day === 6;
        const isUS = !ticker.includes(".SA");
        const openTime = isUS ? 630 : 600; // EUA 10h30, B3 10h
        const closeTime = 1020; // 17h

        const isOpen = !isWeekend && currentTime >= openTime && currentTime < closeTime;

        // 3. Cálculo da Contagem (Só para Ações)
        let countdown = "";
        if (!isOpen) {
            let diff;
            if (isWeekend || currentTime >= closeTime) {
                const daysToAdd = day === 5 ? 3 : day === 6 ? 2 : 1;
                const nextOpen = (daysToAdd * 1440) + openTime;
                diff = nextOpen - currentTime;
            } else {
                diff = openTime - currentTime;
            }
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            countdown = `${h}h ${m}min`;
        }

        return { isOpen, countdown, label: isUS ? "NYSE/NASDAQ" : "B3" };
    } catch (e) {
        return { isOpen: true, countdown: "", label: "B3" };
    }
};

// Função para calcular o Score de Solidez Híbrida (Ações + Criptos)
const calculateSolidityScore = (assetData: any) => {
    if (!assetData) return 0;

    const isCrypto = assetData.isCrypto;
    let score = 0;

    if (isCrypto) {
        // --- LÓGICA PARA CRIPTOMOEDAS ---
        const ticker = assetData.ticker?.toUpperCase() || "";
        // 1. Market Cap / Relevância (Peso 40)
        if (ticker.includes("BTC")) score += 40;
        else if (ticker.includes("ETH")) score += 35;
        else if (ticker.includes("SOL") || ticker.includes("BNB") || ticker.includes("USDT")) score += 25;
        else score += 15;

        // 2. Estabilidade de Preço / Volatilidade (Peso 30)
        const variation = Math.abs(parseFloat(assetData.variation) || 0);
        if (variation < 2) score += 30;
        else if (variation < 5) score += 20;
        else if (variation < 10) score += 10;

        // 3. Dominância e Confiança (Peso 30)
        score += 30; // Base para ativos top listados
    } else {
        // --- LÓGICA PARA AÇÕES ---
        if (!assetData.fundamentalData) return 0;
        const { roe, dy, margin } = assetData.fundamentalData;
        const currentPrice = parseFloat(assetData.price) || 0;
        const grahamPrice = parseFloat(assetData.valuation?.graham) || 0;

        // 1. Rentabilidade (Peso 30)
        if (parseFloat(roe) > 15) score += 30;
        else if (parseFloat(roe) > 8) score += 15;

        // 2. Dividendos (Peso 20)
        if (parseFloat(dy) > 6) score += 20;
        else if (parseFloat(dy) > 2) score += 10;

        // 3. Preço de Graham (Peso 30)
        if (currentPrice > 0 && grahamPrice > 0) {
            if (currentPrice < grahamPrice) score += 30;
            else if (currentPrice < grahamPrice * 1.2) score += 15;
        }

        // 4. Margem (Peso 20)
        if (parseFloat(margin) > 10) score += 20;
        else if (parseFloat(margin) > 5) score += 10;
    }

    return Math.min(score, 100);
};



export default function AssetPage() {
    const params = useParams();
    const rawTicker = params?.ticker || params?.id || "";
    const ticker = typeof rawTicker === "string" ? rawTicker.toUpperCase() : "";

    const [status, setStatus] = useState<Status>("loading");
    const [asset, setAsset] = useState<any>(null);
    const [marketStatus, setMarketStatus] = useState(getMarketStatus(null));

    useEffect(() => {
        // Atualiza imediatamente ao trocar de ativo
        setMarketStatus(getMarketStatus(asset));

        const timer = setInterval(() => {
            setMarketStatus(getMarketStatus(asset));
        }, 60000);
        return () => clearInterval(timer);
    }, [asset]);
    const [htmlReport, setHtmlReport] = useState<string | null>(null);

    // --- ESTADOS DO CHAT ---
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<Array<{ role: "user" | "ia"; text: string }>>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [reportDate, setReportDate] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: "", message: "", icon: "check_circle" });
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertPrice, setAlertPrice] = useState("");
    const [alertReport, setAlertReport] = useState(true);
    const [alertMethod, setAlertMethod] = useState("browser"); // 'browser', 'telegram' ou 'email'
    const [hasAlert, setHasAlert] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [compareTicker, setCompareTicker] = useState("");
    const [compareAsset, setCompareAsset] = useState<any>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [aiRating, setAiRating] = useState<number | null>(null);
    const [aiReview, setAiReview] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(messages.length);

    // Auto-scroll do chat (Ancoragem por Contexto)
    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            const lastMsg = messages[messages.length - 1];
            // Se a IA respondeu, ancoramos na pergunta do usuário (índice anterior) para dar contexto.
            // Se for a primeira mensagem ou mensagem do usuário, focamos nela mesma.
            const targetIdx = (lastMsg.role === 'ia' && messages.length > 1)
                ? messages.length - 2
                : messages.length - 1;

            if (targetIdx >= 0) {
                // Pequeno timeout para garantir que o React terminou de injetar os IDs no DOM
                setTimeout(() => {
                    const targetEl = document.getElementById(`chat-msg-${targetIdx}`);
                    if (targetEl && chatContainerRef.current) {
                        chatContainerRef.current.scrollTo({
                            top: targetEl.offsetTop - 10,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    const [aiRatingData, setAiRatingData] = useState<any>(null);
    const [investorThesis, setInvestorThesis] = useState("");
    const [isRatingLoading, setIsRatingLoading] = useState(false);
    const [lastAnalyzedTicker, setLastAnalyzedTicker] = useState("");

    // Helper para limpar formatação Markdown da IA
    const cleanAIText = (text: string) => {
        if (!text) return "";
        return text
            .replace(/\*\*/g, '') // Remove negrito
            .replace(/\*/g, '')   // Remove itálico ou bullets
            .replace(/#/g, '')    // Remove headers
            .replace(/^[-•]\s+/gm, '') // Remove bullets no início da linha
            .trim();
    };

    // --- ESTADOS PARA COMPARAÇÃO ---
    const [compareAiRatingData, setCompareAiRatingData] = useState<any>(null);
    const [compareAiSentiment, setCompareAiSentiment] = useState<any>(null);

    // Función para buscar a nota baseada no relatório e indicadores
    const fetchFundamentalRating = async (targetAsset = asset, isComparison = false) => {
        if (!targetAsset?.ticker) return;

        // 1. Obtiene el contenido bruto de donde esté disponible
        const rawReport = isComparison
            ? (targetAsset.fullReport || `Análise de mercado para ${targetAsset.ticker}`)
            : (htmlReport || targetAsset?.fullReport || (window as any).currentReportText);

        if (!rawReport || rawReport.includes("Nenhum relatório especializado encontrado")) {
            if (!isComparison) return;
        }

        let cleanTextForAI = rawReport;
        if (rawReport.includes("<div") || rawReport.includes("<p>")) {
            const tmp = document.createElement("div");
            tmp.innerHTML = rawReport;
            cleanTextForAI = tmp.innerText || tmp.textContent || "";
        }

        cleanTextForAI = cleanTextForAI.substring(0, 3000);

        const safeKnowledge = typeof LUCAS_KNOWLEDGE === 'string'
            ? LUCAS_KNOWLEDGE.substring(0, 15000)
            : "";

        const cacheKey = `ai_rating_${targetAsset.ticker}`;
        const cachedDataStr = localStorage.getItem(cacheKey);

        if (cachedDataStr) {
            try {
                const cachedData = JSON.parse(cachedDataStr);
                // Lê do formato unificado (score e verdict na raiz)
                const score = cachedData.score ?? cachedData.data?.score;
                
                if (score !== undefined) {
                    const summary = cachedData.summary ?? cachedData.data?.summary ?? "";
                    const pillars = cachedData.pillars ?? cachedData.data?.pillars ?? [];
                    
                    // Se o cache for antigo e não tiver a tese (summary) ou os pilares, precisamos ignorar e buscar de novo
                    if (!summary || pillars.length === 0) {
                        console.log(`⚠️ Cache incompleto (sem tese/pilares) para ${targetAsset.ticker}. Forçando re-análise...`);
                    } else {
                        console.log(`⚡ Carregando análise do cache para: ${targetAsset.ticker}`);
                        const standardizedData = {
                            score: score,
                            verdict: cachedData.verdict ?? cachedData.data?.verdict ?? "",
                            summary: summary,
                            pillars: pillars,
                            lastUpdate: cachedData.lastUpdate ?? Date.now()
                        };
                        if (isComparison) {
                            setCompareAiRatingData(standardizedData);
                        } else {
                            setAiRatingData(standardizedData);
                            setInvestorThesis(cleanAIText(summary));
                        }
                        return; // Só retorna cedo se o cache estiver PERFEITO
                    }
                }
            } catch (e) {
                console.error("Erro ao ler cache do Agente", e);
            }
        }
        // ==========================================

        if (lastAnalyzedTicker === asset?.ticker && aiRatingData) {
            return;
        }

        setIsRatingLoading(true);
        try {
            console.log(`🚀 Iniciando Deep Research na API para: ${asset.ticker}`);

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: asset.ticker,
                    report: cleanTextForAI,
                    systemInstruction: safeKnowledge, // Enviamos a base reduzida
                    isRatingRequest: true
                }),
            });

            // Verificar si la ruta /api/chat dio un error (ej: 500 o 413)
            if (!response.ok) {
                throw new Error(`Error del servidor: código ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ Respuesta de la IA:", data);

            if (data && data.score !== undefined) {
                const finalScore = data.score <= 1 && data.score > 0 ? data.score * 10 : data.score;
                
                // --- LÓGICA ROBUSTA DE EXTRAÇÃO DE TESE (DESTRAVADA) ---
                let extractedSummary = data.summary || "";
                
                if (!extractedSummary || extractedSummary.length < 30) {
                    const markers = [
                        /Tese de Investimento:/i, 
                        /Perspectiva do Analista:/i, 
                        /Conclusão:/i, 
                        /Análise do Fundo:/i,
                        /Relatório Imobiliário:/i,
                        /Portfólio e Vacância:/i,
                        /Distribuição:/i,
                        /Veredito:/i
                    ];
                    
                    for (const marker of markers) {
                        const match = cleanTextForAI.match(marker);
                        if (match) {
                            const part = cleanTextForAI.split(match[0])[1];
                            extractedSummary = part.split("\n\n")[0].trim();
                            if (extractedSummary.length > 30) break;
                        }
                    }
                }
                
                // Fallback Inteligente: Pega os primeiros 2 parágrafos significativos do relatório
                if (!extractedSummary || extractedSummary.length < 30) {
                    const paragraphs = cleanTextForAI.split('\n')
                        .map((p: string) => p.trim())
                        .filter((p: string) => p.length > 50 && !p.includes('<') && !p.includes('>'));
                    
                    if (paragraphs.length > 0) {
                        extractedSummary = paragraphs.slice(0, 2).join('\n\n');
                    }
                }

                // Fallback final: Primeiros 300-500 caracteres
                if (!extractedSummary || extractedSummary.length < 10) {
                    extractedSummary = cleanTextForAI.substring(0, 500).trim() + "...";
                }

                const finalRatingData = {
                    score: finalScore,
                    verdict: data.verdict || "ANÁLISE CONCLUÍDA",
                    summary: extractedSummary,
                    pillars: data.pillars || [],
                    fiiMetrics: data.fiiMetrics || null,
                    cryptoMetrics: data.cryptoMetrics || null,
                    lastUpdate: Date.now()
                };

                // Atualiza a tela
                setAiRatingData(finalRatingData);
                setInvestorThesis(cleanAIText(extractedSummary));
                setLastAnalyzedTicker(asset.ticker);

                // 💾 SALVA O RESULTADO NO CACHE UNIFICADO
                localStorage.setItem(cacheKey, JSON.stringify({
                    score: finalRatingData.score,
                    verdict: finalRatingData.verdict,
                    summary: finalRatingData.summary,
                    pillars: finalRatingData.pillars,
                    fiiMetrics: finalRatingData.fiiMetrics,
                    cryptoMetrics: finalRatingData.cryptoMetrics,
                    lastUpdate: finalRatingData.lastUpdate
                }));
            }
        } catch (error) {
            console.error("❌ Error en el Agente (probablemente falla de API):", error);
        } finally {
            setIsRatingLoading(false);
        }
    };

    // O TRIGGER CORRETO: Adicionamos o htmlReport na lista de dependências
    useEffect(() => {
        // Só dispara se já tivermos carregado o ativo e tentado buscar o htmlReport
        if (asset?.ticker) {
            fetchFundamentalRating();
        }
    }, [asset?.ticker, asset?.fullReport, htmlReport]);

    // Função que será chamada após o Relatório 360 ser gerado (Simulação)
    const generateAIRating = (solidityScore: number) => {
        // Simulação de resposta da IA:
        // A nota é baseada no solidityScore (0-100 -> 0-10) com uma variação aleatória de realismo
        const baseNote = solidityScore / 10;
        const randomVariation = (Math.random() * 1.4 - 0.7); // Variação de +/- 0.7
        const finalNote = Math.max(0, Math.min(10, baseNote + randomVariation));

        setAiRating(parseFloat(finalNote.toFixed(1)));
        setAiReview("Avaliação técnica processada via IA com base no fluxo de caixa, resiliência setorial e métricas de valuation Graham/Bazin.");
    };

    // Verifica se já existe um alerta para este ticker ao abrir a página
    useEffect(() => {
        const savedAlerts = JSON.parse(localStorage.getItem('user_alerts') || '{}');
        if (savedAlerts[ticker]) {
            setHasAlert(true);
            setAlertPrice(savedAlerts[ticker].targetPrice);
        }
    }, [ticker]);

    // Função para pedir permissão de notificações no navegador
    const requestNotificationPermission = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        return false;
    };

    // --- ESTADOS DA IA (RESUMO E SAÚDE) ---
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [aiHealth, setAiHealth] = useState<any>(null);
    const [isLoadingHealth, setIsLoadingHealth] = useState(false);
    const [aiSentiment, setAiSentiment] = useState<any>({ value: 50, label: "Neutro", trend: "side" });


    // 1. FUNÇÃO: GERAR RESUMO (BULL/BEAR CASE)
    const fetchAiAnalysis = async () => {
        if (!asset || !asset.ticker) return;
        setIsLoadingAnalysis(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: asset.ticker,
                    name: asset.name,
                    // Se não houver relatório, envia uma string padrão para a IA saber do que se trata
                    report: asset.fullReport || `Análise de mercado para ${asset.name} (${asset.ticker})`,
                    isSummary: true
                }),
            });
            const data = await res.json();
            let finalData = data.reply ? (typeof data.reply === "string" ? JSON.parse(data.reply) : data.reply) : data;
            setAiAnalysis(finalData);
        } catch (e) {
            console.error("Erro no resumo:", e);
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    // 2. FUNÇÃO: SENTIMENTO DO MERCADO (COM CACHE SEMANAL)
    const fetchMarketSentiment = async (targetAsset = asset, isComparison = false) => {
        if (!targetAsset || !targetAsset.ticker) return;

        const cacheKey = `sentiment_cache_${targetAsset.ticker}`;
        const cachedStr = localStorage.getItem(cacheKey);
        const now = new Date();
        const isMonday = now.getDay() === 1;

        if (cachedStr) {
            try {
                const cachedData = JSON.parse(cachedStr);
                const lastUpdate = new Date(cachedData.lastUpdate);
                const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

                const shouldUpdate = (isMonday && lastUpdate.toDateString() !== now.toDateString()) || diffDays >= 7;

                if (!shouldUpdate) {
                    console.log(`📡 Usando cache semanal para ${targetAsset.ticker}`);
                    if (isComparison) setCompareAiSentiment(cachedData);
                    else setAiSentiment(cachedData);
                    return;
                }
            } catch (e) {
                console.error("Erro ao ler cache de sentimento:", e);
            }
        }

        try {
            console.log(`🚀 Buscando nova análise semanal para ${targetAsset.ticker}`);
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: targetAsset.ticker,
                    name: targetAsset.name,
                    report: targetAsset.fullReport || `Esta é uma análise para a SEMANA para ${targetAsset.name}. Forneça uma visão do sentimento predominante para os próximos 7 dias baseada no fechamento da semana anterior. Considere volatilidade e medo. Se o fundamento for bom mas o mercado estiver em queda, o value deve refletir o MEDO, não a nota técnica.`,
                    isSentiment: true
                }),
            });
            const data = await res.json();
            let finalData = data.reply ? (typeof data.reply === "string" ? JSON.parse(data.reply) : data.reply) : data;

            const sentimentWithDate = { ...finalData, lastUpdate: now.toISOString() };
            localStorage.setItem(cacheKey, JSON.stringify(sentimentWithDate));

            if (isComparison) setCompareAiSentiment(sentimentWithDate);
            else setAiSentiment(sentimentWithDate);
        } catch (e) {
            console.error("Erro no sentimento:", e);
        }
    };


    // 3. FUNÇÃO: SAÚDE E VALOR JUSTO (CORRIGIDA COM MAPEAMENTO)
    const fetchAiHealth = async () => {
        if (!asset || !asset.ticker) return;
        setIsLoadingHealth(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: asset.ticker,
                    name: asset.name,
                    price: asset.price,
                    report: asset.fullReport || `Saúde financeira para ${asset.name} (${asset.ticker})`,
                    isHealth: true
                }),
            });
            const data = await res.json();
            let finalData = data.reply ? (typeof data.reply === "string" ? JSON.parse(data.reply) : data.reply) : data;

            // MAPEAMENTO DE SEGURANÇA: Garante que os valores apareçam mesmo com nomes de campos variados
            if (finalData && typeof finalData === "object") {
                finalData.pl = finalData.pl || finalData.p_l || finalData.pe_ratio || 0;
                finalData.dcf = finalData.dcf || finalData.fair_value || finalData.valor_justo || 0;
                finalData.graham = finalData.graham || finalData.graham_number || finalData.valor_graham || 0;
                finalData.bazin = finalData.bazin || finalData.bazin_value || 0; // Novo mapeamento
            }

            setAiHealth(finalData);
        } catch (e) {
            console.error("Erro na saúde financeira:", e);
        } finally {
            setIsLoadingHealth(false);
        }
    };


    // 4. ÚNICO EFFECT PARA DISPARAR TUDO (APAGUE OS DOIS ANTERIORES)
    useEffect(() => {
        // Dispara se houver um ticker, independente de ter relatório manual ou não
        if (asset?.ticker) {
            fetchAiAnalysis();
            fetchAiHealth();
            fetchMarketSentiment();
        }
    }, [asset?.ticker]); // Mudança crucial: depende apenas do ticker

    // Verifica se o ticker já está na watchlist ao carregar
    useEffect(() => {
        if (!ticker) return;
        const savedWatchlist = JSON.parse(localStorage.getItem('user_watchlist') || '[]');
        setIsInWatchlist(savedWatchlist.includes(ticker.toUpperCase()));
    }, [ticker]);

    // Automatização da busca de relatórios HTML via Ticker
    useEffect(() => {
        // Só tenta buscar se tiver um ticker válido
        if (!ticker) return;

        const fetchReport = async () => {
            try {
                // 💡 Remove o ".SA" se ele existir no ticker para buscar o arquivo correto
                const tickerLimpo = ticker.replace('.SA', '');

                // Agora ele vai buscar "/reports/BPAC3.html" em vez de "/reports/BPAC3.SA.html"
                let response = await fetch(`/reports/${tickerLimpo}.html`);

                // Se não encontrar o .html, tenta o .htm (ex: TSLA.htm)
                if (!response.ok) {
                    response = await fetch(`/reports/${tickerLimpo}.htm`);
                }

                if (response.ok) {
                    const lastModified = response.headers.get('Last-Modified');
                    if (lastModified) {
                        const date = new Date(lastModified);
                        const formattedDate = date.toLocaleDateString('pt-BR');
                        setReportDate(formattedDate);
                    }
                    const htmlText = await response.text();

                    // Parser para limpar o CSS indesejado (que fizemos na etapa anterior)
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlText, 'text/html');

                    const styles = doc.querySelectorAll('style');
                    styles.forEach(style => style.remove());

                    const cleanHtml = doc.body.innerHTML;

                    setHtmlReport(cleanHtml);
                } else {
                    setHtmlReport(`<p class="text-slate-400 italic">Nenhum relatório especializado encontrado para ${tickerLimpo} no momento.</p>`);
                }
            } catch (error) {
                console.error("Erro ao carregar o relatório:", error);
                setHtmlReport(`<p class="text-red-400">Erro ao carregar o relatório.</p>`);
            }
        };

        fetchReport();
    }, [ticker]);


    // 4. FUNÇÃO DO CHAT
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoadingChat) return;
        const userMsg = chatInput;
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setChatInput("");
        setIsLoadingChat(true);

        // 🔥 PEGA O RELATÓRIO COMPLETO (E LIMPA HTML SE NECESSÁRIO)
        const rawReport = htmlReport || asset?.fullReport || "";
        let cleanReport = rawReport;
        if (rawReport.includes("<div") || rawReport.includes("<p>")) {
            const tmp = document.createElement("div");
            tmp.innerHTML = rawReport;
            cleanReport = tmp.innerText || tmp.textContent || "";
        }
        // Limite de segurança para Context Window
        cleanReport = cleanReport.substring(0, 5000);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userMsg,
                    ticker: asset.ticker,
                    name: asset.name,
                    report: cleanReport,
                    indicators: {
                        price: asset.price,
                        variation: asset.variation,
                        sector: asset.sector,
                        isCrypto: asset.isCrypto,
                        roe: asset?.fundamentalData?.roe,
                        pvp: asset?.fundamentalData?.pvp,
                        pl: asset?.fundamentalData?.pl,
                        dy: asset?.fundamentalData?.dy,
                        graham: asset?.valuation?.graham,
                        bazin: asset?.valuation?.bazin,
                        currency: asset.currency,
                        score: aiRatingData?.score,
                        verdict: aiRatingData?.verdict
                    }
                })
            });
            const data = await res.json();
            if (data.reply) setMessages((prev) => [...prev, { role: "ia", text: data.reply }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "ia", text: "Erro ao conectar à IA." }]);
        } finally {
            setIsLoadingChat(false);
        }
    };

    const handleToggleWatchlist = () => {
        const savedWatchlist = JSON.parse(localStorage.getItem('user_watchlist') || '[]');
        const upperTicker = ticker.toUpperCase();
        let newList;

        if (isInWatchlist) {
            // LÓGICA DE REMOÇÃO
            newList = savedWatchlist.filter((t: string) => t !== upperTicker);
            setIsInWatchlist(false);
            setModalConfig({
                title: "Removido!",
                message: `${ticker} saiu da sua lista.`,
                icon: "delete_sweep"
            });
        } else {
            // LÓGICA DE ADIÇÃO
            newList = [...savedWatchlist, upperTicker];
            setIsInWatchlist(true);
            setModalConfig({
                title: "Sucesso!",
                message: `${ticker} foi adicionado ao portfólio.`,
                icon: "check_circle"
            });
        }

        localStorage.setItem('user_watchlist', JSON.stringify(newList));

        // Exibe o modal e fecha após 2 segundos
        setShowModal(true);
        setTimeout(() => {
            setShowModal(false);
            // Só redireciona se for uma ADIÇÃO. Se for remoção, continua na página.
            if (!isInWatchlist) window.location.href = '/portfolio';
        }, 2000);
    };

    const handleSaveAlert = async () => {
        // 1. Pede permissão para o navegador
        await requestNotificationPermission();

        const savedAlerts = JSON.parse(localStorage.getItem('user_alerts') || '{}');

        savedAlerts[ticker] = {
            targetPrice: parseFloat(alertPrice),
            sendReport: alertReport,
            method: alertMethod,
            userEmail: "utilizador@exemplo.com", // Aqui deve vir o e-mail do seu sistema de Auth
            active: true
        };

        localStorage.setItem('user_alerts', JSON.stringify(savedAlerts));

        // 2. Muda o estado visual
        setHasAlert(true);
        setShowAlertModal(false);

        // 3. Feedback visual
        setModalConfig({
            title: "Alerta Ativado!",
            message: `Monitorizando ${ticker} até R$ ${alertPrice}`,
            icon: "notifications_active"
        });
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2500);
    };

    const handleInputChange = (value: string) => {
        const upperValue = value.toUpperCase();
        setCompareTicker(upperValue);

        if (upperValue.length > 1) {
            // Filtra no assetsDatabase (que você já importou lá no topo do arquivo)
            const filtered = assetsDatabase.filter(asset =>
                asset.ticker.includes(upperValue) ||
                asset.name.toUpperCase().includes(upperValue)
            ).slice(0, 5); // Mostra apenas as 5 primeiras sugestões

            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleCompare = async () => {
        // 1. Verifica se o campo está vazio
        if (!compareTicker.trim()) {
            alert("Por favor, digite um ticker (Ex: PETR4)");
            return;
        }

        setIsComparing(true);
        console.log("🚀 Iniciando comparação para:", compareTicker);

        try {
            // 2. Formatação inteligente do Ticker
            let cleanTicker = compareTicker.trim().toUpperCase();
            const isB3 = /^[A-Z]{4}\d{1,2}$/.test(cleanTicker);
            const tickerWithSuffix = isB3 && !cleanTicker.includes(".SA")
                ? `${cleanTicker}.SA`
                : cleanTicker;

            console.log("🔍 Buscando na API:", `/api/quote?ticker=${tickerWithSuffix}`);

            const res = await fetch(`/api/quote?ticker=${tickerWithSuffix}`);
            const data = await res.json();

            // 3. Verifica se a API retornou erro (conforme o seu route.ts)
            if (data.name?.includes("ERRO")) {
                alert("Ativo não encontrado. Verifique se o ticker está correto.");
                setCompareAsset(null);
            } else {
                console.log("✅ Dados recebidos:", data);
                setCompareAsset(data);
                // 🔥 DISPARA ANÁLISE DE IA PARA O ATIVO COMPARADO
                fetchFundamentalRating(data, true);
                fetchMarketSentiment(data, true);
            }
        } catch (err) {
            console.error("❌ Erro fatal na busca:", err);
            alert("Erro de conexão com o servidor.");
        } finally {
            setIsComparing(false);
        }
    };

    const fetchAssetData = async () => {
        setStatus("loading");
        try {
            // --- LIMPEZA DE TICKER INTELIGENTE ---
            let cleanTicker = ticker;
            if (ticker.includes('(') && ticker.includes(')')) {
                // Pega o que está dentro do último parênteses (ex: "Prio S.A.(PRIO3)" -> "PRIO3")
                const parts = ticker.split('(');
                const lastPart = parts[parts.length - 1];
                cleanTicker = lastPart.split(')')[0];
            }
            cleanTicker = cleanTicker.split('.')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
            const baseTicker = cleanTicker;

            // 1. Localizar o ativo no assetsDatabase primeiro
            const localAsset = assetsDatabase.find(a => {
                const dbTicker = (a.ticker || "").toUpperCase().replace('.SA', '').trim();
                const normalizedDbTicker = dbTicker.replace(/[^a-zA-Z0-9]/g, '');
                return dbTicker === baseTicker || cleanTicker.includes(normalizedDbTicker) || normalizedDbTicker.includes(cleanTicker);
            });

            const isCryptoLocal = !!localAsset?.cgId || cleanTicker.endsWith("USD") || cleanTicker.includes("BTC") || cleanTicker.includes("ETH");
            const isUS = localAsset?.exchange === "NASDAQ" || localAsset?.exchange === "NYSE";
            let assetPrice = "N/D";
            let assetVariation = "0";
            let assetCurrency = isUS ? "$" : "R$";
            let assetName = localAsset?.name || cleanTicker;
            let yahooData: any = {};

            // 2. Mapeamento Inteligente de Ativo
            const KNOWN_CRYPTO_IDS: Record<string, string> = {
                'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
                'XRP': 'ripple', 'ADA': 'cardano', 'DOT': 'polkadot',
                'LINK': 'chainlink', 'ONDO': 'ondo-finance', 'AVAX': 'avalanche-2',
                'MATIC': 'matic-network', 'ARB': 'arbitrum', 'OP': 'optimism',
                'ATOM': 'cosmos', 'UNI': 'uniswap', 'LTC': 'litecoin',
                'DOGE': 'dogecoin', 'SHIB': 'shiba-inu',
            };

            const isCrypto = KNOWN_CRYPTO_IDS[baseTicker] || isCryptoLocal;

            try {
                if (isCrypto) {
                    const cgId = KNOWN_CRYPTO_IDS[baseTicker] || localAsset?.cgId;
                    if (cgId) {
                        const cgRes = await fetch(`/api/coingecko?endpoint=simple/price&ids=${cgId}&vs_currencies=brl&include_24hr_change=true`);
                        const cgData = await cgRes.json();
                        if (cgData[cgId] && cgData[cgId].brl) {
                            assetPrice = cgData[cgId].brl.toFixed(2);
                            assetVariation = cgData[cgId].brl_24h_change?.toFixed(2) || "0.00";
                            assetCurrency = "R$";
                        }
                    }
                } else {
                    const queryTicker = (isUS || ticker.includes(".SA")) ? ticker : `${ticker}.SA`;
                    const res = await fetch(`/api/quote?ticker=${queryTicker}`);
                    yahooData = await res.json();

                    if (!yahooData.name?.includes("ERRO")) {
                        const pNum = parseFloat(yahooData.price) || 0;
                        assetPrice = pNum > 0 ? pNum.toFixed(2) : "0.00";
                        assetVariation = yahooData.variation || "0.00";
                        assetName = yahooData.name || assetName;
                        assetCurrency = isUS ? "$" : "R$";
                    }
                }
            } catch (err) {
                console.error("Erro na busca de preço inteligente:", err);
            }

            const priceNum = parseFloat(assetPrice) || 0;

            if (yahooData.name?.includes("ERRO")) {
                throw new Error(yahooData.name);
            }

            // --- LÓGICA DE VERIFICAÇÃO DE PREÇO ---
            const currentPrice = parseFloat(assetPrice);
            const savedAlerts = JSON.parse(localStorage.getItem('user_alerts') || '{}');
            const myAlert = savedAlerts[ticker];

            if (myAlert && myAlert.active && currentPrice <= myAlert.targetPrice) {
                // Atingiu o preço!

                // A. Notificação no Navegador
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    new Notification(`Alerta de Preço: ${ticker}`, {
                        body: `${ticker} atingiu R$ ${currentPrice}! Hora de agir.`,
                        icon: "/favicon.ico"
                    });
                }

                // B. Notificação por E-mail (Chama uma API)
                if (myAlert.method === 'email' || myAlert.method === 'telegram') {
                    fetch('/api/send-alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ticker,
                            price: currentPrice,
                            email: myAlert.userEmail,
                            method: myAlert.method
                        })
                    });
                }

                // Desativa o alerta para não repetir infinitamente
                myAlert.active = false;
                localStorage.setItem('user_alerts', JSON.stringify(savedAlerts));
                setHasAlert(false);
            }

            // 4. VALIDAR DADOS FUNDAMENTAIS VINDOS DO route.ts
            const validateMath = (val: any) => {
                const num = parseFloat(val);
                return (!isFinite(num) || isNaN(num)) ? 0 : num;
            };

            const lpa = validateMath(yahooData.lpa);
            const vpa = validateMath(yahooData.vpa);

            // Recalcula P/L e P/VP com o preço em tempo real para maior precisão
            const finalPL = (lpa > 0 && priceNum > 0) ? (priceNum / lpa) : validateMath(yahooData.p_l);
            const finalPVP = validateMath(yahooData.priceToBook) || (vpa > 0 && priceNum > 0 ? (priceNum / vpa) : 0);
            const finalDY = validateMath(yahooData.dy);
            const finalROE = validateMath(yahooData.roe);
            const finalMargin = validateMath(yahooData.financialData?.profitMargins * 100 || 0);
            const finalDebtEquity = validateMath(yahooData.financialData?.debtToEquity || 0);
            const finalTotalCotas = yahooData.defaultKeyStatistics?.sharesOutstanding || 0;
            const finalPatrimonioLiq = yahooData.defaultKeyStatistics?.netAssets || yahooData.summaryDetail?.totalAssets || 0;

            // 5. VALUATION: FÓRMULAS DE GRAHAM E BAZIN
            let grahamValue = 0;
            if (lpa > 0 && vpa > 0) {
                // Fórmula de Graham: Raiz quadrada de (22.5 * LPA * VPA)
                grahamValue = Math.sqrt(22.5 * lpa * vpa);
            }

            let bazinValue = 0;
            if (finalDY > 0 && priceNum > 0) {
                // Descobre quanto pagou de dividendo em R$ e divide por 6% (0.06)
                const dividendoAnualEmReais = (finalDY / 100) * priceNum;
                bazinValue = dividendoAnualEmReais / 0.06;
            }

            const grahamUpside = (grahamValue > 0 && priceNum > 0) ? ((grahamValue / priceNum) - 1) * 100 : 0;
            const bazinUpside = (bazinValue > 0 && priceNum > 0) ? ((bazinValue / priceNum) - 1) * 100 : 0;

            // 6. ATUALIZAR OS ESTADOS DA TELA
            const manualReport = localAsset?.fullReport || (localAsset as any)?.report || (localAsset as any)?.description || (localAsset as any)?.descricao;
            const domainMap: { [key: string]: string } = { "PETR4": "petrobras.com.br", "AAPL": "apple.com", "VALE3": "vale.com" };
            const domain = domainMap[baseTicker] || `${baseTicker.toLowerCase()}.com.br`;
            const assetLogo = localAsset?.logo || `https://logo.clearbit.com/${domain}`;
            const fallbackLogo = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

            const newAssetData = {
                ticker: cleanTicker,
                name: assetName,
                price: assetPrice,
                variation: assetVariation,
                currency: assetCurrency,
                logo: assetLogo,
                fallbackLogo: fallbackLogo,
                sector: localAsset?.sector || (isCryptoLocal ? "Criptomoedas" : "Setor Não Definido"),
                exchange: isUS ? localAsset?.exchange || "US Market" : "B3",
                isCrypto: isCryptoLocal,
                dataSource: "Yahoo Finance",
                marketCap: localAsset?.marketCap || yahooData?.marketCap || "--",
                vacancia: localAsset?.vacancia || (localAsset as any)?.vacancy || "--",
                sharesOutstanding: finalTotalCotas,
                netAssets: yahooData.totalAssets || finalPatrimonioLiq || (localAsset as any)?.netAssets || 0,
                avgVolume: yahooData.avgVolume || 0,
                taxaAdm: localAsset?.taxaAdm || localAsset?.expenseRatio || "",
                benchmark: localAsset?.benchmark || "",
                aiPulse: localAsset?.aiPulse || "",
                fullReport: manualReport || `Preço: ${assetPrice} | LPA: ${lpa || 'N/D'} | VPA: ${vpa || 'N/D'} | P/L: ${finalPL || 'N/D'} | P/VP: ${finalPVP || 'N/D'} | ROE: ${finalROE}% | DY: ${finalDY}%`,
                fundamentalData: {
                    pl: finalPL,
                    pvp: finalPVP,
                    dy: finalDY,
                    roe: finalROE,
                    lpa: lpa,
                    vpa: vpa,
                    margin: finalMargin,
                    debt_equity: finalDebtEquity,
                    totalCotas: finalTotalCotas,
                    patrimonioLiq: finalPatrimonioLiq
                },
                valuation: {
                    graham: grahamValue,
                    grahamUpside: grahamUpside,
                    bazin: bazinValue,
                    bazinUpside: bazinUpside
                }
            };

            setAsset((prev: any) => ({
                ...prev,
                ...newAssetData
            }));

            setStatus("success");
            // Gera o Rating da IA após carregar os dados
            generateAIRating(calculateSolidityScore(newAssetData));
        } catch (e) {
            console.error("Erro ao carregar ativo:", e);
            setStatus("error");
        }
    };
    // 4. Atualizar o useEffect para disparar esta nova função
    useEffect(() => {
        if (ticker) {
            fetchAssetData();
        }
    }, [ticker]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-dark text-primary">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined animate-spin text-4xl">autorenew</span>
                    <span className="text-sm font-medium text-slate-400">A carregar {ticker || "dados"}...</span>
                </div>
            </div>
        );
    }

    if (status === "error" || !asset) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background-dark text-white space-y-4">
                <span className="material-symbols-outlined text-6xl text-primary">search_off</span>
                <h1 className="text-5xl font-black text-primary">404</h1>
                <p className="text-slate-400 text-lg">Ativo <strong className="text-white">{ticker || "desconhecido"}</strong> não encontrado.</p>
                <p className="text-slate-500 text-sm">Tente: <span className="text-primary font-mono">PETR4</span>, <span className="text-primary font-mono">AAPL</span>, <span className="text-primary font-mono">VALE3</span></p>
                <button onClick={() => window.history.back()} className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-primary hover:text-black font-bold rounded-lg text-sm transition-colors">
                    Voltar
                </button>
            </div>
        );
    }

    const isPositive = parseFloat(asset.variation || "0") >= 0;
    const currency = asset.currency || "$";
    const solidityScore = calculateSolidityScore(asset);
    const isPulseOnline = asset?.isCrypto ? true : marketStatus?.isOpen;

    // 1. Identificando quem é o ativo
    const assetTicker = asset?.ticker?.toUpperCase() || "";
    const isETFAsset = asset?.type === "ETFs" || asset?.sector === "ETF";
    const isFIIAsset = !isETFAsset && (asset?.type === "FIIs" || asset?.sector === "Fundos Imobiliários" || assetTicker.endsWith("11") || assetTicker.endsWith("11.SA"));
    const isCryptoAsset = !isFIIAsset && !isETFAsset && (asset?.isCrypto || assetTicker.includes("BTC") || assetTicker.includes("USD"));
    const isBrazilianAsset = !isCryptoAsset && !isFIIAsset && !isETFAsset && (/[0-9]+$/.test(assetTicker) || assetTicker.includes(".SA"));
    const isUSAsset = !isCryptoAsset && !isBrazilianAsset && !isFIIAsset && !isETFAsset;

    // 2. Definindo o rótulo da Bolsa
    const marketLabel = isCryptoAsset
        ? "Binance / Coinbase"
        : isBrazilianAsset
            ? "B3"
            : "NASDAQ / NYSE";

    // 3. Função inteligente de formatação de moeda
    const formatValue = (value: number | string) => {
        if (value === "N/D" || value === null || value === undefined) return "N/A";
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
        if (isNaN(numValue)) return "0.00";
        
        // Moeda dinâmica baseada no ativo carregado
        const currencyType = asset.currency === '$' ? 'USD' : 'BRL';
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currencyType,
            minimumFractionDigits: 2
        }).format(numValue);
    };

    const formatCompactNumber = (value: number) => {
        if (!value || value === 0) return "--";
        const symbol = asset.currency || "R$";
        if (value >= 1e12) return `${symbol} ${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9) return `${symbol} ${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${symbol} ${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${symbol} ${(value / 1e3).toFixed(1)}K`;
        return `${symbol} ${value.toFixed(2)}`;
    };



    return (
        <div className="flex h-screen w-full flex-col bg-background-dark text-slate-100 font-display overflow-x-hidden antialiased">
            <Header currentPath="/mercado" />

            <div className="flex flex-1 overflow-hidden">

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-background-dark p-4 md:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">

                        {/* CARD DO ATIVO — idêntico ao ativos.html */}
                        <div className="rounded-xl border border-border-dark bg-card-dark p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden shadow-sm border border-border-dark">
                                        <img
                                            src={asset.logo || `https://ui-avatars.com/api/?name=${asset.ticker}&background=334155&color=fff&bold=true`}
                                            alt={asset.ticker}
                                            className="h-12 w-12 object-cover"
                                            onError={(e) => {
                                                // Se a logo oficial falhar, troca pelo avatar com as iniciais do Ticker
                                                e.currentTarget.onerror = null; // Previne loop infinito
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.ticker}&background=334155&color=fff&bold=true`;
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                            {asset.name}
                                            <span className="text-slate-400 font-medium text-xl ml-1">({asset.ticker})</span>
                                        </h1>
                                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                            <span className="bg-background-dark border border-border-dark px-2 py-0.5 rounded text-xs text-primary font-semibold">
                                                {asset?.sector || (isCryptoAsset ? "Criptomoedas" : "Setor Não Definido")}
                                            </span>
                                            <span>•</span>
                                            <span className="font-bold text-slate-300">{marketLabel}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-bold text-white">
                                            {formatValue(asset.price)}
                                        </span>
                                        <span className={`flex items-center font-bold px-2 py-0.5 rounded text-sm border ${isPositive ? "text-primary bg-primary/10 border-primary/20" : "text-accent-red bg-accent-red/10 border-accent-red/20"}`}>
                                            <span className="material-symbols-outlined text-sm mr-1">{isPositive ? "arrow_upward" : "arrow_downward"}</span>
                                            {asset.variation}%
                                        </span>
                                    </div>
                                    <span className="text-green-500 text-xs font-bold">
                                        🟢 Online • {asset?.dataSource || "Yahoo Finance"}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border-dark pt-4">
                                <button
                                    onClick={handleToggleWatchlist}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer text-sm ${isInWatchlist
                                        ? "bg-zinc-800 text-red-500 border border-red-500/30 hover:bg-red-500/10"
                                        : "bg-primary hover:bg-primary-hover text-black"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {isInWatchlist ? "delete" : "add"}
                                    </span>
                                    {isInWatchlist ? "Remover da Lista" : "Adicionar à Lista"}
                                </button>
                                <button
                                    onClick={() => setShowAlertModal(true)}
                                    disabled={hasAlert}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer text-sm border ${hasAlert
                                        ? "bg-primary/10 text-primary border-primary/30 opacity-80"
                                        : "bg-zinc-800 text-slate-300 border-zinc-700 hover:bg-zinc-700"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {hasAlert ? "notifications_active" : "notifications"}
                                    </span>
                                    {hasAlert ? "Alerta Definido" : "Definir Alerta"}
                                </button>
                                <button
                                    onClick={() => setShowCompareModal(true)}
                                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-lg">compare_arrows</span> Comparar
                                </button>
                            </div>
                        </div>

                        {/* GRID 12 COLUNAS — idêntico ao ativos.html */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* COLUNA ESQUERDA (8) */}
                            <div className="col-span-12 lg:col-span-8 space-y-6">

                                {/* RESUMO IA */}
                                <section className="rounded-xl border border-border-dark bg-card-dark overflow-hidden">
                                    <div className="border-b border-border-dark bg-zinc-900/50 px-6 py-4 flex justify-between items-center">
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                                            <span className="material-symbols-outlined text-primary">psychology</span> Resumo Executivo de IA
                                        </h3>
                                        {isLoadingAnalysis ? (
                                            <span className="text-xs text-zinc-500 animate-pulse">IA está analisando...</span>
                                        ) : (
                                            <span className="text-xs text-zinc-500">
                                                {asset.lastUpdate ? `Última atualização: ${new Date(asset.lastUpdate).toLocaleDateString('pt-BR')}` : "Atualizado semanalmente"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-dark">
                                        {/* Lado Otimista */}
                                        <div className="p-6 space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Por que investir? (Cenário Otimista)</h4>

                                            {isLoadingAnalysis ? (
                                                <div className="space-y-4 animate-pulse">
                                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-lg"></div>)}
                                                </div>
                                            ) : (
                                                aiAnalysis && Array.isArray(aiAnalysis.bullCase) ? (
                                                    aiAnalysis.bullCase.slice(0, 3).map((item: any, i: number) => (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="flex-none pt-1">
                                                                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                                            </div>
                                                            <div>
                                                                <h5 className="text-white font-medium text-sm">{item.title}</h5>
                                                                <p className="text-slate-400 text-sm leading-relaxed mt-1">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-zinc-500 text-sm italic p-4">
                                                        {isLoadingAnalysis ? "Gerando análise..." : "Análise indisponível no momento."}
                                                    </p>
                                                )
                                            )}
                                        </div>

                                        {/* Lado Pessimista */}
                                        <div className="p-6 space-y-4 bg-zinc-900/30">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-accent-orange mb-4">Principais Riscos (Cenário Pessimista)</h4>

                                            {isLoadingAnalysis ? (
                                                <div className="space-y-4 animate-pulse">
                                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-lg"></div>)}
                                                </div>
                                            ) : (
                                                aiAnalysis && Array.isArray(aiAnalysis.bearCase) ? (
                                                    aiAnalysis.bearCase.slice(0, 3).map((item: any, i: number) => (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="flex-none pt-1">
                                                                <span className="material-symbols-outlined text-accent-orange text-xl">warning</span>
                                                            </div>
                                                            <div>
                                                                <h5 className="text-white font-medium text-sm">{item.title}</h5>
                                                                <p className="text-slate-400 text-sm leading-relaxed mt-1">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-zinc-500 text-sm italic p-4">Aguardando riscos...</p>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* SAÚDE FUNDAMENTAL + VALOR JUSTO */}
                                <div className="grid md:grid-cols-2 gap-6">

                                    {/* SAÚDE FUNDAMENTAL / MÉTRICAS ON-CHAIN */}
                                    <section className="rounded-xl border border-border-dark bg-card-dark p-6">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-400">
                                                {isETFAsset ? 'layers' : isFIIAsset ? 'domain' : isCryptoAsset ? 'hub' : 'fitness_center'}
                                            </span>
                                            {isETFAsset ? 'Métricas de Fundo de Índice (ETF)' : isFIIAsset ? 'Métricas do Fundo (FII)' : isCryptoAsset ? 'Métricas On-chain' : 'Saúde Fundamental'}
                                        </h3>

                                        {isLoadingHealth ? (
                                            <div className="animate-pulse space-y-8">
                                                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                            </div>
                                        ) : isCryptoAsset ? (
                                            /* === MÉTRICAS CRIPTO === */
                                            <div className="space-y-6">
                                                {/* 1. TVL / Market Cap */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            TVL (Total Value Locked)
                                                            <InfoTooltip text="Capital total retido no protocolo. Indica confiança e uso real do projeto." />
                                                        </span>
                                                        <span className="text-sm font-bold text-primary">
                                                            {asset?.tvl || aiRatingData?.cryptoMetrics?.tvl ? (asset?.tvl || aiRatingData?.cryptoMetrics?.tvl) : (
                                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">sync</span>
                                                                    Aguardando Indexação
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-primary h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: '0%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: Crescente</p>
                                                </div>

                                                {/* 2. Atividade de Rede */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Atividade de Rede (Wallets)
                                                            <InfoTooltip text="Número de endereços ativos. Mede a adoção real do protocolo." />
                                                        </span>
                                                        <span className="text-sm font-bold text-accent-orange">
                                                            {asset?.networkActivity || aiRatingData?.cryptoMetrics?.wallets ? (asset?.networkActivity || aiRatingData?.cryptoMetrics?.wallets) : (
                                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">sync</span>
                                                                    Aguardando Indexação
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-accent-orange h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-1000" style={{ width: '0%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: Alta</p>
                                                </div>

                                                {/* 3. Inflação do Token */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Inflação do Token
                                                            <InfoTooltip text="Taxa de emissão de novos tokens. Afeta a diluição do valor para holders." />
                                                        </span>
                                                        <span className="text-sm font-bold text-emerald-500">
                                                            {asset?.tokenInflation || aiRatingData?.cryptoMetrics?.inflation ? (asset?.tokenInflation || aiRatingData?.cryptoMetrics?.inflation) : (
                                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">sync</span>
                                                                    Aguardando Indexação
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '0%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: &lt; 5% ao ano</p>
                                                </div>

                                                {/* 4. Revenue (Taxas) */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Revenue (Taxas da Rede)
                                                            <InfoTooltip text="Quanto a rede arrecada em taxas. Indica sustentabilidade econômica do protocolo." />
                                                        </span>
                                                        <span className="text-sm font-bold text-sky-500">
                                                            {asset?.networkRevenue || aiRatingData?.cryptoMetrics?.revenue ? (asset?.networkRevenue || aiRatingData?.cryptoMetrics?.revenue) : (
                                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">sync</span>
                                                                    Aguardando Indexação
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-sky-500 h-2 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)] transition-all duration-1000" style={{ width: '0%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: Positivo e Crescente</p>
                                                </div>

                                                {/* 5. SCORE DE SOLIDEZ CRIPTO */}
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                                        <span className="text-sm text-slate-300">Score On-chain Geral</span>
                                                        <span className="text-base font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded">
                                                            {asset?.onChainScore || solidityScore}/100
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isETFAsset ? (
                                            /* === MÉTRICAS ETF === */
                                            <div className="space-y-6">
                                                {/* 1. Taxa de Administração */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Taxa de Administração
                                                            <InfoTooltip text="Custo anual pago à gestora para administrar o fundo." />
                                                        </span>
                                                        <span className="text-sm font-bold text-primary">
                                                            {aiRatingData?.etfMetrics?.taxa && aiRatingData.etfMetrics.taxa !== "0.00%" 
                                                                ? aiRatingData.etfMetrics.taxa 
                                                                : (asset?.taxaAdm || asset?.expenseRatio || "--")}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-primary h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Foco em taxas baixas</p>
                                                </div>

                                                {/* 2. Índice de Referência */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Índice de Referência
                                                            <InfoTooltip text="O índice que o ETF busca replicar (Benchmark)." />
                                                        </span>
                                                        <span className="text-sm font-bold text-accent-orange">
                                                            {aiRatingData?.etfMetrics?.benchmark && aiRatingData.etfMetrics.benchmark !== "Índice" 
                                                                ? aiRatingData.etfMetrics.benchmark 
                                                                : (asset?.benchmark || "--")}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-accent-orange h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Acompanhamento do Benchmark</p>
                                                </div>

                                                {/* 3. Patrimônio Líquido */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Patrimônio Líquido
                                                            <InfoTooltip text="Valor total de ativos sob gestão do ETF." />
                                                        </span>
                                                        <span className="text-sm font-bold text-purple-400">
                                                            {aiRatingData?.etfMetrics?.patrimonio && aiRatingData.etfMetrics.patrimonio !== "R$ 0B" 
                                                                ? aiRatingData.etfMetrics.patrimonio 
                                                                : formatCompactNumber(asset?.netAssets || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-purple-400 h-2 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.5)] transition-all duration-1000" style={{ width: '80%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Escala gera eficiência</p>
                                                </div>

                                                {/* 4. Liquidez Diária */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Liquidez Diária
                                                            <InfoTooltip text="Volume médio diário de negociação." />
                                                        </span>
                                                        <span className="text-sm font-bold text-emerald-500">
                                                            {aiRatingData?.etfMetrics?.liquidez && aiRatingData.etfMetrics.liquidez !== "R$ 0M" 
                                                                ? aiRatingData.etfMetrics.liquidez 
                                                                : formatCompactNumber(asset?.avgVolume || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Facilidade de entrada/saída</p>
                                                </div>

                                                {/* 5. SCORE DE SOLIDEZ ETF */}
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                                        <span className="text-sm text-slate-300">Score de Eficiência ETF</span>
                                                        <span className="text-base font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded">
                                                            {aiRatingData?.score ? Math.round(aiRatingData.score * 10) : 0}/100
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isFIIAsset ? (
                                            /* === MÉTRICAS FII === */
                                            <div className="space-y-6">
                                                {/* 1. P/VP (Ideal 0.9 - 1.1) */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            P/VP (Preço / Valor Patr.)
                                                            <InfoTooltip text="Mede o ágio ou deságio do fundo. Perto de 1.0 indica preço justo sobre os imóveis." />
                                                        </span>
                                                        <span className="text-sm font-bold text-primary">
                                                            {(aiRatingData?.fiiMetrics?.pvp && aiRatingData.fiiMetrics.pvp !== "--" && aiRatingData.fiiMetrics.pvp !== "0.00") 
                                                                ? aiRatingData.fiiMetrics.pvp 
                                                                : (asset?.fundamentalData?.pvp !== undefined && asset?.fundamentalData?.pvp !== null && asset.fundamentalData.pvp > 0) 
                                                                    ? asset.fundamentalData.pvp.toFixed(2) 
                                                                    : "--"}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-primary h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: `${Math.min((parseFloat(aiRatingData?.fiiMetrics?.pvp && aiRatingData.fiiMetrics.pvp !== "--" ? aiRatingData.fiiMetrics.pvp : asset?.fundamentalData?.pvp || 0) / 1.5) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: Próximo a 1.0x</p>
                                                </div>

                                                {/* 2. Vacância Física */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Vacância Física
                                                            <InfoTooltip text="Porcentagem de área não locada. Quanto menor, mais eficiente o fundo." />
                                                        </span>
                                                        <span className={`text-sm font-bold ${parseFloat(aiRatingData?.fiiMetrics?.vacancia || "0") > 15 ? "text-accent-red" : "text-emerald-500"}`}>
                                                            {aiRatingData?.fiiMetrics?.vacancia && aiRatingData.fiiMetrics.vacancia !== "--" && aiRatingData.fiiMetrics.vacancia !== "0.0%" 
                                                                ? aiRatingData.fiiMetrics.vacancia 
                                                                : (asset?.vacancia && asset.vacancia !== "--" ? asset.vacancia : "N/D")}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className={`h-2 rounded-full transition-all duration-1000 ${parseFloat(aiRatingData?.fiiMetrics?.vacancia || "0") > 15 || (aiRatingData?.fiiMetrics?.vacancia === "N/D" && asset?.vacancia) ? "bg-accent-red shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} style={{ width: `${Math.max(100 - parseFloat(aiRatingData?.fiiMetrics?.vacancia || asset?.vacancia || "0"), 0)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: &lt; 10%</p>
                                                </div>

                                                {/* 3. Dividend Yield */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Dividend Yield (Anualizado)
                                                            <InfoTooltip text="Rendimento dos últimos 12 meses. Principal foco do investidor de FII." />
                                                        </span>
                                                        <span className="text-sm font-bold text-sky-400">
                                                            {(aiRatingData?.fiiMetrics?.dy && aiRatingData.fiiMetrics.dy !== "--" && aiRatingData.fiiMetrics.dy !== "0.0%")
                                                                ? aiRatingData.fiiMetrics.dy
                                                                : (asset?.fundamentalData?.dy ? `${asset.fundamentalData.dy.toFixed(2)}%` : "--")}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-sky-400 h-2 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-1000" style={{ width: `${Math.min((parseFloat(aiRatingData?.fiiMetrics?.dy && aiRatingData.fiiMetrics.dy !== "--" ? aiRatingData.fiiMetrics.dy : asset?.fundamentalData?.dy || 0) / 15) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: &gt; 8% ao ano</p>
                                                </div>

                                                {/* 4. Heritage / Patrimônio */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Patrimônio Líquido
                                                            <InfoTooltip text="Valor total do mercado somando todos os ativos do fundo." />
                                                        </span>
                                                        <span className="text-sm font-bold text-purple-400">
                                                            {(aiRatingData?.fiiMetrics?.patrimonio && aiRatingData.fiiMetrics.patrimonio !== "--" && aiRatingData.fiiMetrics.patrimonio !== "R$ 0.0B") 
                                                                ? aiRatingData.fiiMetrics.patrimonio 
                                                                : (asset?.marketCap ? `R$ ${asset.marketCap}` : "--")}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-purple-400 h-2 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.5)] transition-all duration-1000" style={{ width: '80%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Foco em fundos &gt; R$ 500M</p>
                                                </div>

                                                {/* 5. SCORE DE SOLIDEZ FII */}
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                                        <span className="text-sm text-slate-300">Score de Gestão / Ativos</span>
                                                        <span className="text-base font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded">
                                                            {aiRatingData?.score ? Math.round(aiRatingData.score * 10) : 0}/100
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* === MÉTRICAS AÇÕES === */
                                            <div className="space-y-6">
                                                {/* 1. ROE (0% a 30%) */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Retorno sobre Patrimônio (ROE)
                                                            <InfoTooltip text="Retorno sobre o Patrimônio Líquido. Mede o quão eficiente a empresa é em gerar lucros com os recursos dos acionistas." />
                                                        </span>
                                                        <span className="text-sm font-bold text-primary">
                                                            {asset?.fundamentalData?.roe !== undefined && asset?.fundamentalData?.roe !== null ? `${asset.fundamentalData.roe.toFixed(2)}%` : "--"}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-primary h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: `${Math.min(((asset?.fundamentalData?.roe || 0) / 30) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: &gt; 15%</p>
                                                </div>

                                                {/* 2. P/VP (0 a 3.0) */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Preço / Vl. Patrimonial (P/VP)
                                                            <InfoTooltip text='Preço sobre Valor Patrimonial (VPA: Valor "contábil" da empresa). Indica o quão cara ou barata a ação está em relação ao seu patrimônio.' />
                                                        </span>
                                                        <span className="text-sm font-bold text-accent-orange">
                                                            {asset?.fundamentalData?.pvp !== undefined && asset?.fundamentalData?.pvp !== null ? `${asset.fundamentalData.pvp.toFixed(2)}x` : "--"}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-accent-orange h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-1000" style={{ width: `${Math.min(((asset?.fundamentalData?.pvp || 0) / 3) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: &lt; 2.0x</p>
                                                </div>

                                                {/* 3. P/L (0 a 20) */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Preço / Lucro (P/L)
                                                            <InfoTooltip text="Preço sobre Lucro (LPA: Lucro por papel). Indica quantos anos o investidor levaria para reaver o capital investido." />
                                                        </span>
                                                        <span className="text-sm font-bold text-emerald-500">
                                                            {asset?.fundamentalData?.pl !== undefined && asset?.fundamentalData?.pl !== null ? `${asset.fundamentalData.pl.toFixed(2)}x` : "--"}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${Math.min(((asset?.fundamentalData?.pl || 0) / 20) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: Entre 5x e 15x</p>
                                                </div>

                                                {/* 4. DY (0 a 15) */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-sm font-medium text-slate-300 flex items-center">
                                                            Dividend Yield (DY)
                                                            <InfoTooltip text="Mostra o quanto a empresa pagou em dividendos em relação ao preço atual da ação nos últimos 12 meses." />
                                                        </span>
                                                        <span className="text-sm font-bold text-sky-500">
                                                            {asset?.fundamentalData?.dy !== undefined && asset?.fundamentalData?.dy !== null ? `${asset.fundamentalData.dy.toFixed(2)}%` : "--"}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-sky-500 h-2 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)] transition-all duration-1000" style={{ width: `${Math.min(((asset?.fundamentalData?.dy || 0) / 15) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Ideal: &gt; 6% ao ano</p>
                                                </div>

                                                {/* 5. SCORE DE SOLIDEZ */}
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                                        <span className="text-sm text-slate-300">Score de Solidez Geral</span>
                                                        <span className="text-base font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded">
                                                            {aiHealth?.score || 0}/100 ({aiHealth?.status || "N/A"})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {/* VALOR JUSTO */}
                                    <section className="rounded-xl border border-border-dark bg-card-dark p-6 relative">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                            <div className="flex items-center">
                                                <span className="material-symbols-outlined text-slate-400 mr-2">
                                                    {isETFAsset ? 'layers' : isFIIAsset ? 'domain_verification' : isCryptoAsset ? 'hub' : 'price_check'}
                                                </span>
                                                {isETFAsset ? 'Análise de Fundo de Índice' : isFIIAsset ? 'Análise de Valor Patrimonial' : isCryptoAsset ? 'Análise de Valor On-chain' : 'Análise de Valor Justo'}
                                                <InfoTooltip text={isETFAsset ? "Análise da eficiência do fundo em replicar seu índice de referência." : isFIIAsset ? "Estimativa baseada no valor dos ativos e dividendos do fundo." : isCryptoAsset ? "Estimativa baseada em modelos de escassez e adoção de rede." : "Estimativa baseada em fundamentos de quanto a ação deveria custar realmente."} />
                                            </div>
                                        </h3>

                                        {isLoadingHealth ? (
                                            <div className="animate-pulse space-y-6">
                                                <div className="h-20 bg-zinc-800 rounded-lg w-full"></div>
                                                <div className="h-10 bg-zinc-800 rounded-lg w-full"></div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-6 items-center justify-center h-full pb-4">
                                                <div className="w-full space-y-5">
                                                    {/* BARRA VISUAL DE PREÇO */}
                                                    <div className="relative pt-6">
                                                        <div className="absolute -top-1 left-[50%] -translate-x-1/2 flex flex-col items-center">
                                                            <span className="text-xs font-bold text-black bg-primary border border-primary px-2 py-1 rounded mb-1 whitespace-nowrap z-10 shadow-lg shadow-primary/20">
                                                                {formatValue(asset?.price)} (Atual)
                                                            </span>
                                                            <div className="w-0.5 h-4 bg-primary"></div>
                                                        </div>
                                                        <div className="w-full h-4 bg-gradient-to-r from-red-500/20 via-zinc-600/20 to-emerald-500/20 rounded-full relative overflow-hidden ring-1 ring-zinc-800">
                                                            {/* Indicador de "Barato" vs "Caro" */}
                                                            <div className="absolute top-0 left-0 h-full w-[50%] bg-emerald-500/10 border-r border-zinc-700"></div>
                                                        </div>
                                                    </div>

                                                    {/* VALOR JUSTO DCF / VPA */}
                                                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                                        <span className="text-sm text-slate-300 flex items-center">
                                                            {isFIIAsset ? 'Valor Patrimonial (VPA)' : 'Valor Justo DCF'}
                                                            <InfoTooltip text={isFIIAsset ? "Valor contábil do fundo. Estimativa do valor real dos imóveis por cota." : "Discounted Cash Flow. Estima o valor intrínseco da empresa projetando seus fluxos de caixa futuros."} />
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="block text-base font-bold text-primary">
                                                                {isFIIAsset 
                                                                    ? formatValue(asset?.fundamentalData?.vpa || aiRatingData?.fiiMetrics?.vpa || 0)
                                                                    : formatValue(aiHealth?.dcf || 0)}
                                                            </span>
                                                            <span className={`text-xs font-bold ${isFIIAsset 
                                                                ? ((asset?.fundamentalData?.vpa || 0) > (asset?.price || 0) ? "text-primary" : "text-accent-red")
                                                                : (aiHealth?.dcfUpside || 0) >= 0 ? "text-primary" : "text-accent-red"}`}>
                                                                {isFIIAsset 
                                                                    ? `${((((asset?.fundamentalData?.vpa || 0) / (asset?.price || 1)) - 1) * 100).toFixed(0)}% Margem`
                                                                    : `${(aiHealth?.dcfUpside || 0) >= 0 ? "+" : ""}${aiHealth?.dcfUpside || 0}% Potencial`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isFIIAsset ? (
                                                        /* === MODELOS FIIs === */
                                                        <>
                                                            {/* PREÇO JUSTO PELO DY */}
                                                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm text-slate-300 flex items-center">
                                                                        Preço-Teto (Yield 8%)
                                                                        <InfoTooltip text="Preço máximo a pagar para manter um retorno de 8% ao ano baseado nos dividendos atuais." />
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Foco em Renda</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-base font-bold text-amber-500">
                                                                        {formatValue((parseFloat(asset?.fundamentalData?.dy || aiRatingData?.fiiMetrics?.dy || "0") * parseFloat(asset?.price || "0")) / 8)}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-slate-500">
                                                                        Alvo de Dividendos
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : isCryptoAsset ? (
                                                        /* === MODELOS CRIPTO === */
                                                        <>
                                                            {/* ... existing crypto blocks ... */}
                                                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                                                <span className="text-sm text-slate-300 flex items-center">
                                                                    Modelo Stock-to-Flow
                                                                    <InfoTooltip text="Baseado na escassez programada do ativo." />
                                                                </span>
                                                                <div className="text-right">
                                                                    <span className="block text-base font-bold text-slate-200">
                                                                        {aiRatingData?.cryptoMetrics?.tvl || "--"}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-slate-500">S2F Projection</span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        /* === MODELOS TRADIÇÃO (AÇÕES) === */
                                                        <>
                                                            {/* NÚMERO DE GRAHAM */}
                                                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                                                <span className="text-sm text-slate-300 flex items-center">
                                                                    Número de Graham
                                                                    <InfoTooltip text="Técnica de Benjamin Graham para avaliar preço justo usando o Lucro (LPA) e Patrimônio (VPA)." />
                                                                </span>
                                                                <div className="text-right">
                                                                    <span className="block text-base font-bold text-slate-200">
                                                                        {formatValue(asset?.valuation?.graham || aiHealth?.graham || 0)}
                                                                    </span>
                                                                    <span className={`text-xs font-bold ${(aiHealth?.grahamUpside || 0) >= 0 ? "text-primary" : "text-accent-red"}`}>
                                                                        {aiHealth?.grahamUpside > 0 ? "+" : ""}{aiHealth?.grahamUpside ? aiHealth.grahamUpside.toFixed(0) : 0}% Margem
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* PREÇO-TETO DE BAZIN */}
                                                            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm text-slate-300 flex items-center">
                                                                        Preço-teto de Bazin
                                                                        <InfoTooltip text="Método de Décio Bazin para dividendos." />
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Foco em Dividendos (6%)</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-base font-bold text-amber-500">
                                                                        {formatValue(asset?.valuation?.bazin || aiHealth?.bazin || 0)}
                                                                    </span>
                                                                    <span className={`text-xs font-bold ${(aiHealth?.bazinUpside || 0) >= 0 ? "text-primary" : "text-accent-red"}`}>
                                                                        {aiHealth?.bazinUpside > 0 ? "+" : ""}{aiHealth?.bazinUpside ? aiHealth.bazinUpside.toFixed(0) : 0}% Margem
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* BOX DE MARGEM DE SEGURANÇA DINÂMICO */}
                                                {(() => {
                                                    const priceNum = parseFloat(asset?.price || "0");
                                                    const vpaValue = asset?.fundamentalData?.vpa || aiRatingData?.fiiMetrics?.vpa || 0;
                                                    const vpaUpside = vpaValue > 0 && priceNum > 0 ? ((vpaValue / priceNum) - 1) * 100 : 0;
                                                    
                                                    const currentUpside = isFIIAsset ? vpaUpside : (aiHealth?.dcfUpside || 0);
                                                    const isHighMargin = currentUpside > 10;
                                                    
                                                    return (
                                                        <div className={`w-full rounded-lg p-3 border flex items-start gap-3 transition-colors duration-300 ${isHighMargin ? "bg-primary/10 border-primary/30" : "bg-card-dark border-border-dark"}`}>
                                                            <span className={`material-symbols-outlined text-xl ${isHighMargin ? "text-primary text-shadow-glow" : "text-slate-400"}`}>
                                                                {isHighMargin ? "verified_user" : "info"}
                                                            </span>
                                                            <div>
                                                                <h5 className={`text-xs font-bold uppercase ${isHighMargin ? "text-primary" : "text-slate-300"}`}>
                                                                    {isHighMargin ? "Margem de Segurança Alta" : "Avaliação de Risco"}
                                                                </h5>
                                                                <p className="text-xs text-slate-300 leading-tight mt-0.5">
                                                                    {isFIIAsset 
                                                                        ? (isHighMargin ? "Ativo negociado abaixo do seu valor patrimonial (VPA)." : "Preço atual próximo ou acima do valor patrimonial.")
                                                                        : (isHighMargin ? "Ativo descontado em relação aos fundamentos/fluxos de caixa." : "Preço atual próximo ou acima do valor intrínseco estimado.")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </section>

                                </div>
                                {/* --- AI RATING COMPONENT --- */}
                                <div className={`relative bg-zinc-900 border rounded-[2.5rem] p-8 transition-all duration-700 mb-6 ${aiRatingData ? 'border-primary/40 shadow-[0_0_50px_-20px_rgba(234,179,8,0.3)]' : 'border-zinc-800'
                                    }`}>

                                    {isRatingLoading ? (
                                        /* ESTADO DE CARREGAMENTO */
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-[10px] text-primary font-black uppercase tracking-widest animate-pulse">Lucas Analítico lendo o Relatório 360...</p>
                                        </div>
                                    ) : aiRatingData ? (
                                        /* ESTADO COM A NOTA */
                                        <div className="animate-in fade-in zoom-in-95 duration-700">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2 bg-primary/10 w-fit px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-primary text-[14px]">psychology</span>
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                                            Analista IA RASTRO Ativa
                                                        </span>
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-white">Veredito: {asset?.ticker}</h2>
                                                    <div className={`mt-2 text-[11px] font-black uppercase tracking-wider ${aiRatingData?.verdict?.toUpperCase().includes('COMPRA') ? 'text-emerald-400' :
                                                            aiRatingData?.verdict?.toUpperCase().includes('VENDA') ? 'text-orange-400' :
                                                                'text-slate-500'
                                                        }`}>
                                                        {aiRatingData?.verdict?.toUpperCase().includes('COMPRA') ? "OTIMISMO E ACUMULAÇÃO (BULLISH)" :
                                                            aiRatingData?.verdict?.toUpperCase().includes('VENDA') ? "CAUTELA E DISTRIBUIÇÃO (BEARISH)" :
                                                                (aiRatingData?.verdict || "Analisando Contexto...")}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-6xl font-black text-white tracking-tighter">
                                                            {aiRatingData?.score ? aiRatingData.score.toFixed(1) : "0.0"}
                                                        </span>
                                                        <span className="text-xl font-bold text-slate-600">/10</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pilares Interpretativos */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                {Array.isArray(aiRatingData?.pillars) && aiRatingData.pillars.length > 0 ? (
                                                    aiRatingData.pillars.map((p: any) => (
                                                        <div key={p.label} className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">{p.label}</p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-black text-white">{p.score}</span>
                                                                <div className="w-12 bg-zinc-800 h-1 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-primary" style={{ width: `${p.score * 10}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-4 text-center py-4 text-slate-600 text-[10px] uppercase">
                                                        Consolidando pilares de análise...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Resumo da Tese Baseada no Texto */}
                                            <div className="relative p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                                    "{investorThesis || (isRatingLoading ? "Extraindo tese de investimento do relatório qualitativo..." : "Processando análise do ativo...")}"
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ESTADO CASO NÃO TENHA RELATÓRIO */
                                        <div className="flex flex-col items-center py-10 opacity-40">
                                            <span className="material-symbols-outlined text-4xl mb-2">description_off</span>
                                            <p className="text-[10px] font-bold uppercase">Aguardando dados de {asset?.ticker}...</p>
                                        </div>
                                    )}
                                </div>

                                {/* SEÇÃO DE DEEP RESEARCH / RELATÓRIO */}
                                <section className="rounded-xl border border-border-dark bg-card-dark p-6 transition-none">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">analytics</span>
                                            <h3 className="text-xl font-bold text-white">
                                                Visão 360º | Relatório de Analista IA
                                            </h3>
                                            <InfoTooltip text="Um relatório completo gerado por IA que cruza dados técnicos, fundamentais e notícias." />
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsReportVisible(!isReportVisible);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-bold rounded-lg border border-zinc-700 transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {isReportVisible ? "visibility_off" : "visibility"}
                                                </span>
                                                {isReportVisible ? "Ocultar Relatório" : "Ver Relatório Completo"}
                                            </button>

                                            {isReportVisible && htmlReport && reportDate && (
                                                <div className="mt-1.5 flex items-center gap-1 font-medium text-[10px]">
                                                    <span className="text-slate-500">Atualizado em:</span>
                                                    <span className="text-primary">{reportDate}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Conteúdo condicional do Relatório */}
                                    {isReportVisible && (
                                        <div className="mt-6 p-6 bg-zinc-900/30 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {/* Se o relatório for HTML, injetamos ele com segurança */}
                                            {htmlReport ? (
                                                <div
                                                    className="
                                                        prose prose-invert max-w-none text-sm leading-relaxed
                                                        /* Força a cor do texto normal para cinza claro */
                                                        [&_*]:!text-slate-300 
                                                        /* Força os títulos para branco para dar destaque */
                                                        [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_strong]:!text-white
                                                        /* Força os links para a cor primária do seu site */
                                                        [&_a]:!text-primary
                                                        /* Força o fundo das tabelas ou blocos para transparente */
                                                        [&_*]:!bg-transparent
                                                    "
                                                    dangerouslySetInnerHTML={{ __html: htmlReport }}
                                                />
                                            ) : (
                                                <p className="text-slate-400 italic">Carregando relatório especializado...</p>
                                            )}


                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* COLUNA DIREITA (4) */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">

                                {/* SENTIMENTO DO MERCADO */}
                                <section className="rounded-xl border border-border-dark bg-card-dark p-6">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400">speed</span>
                                        Sentimento do Mercado
                                        <InfoTooltip text="Mostra se os investidores estão otimistas (Ganância) ou pessimistas (Medo) com o papel." />
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-6">Sentimento Social + Volatilidade do Mercado</p>
                                    <div className="relative h-40 w-full flex items-end justify-center overflow-hidden">
                                        <svg className="w-full h-full max-w-[240px]" viewBox="0 0 200 110">
                                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#27272a" strokeLinecap="round" strokeWidth="20"></path>
                                            <path className="opacity-30" d="M 20 100 A 80 80 0 0 1 70 38" fill="none" stroke="#ef4444" strokeDasharray="2 2" strokeWidth="20"></path>
                                            <path className="opacity-30" d="M 70 38 A 80 80 0 0 1 130 38" fill="none" stroke="#fbbf24" strokeDasharray="2 2" strokeWidth="20"></path>
                                            <path className="opacity-80" d="M 130 38 A 80 80 0 0 1 180 100" fill="none" stroke="#fbbf24" strokeDasharray="2 2" strokeWidth="20"></path>
                                            <g transform={`rotate(${-90 + ((aiSentiment?.value || 50) / 100) * 180}, 100, 100)`}>
                                                <line stroke="white" strokeLinecap="round" strokeWidth="4" x1="100" x2="100" y1="100" y2="30"></line>
                                                <circle cx="100" cy="100" fill="white" r="6"></circle>
                                            </g>
                                        </svg>
                                        <div className="absolute bottom-0 text-center">
                                            <span className={`block text-3xl font-black ${(aiSentiment?.value || 50) <= 40 ? 'text-red-500' :
                                                    (aiSentiment?.value || 50) <= 65 ? 'text-amber-500' :
                                                        'text-emerald-500'
                                                }`}>{aiSentiment?.value || 50}</span>
                                            <span className={`text-xs uppercase tracking-widest font-bold ${(aiSentiment?.value || 50) <= 40 ? 'text-red-500' :
                                                    (aiSentiment?.value || 50) <= 65 ? 'text-amber-500' :
                                                        'text-emerald-500'
                                                }`}>{aiSentiment?.label || "Neutro"}</span>
                                            {aiSentiment?.lastUpdate && (
                                                <span className="block text-[9px] text-zinc-500 uppercase mt-1">
                                                    Última atualização: {new Date(aiSentiment.lastUpdate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ALERTA DE DIVERGÊNCIA */}
                                    {aiRatingData?.score >= 8.0 && (aiSentiment?.value || 50) <= 40 && (
                                        <div className="mt-4 text-[10px] text-primary bg-primary/10 p-2 rounded-lg font-bold border border-primary/20 animate-pulse">
                                            ⚠️ DIVERGÊNCIA DETECTADA: Fundamento forte com Sentimento de Medo. Possível zona de acumulação institucional.
                                        </div>
                                    )}
                                    <div className="mt-6 space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Tendência Detectada</span>
                                            <span className="text-white font-medium capitalize">{aiSentiment?.trend || "side"}</span>
                                        </div>
                                    </div>
                                </section>

                                {/* --- PULSO DE IA --- */}
                                <div className={`bg-zinc-900/50 border rounded-3xl p-6 relative overflow-hidden transition-all duration-500 ${marketStatus.isOpen ? "border-zinc-800" : "border-orange-900/20"
                                    }`}>

                                    {/* Overlay de Standby: Só aparece se NÃO for cripto E o mercado estiver fechado */}
                                    {!marketStatus.isOpen && !asset?.isCrypto && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-500 rounded-3xl">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-2xl shadow-2xl flex flex-col items-center min-w-[140px]">
                                                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em]">Mercado Fechado</span>
                                                    <span className="text-xl font-mono font-bold text-white mt-1 leading-none">{marketStatus.countdown}</span>
                                                    <span className="text-[9px] text-slate-500 uppercase mt-2">Para Abertura ({marketStatus.label})</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Efeito de Grade e Scanner (Isolados com overflow-hidden para não cortar o tooltip) */}
                                    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                        {marketStatus.isOpen && (
                                            <div className={`absolute top-0 left-0 w-full h-[1px] animate-scan opacity-30 ${asset?.isCrypto ? 'bg-blue-400' : 'bg-primary'}`}></div>
                                        )}
                                    </div>

                                    <div className={`relative z-10 transition-all duration-700 ${!marketStatus.isOpen ? "grayscale blur-[2px]" : ""}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex h-3 w-3">
                                                    {marketStatus.isOpen && (
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${asset?.isCrypto ? 'bg-blue-400' : 'bg-primary'}`}></span>
                                                    )}
                                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${marketStatus.isOpen
                                                        ? (asset?.isCrypto ? 'bg-blue-500' : 'bg-primary')
                                                        : "bg-zinc-700"
                                                        }`}></span>
                                                </div>
                                                <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Pulso de IA</h3>

                                                {/* ÍCONE DE AJUDA COM TOOLTIP */}
                                                <div className="group/tooltip relative inline-block">
                                                    <span className="material-symbols-outlined text-slate-500 text-[10px] cursor-help hover:text-primary transition-colors opacity-70">
                                                        help
                                                    </span>

                                                    {/* CAIXA DE EXPLICAÇÃO (Aparece no hover) */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                                        <div className="text-[10px] space-y-3">
                                                            <p className="font-bold text-primary border-b border-white/5 pb-1 uppercase">O que é o Pulso?</p>
                                                            <div>
                                                                <span className="text-white font-bold block">Solidez Geral:</span>
                                                                <span className="text-slate-400">
                                                                    {asset?.isCrypto
                                                                        ? "Para Criptos: Baseado em Market Cap, Volume e Estabilidade de Preço."
                                                                        : "Para Ações: Média entre Graham, Bazin, ROE e Margens de Lucro."}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-white font-bold block">Risco de Cauda:</span>
                                                                <span className="text-slate-400">Chances de eventos extremos fora do comum.</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-white font-bold block">Volatilidade:</span>
                                                                <span className="text-slate-400">Intensidade da variação do preço.</span>
                                                            </div>
                                                        </div>
                                                        {/* Triângulo do Tooltip */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {asset?.isCrypto && (
                                                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold uppercase">
                                                        24/7 Mode
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-mono px-2 py-1 rounded-full border transition-colors ${marketStatus.isOpen
                                                    ? "text-primary bg-primary/10 border-primary/20"
                                                    : "text-slate-500 bg-zinc-800 border-zinc-700"
                                                    }`}>
                                                    {marketStatus.isOpen ? "LIVE SCAN" : "STANDBY"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Score de Solidez Geral</p>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-4xl font-black text-emerald-400">65%</span>
                                                <span className="text-xs text-emerald-400/80 mb-1 font-bold">+12% vs Setor</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-6 border-b border-white/5 pb-6">
                                                Métricas validadas. Fundamentos e fluxo de caixa alinhados com a pontuação.
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div>
                                                    <span className="block text-[9px] text-slate-500 uppercase font-black">Risco de Cauda</span>
                                                    <span className="text-sm font-bold text-amber-400">Moderado</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-slate-500 uppercase font-black">Volatilidade</span>
                                                    <span className="text-sm font-bold text-white">12.4%</span>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                                "IA detectou padrão de acumulação institucional nos últimos 15 minutos. Suporte em R$ {asset?.price ? (parseFloat(asset.price) * 0.98).toFixed(2) : '--'} fortalecido."
                                            </p>
                                        </div>
                                    </div>

                                    {/* Efeito de Scanner que passa pelo card */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan"></div>
                                </div>

                                {/* CHAT IA DINÂMICO */}
                                <section className="rounded-xl border border-border-dark bg-card-dark flex flex-col h-[500px]">
                                    {/* Header do Chat */}
                                    <div className="p-4 border-b border-border-dark flex justify-between items-center bg-zinc-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-black font-bold">
                                                    <span className="material-symbols-outlined text-xl">smart_toy</span>
                                                </div>
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card-dark rounded-full"></span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white flex items-center">
                                                    Analista RASTRO IA
                                                    <InfoTooltip text="Nossa inteligência artificial processa milhares de dados em tempo real para gerar este insight." />
                                                </h3>
                                                <p className="text-xs text-primary">Contextualizado em {asset?.ticker || "Carregando..."}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Área de Mensagens */}
                                    <div
                                        ref={chatContainerRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-card-dark"
                                    >
                                        {/* Mensagem Inicial Padrão */}
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex-none flex items-center justify-center text-primary text-xs font-bold border border-primary/20">IA</div>
                                            <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 max-w-[85%] border border-zinc-700">
                                                <p className="text-sm text-slate-200">
                                                    Olá! Li o relatório completo da <strong className="text-white">{asset?.name || "empresa"}</strong>. O que gostaria de saber sobre as finanças ou riscos desta empresa?
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mapeamento das mensagens trocadas */}
                                        {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                id={`chat-msg-${idx}`}
                                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex-none flex items-center justify-center text-xs font-bold ${msg.role === "user" ? "bg-slate-700 text-white" : "bg-primary/20 text-primary border border-primary/20"}`}>
                                                    {msg.role === "user" ? "EU" : "IA"}
                                                </div>
                                                <div className={`rounded-2xl p-3 max-w-[85%] ${msg.role === "user" ? "bg-primary/20 border border-primary/30 rounded-tr-none text-white" : "bg-zinc-800 border border-zinc-700 rounded-tl-none text-slate-200"}`}>
                                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Mostra um "A pensar..." enquanto carrega */}
                                        {isLoadingChat && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex-none flex items-center justify-center text-primary text-xs font-bold border border-primary/20">IA</div>
                                                <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 max-w-[85%] border border-zinc-700 flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input do Chat */}
                                    <div className="p-4 border-t border-border-dark bg-card-dark">
                                        <div className="relative">
                                            <input
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                disabled={isLoadingChat}
                                                className="w-full bg-black border border-zinc-700 rounded-full py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-slate-500 disabled:opacity-50"
                                                placeholder={`Pergunte sobre a ${asset?.name || "empresa"}...`}
                                                type="text"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={isLoadingChat || !chatInput.trim()}
                                                className="absolute right-2 top-1.5 p-1 text-primary hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined">send</span>
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>

                        </div>

                    </div>
                </main>
            </div>

            {showAlertModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">notifications_active</span>
                                Configurar Alerta: {ticker}
                            </h3>
                            <button onClick={() => setShowAlertModal(false)} className="text-slate-500 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Preço Alvo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço Alvo (R$)</label>
                                <input
                                    type="number"
                                    value={alertPrice}
                                    onChange={(e) => setAlertPrice(e.target.value)}
                                    placeholder="Ex: 42.50"
                                    className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-primary outline-none transition-all"
                                />
                            </div>

                            {/* Relatório */}
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Relatório Atualizado</span>
                                    <span className="text-xs text-slate-500">Enviar análise da IA quando atingir o preço</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={alertReport}
                                    onChange={(e) => setAlertReport(e.target.checked)}
                                    className="w-5 h-5 accent-primary"
                                />
                            </div>

                            {/* Método de Notificação */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-4">Receber por:</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { id: 'browser', icon: 'laptop', label: 'Navegador' },
                                        { id: 'telegram', icon: 'send', label: 'Telegram' },
                                        { id: 'email', icon: 'mail', label: 'E-mail' }
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setAlertMethod(m.id)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${alertMethod === m.id
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-zinc-800 bg-black/20 text-slate-500 hover:border-zinc-600'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined">{m.icon}</span>
                                            <span className="text-[10px] font-bold uppercase">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Ação */}
                        <div className="p-6 bg-zinc-800/30">
                            <button
                                onClick={handleSaveAlert}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                Salvar Configurações de Alerta
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {
                showCompareModal && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header do Modal */}
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">analytics</span>
                                        Duelo de Gigantes
                                    </h2>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Comparando {ticker} vs {compareAsset?.ticker || "..."}</p>
                                </div>
                                <button onClick={() => { setShowCompareModal(false); setCompareAsset(null); setCompareTicker(""); }} className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {/* Input de Busca do Segundo Ativo (Se ainda não carregou) */}
                                {!compareAsset && (
                                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                                        <div className="text-center">
                                            <p className="text-slate-400 mb-4">Com qual ativo deseja comparar a {ticker}?</p>
                                            <div className="flex gap-2">
                                                <div className="relative w-64"> {/* Container relativo para segurar a lista */}
                                                    <input
                                                        type="text"
                                                        placeholder="Digite o Ticker..."
                                                        value={compareTicker}
                                                        onChange={(e) => handleInputChange(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                                                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary text-center font-bold"
                                                    />

                                                    {/* LISTA DE SUGESTÕES */}
                                                    {suggestions.length > 0 && (
                                                        <div className="absolute top-full left-0 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl z-50">
                                                            {suggestions.map((s) => (
                                                                <button
                                                                    key={s.ticker}
                                                                    onClick={() => {
                                                                        setCompareTicker(s.ticker);
                                                                        setSuggestions([]);
                                                                        // Opcional: já disparar a busca ao clicar
                                                                        // handleCompare(); 
                                                                    }}
                                                                    className="w-full flex items-center justify-between p-3 hover:bg-zinc-700 text-left transition-colors border-b border-zinc-700/50 last:border-0"
                                                                >
                                                                    <span className="font-bold text-primary">{s.ticker}</span>
                                                                    <span className="text-[10px] text-slate-400 truncate ml-2">{s.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleCompare}
                                                    disabled={isComparing}
                                                    className="bg-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isComparing ? (
                                                        <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                                                    ) : (
                                                        "Comparar"
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tabela de Comparação (Aparece após o fetch) */}
                                {compareAsset && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                            <div className="invisible"></div>
                                            <div className="text-center p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/50">
                                                <span className="text-xs text-slate-500 block mb-1">ATUAL</span>
                                                <span className="text-lg font-bold text-white">{ticker}</span>
                                            </div>
                                            <div className="text-center p-4 bg-primary/10 rounded-2xl border border-primary/30">
                                                <span className="text-xs text-primary block mb-1">COMPARADO</span>
                                                <span className="text-lg font-bold text-primary">{compareAsset.ticker || compareTicker}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Função Auxiliar para renderizar a linha */}
                                            {[
                                                { label: 'Score IA', key: 'ai_score', format: (v: any) => v || 'N/D', better: 'max' },
                                                { label: 'Veredito Rastro', key: 'ai_verdict', format: (v: any) => v || 'Analisando...', better: 'none' },
                                                { label: 'Sentimento', key: 'ai_sentiment', format: (v: any) => v || 'N/D', better: 'max' },
                                                { label: 'Preço Atual', key: 'price', format: (v: any) => `R$ ${parseFloat(v).toFixed(2)}`, better: 'none' },
                                                { label: 'P/L (Preço/Lucro)', key: 'p_l', format: (v: any) => `${parseFloat(v).toFixed(2)}x`, better: 'min' },
                                                {
                                                    label: 'P/VP', key: 'vpa', format: (v: any) => {
                                                        const vpa = parseFloat(v) || 1;
                                                        const price = compareAsset?.price || 0;
                                                        return (parseFloat(price) / vpa).toFixed(2) + 'x';
                                                    }, better: 'min'
                                                },
                                                { label: 'Dividend Yield (DY)', key: 'dy', format: (v: any) => `${parseFloat(v).toFixed(2)}%`, better: 'max' },
                                                { label: 'ROE', key: 'roe', format: (v: any) => `${parseFloat(v).toFixed(2)}%`, better: 'max' },
                                            ].map((row) => {
                                                // 1. Extração de Valores para Ativo 1 (Atual)
                                                let val1: any = 0;
                                                if (row.key === 'ai_score') val1 = aiRatingData?.score;
                                                else if (row.key === 'ai_sentiment') val1 = aiSentiment?.value;
                                                else if (row.key === 'ai_verdict') {
                                                    const v = aiRatingData?.verdict?.toUpperCase() || "";
                                                    if (v.includes("COMPRA")) val1 = "OTIMISMO (BULLISH)";
                                                    else if (v.includes("VENDA")) val1 = "CAUTELA (BEARISH)";
                                                    else val1 = "NEUTRO";
                                                }
                                                else val1 = row.key === 'price' ? asset?.price : (row.key === 'p_l' ? asset?.fundamentalData?.pl : asset?.fundamentalData?.[row.key]);

                                                // 2. Extração de Valores para Ativo 2 (Comparado)
                                                let val2: any = 0;
                                                if (row.key === 'ai_score') val2 = compareAiRatingData?.score;
                                                else if (row.key === 'ai_sentiment') val2 = compareAiSentiment?.value;
                                                else if (row.key === 'ai_verdict') {
                                                    const v = compareAiRatingData?.verdict?.toUpperCase() || "";
                                                    if (v.includes("COMPRA")) val2 = "OTIMISMO (BULLISH)";
                                                    else if (v.includes("VENDA")) val2 = "CAUTELA (BEARISH)";
                                                    else val2 = "NEUTRO";
                                                }
                                                else val2 = row.key === 'price' ? compareAsset?.price : compareAsset?.[row.key];

                                                const v1 = parseFloat(val1) || 0;
                                                const v2 = parseFloat(val2) || 0;

                                                const win1 = row.better === 'max' ? v1 > v2 : row.better === 'min' ? (v1 < v2 && v1 > 0) : false;
                                                const win2 = row.better === 'max' ? v2 > v1 : row.better === 'min' ? (v2 < v1 && v2 > 0) : false;

                                                // Lógica de cores para IA Verde/Laranja
                                                const getIaColor = (val: string, isScore = false) => {
                                                    if (isScore) return parseFloat(val) >= 7 ? 'text-emerald-400' : parseFloat(val) <= 4 ? 'text-orange-400' : 'text-white';
                                                    if (val.includes("OTIMISMO")) return 'text-emerald-400';
                                                    if (val.includes("CAUTELA")) return 'text-orange-400';
                                                    return 'text-white';
                                                };

                                                return (
                                                    <div key={row.label} className="grid grid-cols-3 items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-black/40 transition-all">
                                                        <div className="text-sm font-medium text-slate-400 uppercase text-[10px] tracking-wider">{row.label}</div>
                                                        <div className={`text-center font-mono text-xs ${row.key.startsWith('ai_') ? getIaColor(String(val1), row.key === 'ai_score') : (win1 ? 'text-green-400 font-bold' : 'text-white')
                                                            }`}>
                                                            {row.key === 'vpa' ? `${(asset.fundamentalData?.pvp || 0).toFixed(2)}x` : row.format(val1)}
                                                        </div>
                                                        <div className={`text-center font-mono text-xs ${row.key.startsWith('ai_') ? getIaColor(String(val2), row.key === 'ai_score') : (win2 ? 'text-green-400 font-bold' : 'text-white')
                                                            }`}>
                                                            {row.format(val2)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => { setCompareAsset(null); setCompareTicker(""); }}
                                            className="mt-8 w-full py-3 text-slate-500 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest"
                                        >
                                            ← Comparar com outro ticker
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/60 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 min-w-[300px]">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isInWatchlist ? 'bg-primary/20' : 'bg-red-500/20'}`}>
                                <span className={`material-symbols-outlined text-4xl ${isInWatchlist ? 'text-primary' : 'text-red-500'}`}>
                                    {modalConfig.icon}
                                </span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-bold text-xl">{modalConfig.title}</h3>
                                <p className="text-slate-400 mt-1">{modalConfig.message}</p>
                            </div>
                            {/* Barra de progresso visual */}
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className={`h-full animate-progress-bar ${isInWatchlist ? 'bg-primary' : 'bg-red-500'}`}></div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
