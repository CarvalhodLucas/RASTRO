"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { assetsDatabase, Asset, normalizeTickerForCache } from "@/lib/data";
import Header from "@/components/Header";
import AssetLogo from "@/components/AssetLogo";
import MarketTicker from "@/components/MarketTicker";

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="relative group inline-block">
        {/* Ícone */}
        <span className="material-symbols-outlined !text-[14px] ml-1 cursor-help text-slate-500 hover:text-primary transition-colors">
            help_outline
        </span>

        {/* O BALÃO: Agora alinhado à DIREITA (right-0) para crescer para a esquerda */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-zinc-950 border border-zinc-800 text-slate-200 text-[11px] leading-relaxed rounded-lg p-3 z-[9999] shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none">

            {/* Título interno para dar contexto */}
            <div className="text-primary font-bold mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">psychology</span>
                Explicação:
            </div>

            {text}

            {/* Setinha ajustada para a direita do balão */}
            <div className="absolute -bottom-1 right-2 w-2 h-2 bg-zinc-950 border-b border-r border-zinc-800 rotate-45"></div>
        </div>
    </div>
);




const AssetRow = ({ asset, aiScore: aiScoreFromParent }: { asset: Asset, aiScore?: number | null }) => {
    const [imageError, setImageError] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [realData, setRealData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        setHasMounted(true);

        const fetchRealData = async () => {
            const baseTicker = asset.ticker.replace('.SA', '');
            const CACHE_KEY = `api_data_${baseTicker}`;
            const cached = localStorage.getItem(CACHE_KEY);

            try {
                // 0. Sistema de Cache 24h
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const isOld = Date.now() - timestamp > 6 * 60 * 60 * 1000; // 6h (21600s)
                    const isDataValid = data && data.price && data.price !== "--" && data.price !== "0.00" && data.price !== 0 && data.marketCap !== "--" && data.marketCap !== undefined;

                    if (!isOld && isDataValid) {
                        setRealData(data);
                        setIsLoading(false);
                        return; // Só usa o cache se os dados forem reais e recentes
                    }
                    // Se o cache é velho OU inválido, continua para buscar dados frescos
                }

                const isCrypto = !!asset.cgId;
                const isUS = asset.exchange === "NASDAQ" || asset.exchange === "NYSE";
                let tickerQuery = asset.ticker.toUpperCase();

                // 1. Lógica Universal: Se tiver cgId no data.ts, é Cripto
                if (isCrypto) {
                    const cgId = asset.cgId!;
                    const res = await fetch(`/api/proxy?target=price&ids=${cgId}&vs_currencies=brl&include_24hr_change=true&include_market_cap=true`);
                    const data = await res.json();

                    if (data[cgId]) {
                        // Formatar Market Cap de cripto (BRL)
                        const rawMcap = data[cgId].brl_market_cap || 0;
                        let cryptoMarketCap: string | undefined;
                        if (rawMcap >= 1e12) cryptoMarketCap = `${(rawMcap / 1e12).toFixed(1)}T`;
                        else if (rawMcap >= 1e9) cryptoMarketCap = `${(rawMcap / 1e9).toFixed(0)}B`;
                        else if (rawMcap >= 1e6) cryptoMarketCap = `${(rawMcap / 1e6).toFixed(0)}M`;

                        const newData = {
                            price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data[cgId].brl).replace('R$', '').trim(),
                            variation: data[cgId].brl_24h_change?.toFixed(2) || "0.00",
                            exchange: "Crypto Market",
                            dataSource: "CoinGecko",
                            sector: "Criptomoedas",
                            name: asset.name,
                            marketCap: cryptoMarketCap || asset.marketCap,
                        };
                        setRealData(newData);
                        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newData, timestamp: Date.now() }));
                    } else {
                        throw new Error("CoinGecko não retornou dados para " + cgId);
                    }
                } else {
                    // 2. Ticker Inteligente: Ajusta sufixo conforme a bolsa
                    const isB3 = asset.exchange === "B3" && asset.sector !== "Criptomoedas";
                    if (isB3 && !tickerQuery.toUpperCase().endsWith('.SA') && !isUS) {
                        tickerQuery = `${tickerQuery}.SA`;
                    } else if ((isUS || asset.exchange === "OTC") && tickerQuery.toUpperCase().endsWith('.SA')) {
                        tickerQuery = tickerQuery.replace(/\.SA$/i, '');
                    }

                    // Fallback para Yahoo/B3 (Ações normais)
                    const res = await fetch(`/api/quote?ticker=${tickerQuery}`);
                    const data = await res.json();

                    // Se a API devolver erro ou dados zerados, disparamos um fallback silenciosamente
                    if (data.error || data.name?.includes("ERRO") || !data.price || data.price === 0 || data.price === "0.00") {
                        console.warn(`[Aviso] Dados zerados na API para ${asset.ticker}. A usar fallback.`);
                        const savedCache = localStorage.getItem(CACHE_KEY);
                        if (savedCache) {
                            try {
                                setRealData(JSON.parse(savedCache).data);
                            } catch { /* parse error, fallthrough */ }
                        } else {
                            setRealData({
                                price: asset.price !== "0.00" ? asset.price : "N/D",
                                marketCap: asset.marketCap,
                                peRatio: asset.peRatio,
                                dividendYield: asset.dividendYield,
                                change: 0
                            });
                        }
                        return; // Interrompe a API de gravar cache lixo mas também de quebrar a Promise da linha
                    }

                    const newData = {
                        ...data,
                        price: data.price || asset.price,
                        variation: data.variation || asset.variation,
                        currency: isUS ? "U$" : "R$",
                        dataSource: "Yahoo Finance",
                        marketCap: data.marketCap || asset.marketCap,
                        peRatio: data.p_l && data.p_l > 0 ? data.p_l.toFixed(2) : undefined,
                        dividendYield: data.dy && data.dy > 0 ? `${data.dy.toFixed(1)}%` : undefined,
                    };
                    setRealData(newData);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newData, timestamp: Date.now() }));
                    // Notifica a página para re-ordenar a lista com o novo Market Cap
                    window.dispatchEvent(new Event('marketDataUpdated'));
                }
            } catch (error) {
                console.warn(`[Aviso] Falha de rede ao buscar ${asset.ticker}. A usar último backup.`, error);
                // SALVA-VIDAS: Puxa o cache velho se a internet ou a API falharem
                if (cached) {
                    try {
                        setRealData(JSON.parse(cached).data);
                    } catch { /* cache corrupto, ignora */ }
                } else {
                    // Se nunca houve cache, usa o dado estático do data.ts
                    setRealData({
                        price: asset.price !== "0.00" ? asset.price : "N/D",
                        marketCap: asset.marketCap,
                        variation: "0.00"
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchRealData();
    }, [asset.ticker, asset.cgId]);

    // Falback logic for logo
    const domainMap: { [key: string]: string } = {
        "PETR4": "petrobras.com.br",
        "AAPL": "apple.com",
        "VALE3": "vale.com"
    };

    const cleanTicker = (asset.ticker || "").toUpperCase().replace('.SA', '').trim();
    const domain = domainMap[cleanTicker] || `${cleanTicker.toLowerCase()}.com.br`;
    const assetLogo = asset.logo || `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    const fallbackLogo = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

    const displayPrice = realData?.price !== undefined ? realData.price : (asset.price !== "N/D" && asset.price !== "0.00" ? asset.price : "N/D");
    const displayVariation = realData?.variation !== undefined ? realData.variation : asset.variation;
    const displayName = realData?.name && !realData.name.includes("ERRO") ? realData.name : asset.name;
    const displayMarketCap = realData?.marketCap || asset.marketCap || "--";
    const displayPeRatio = realData?.peRatio || asset.peRatio || "--";
    const displayDividendYield = realData?.dividendYield || asset.dividendYield || "--";

    const isPositive = !String(displayVariation).startsWith('-');
    const isCrypto = !!asset.cgId;
    const isUS = asset.exchange === "NASDAQ" || asset.exchange === "NYSE";
    const currency = isCrypto ? "R$" : (isUS ? "U$" : "R$");
    const currencyPrefix = isCrypto ? "" : (isUS ? "U$ " : "R$ ");

    // Helper para limpar tickers (BTC-USD -> BTC, PETR4.SA -> PETR4)
    const getCleanKey = (t: string) => t.replace('-USD', '').replace('.SA', '').toUpperCase();

    // Logic to read sentiment from localStorage (Synced with Asset Page)
    const getSentimentData = () => {
        if (typeof window === 'undefined') return { value: asset.sentiment || 50, isCached: false };
        
        const cleanT = normalizeTickerForCache(asset.ticker);
        const keysToTry = [
            `grok_sent_v3_${cleanT}`,
            `grok_sentiment_v2_${asset.ticker}`,
            `sentiment_cache_${cleanT}`,
            `sentiment_cache_${asset.ticker}`
        ];

        for (const key of keysToTry) {
            const cached = localStorage.getItem(key);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Busca abrangente pelo valor (cobre múltiplas estruturas que a IA pode ter devolvido)
                    const val = parsed.data?.value ?? parsed.value ?? parsed.data?.sentiment ?? parsed.sentiment ?? (typeof parsed.data === 'number' ? parsed.data : undefined);
                    
                    if (val !== undefined && !isNaN(val)) {
                        return { value: Number(val), isCached: true };
                    }
                } catch (e) {}
            }
        }
        return { value: asset.sentiment || 50, isCached: false };
    };

    const [localSentiment, setLocalSentiment] = useState<{value: number, isCached: boolean}>({ value: asset.sentiment || 50, isCached: false });

    React.useEffect(() => {
        // Hydration via React (read real value only on client)
        setLocalSentiment(getSentimentData());

        const handleUpdate = () => {
            setLocalSentiment(getSentimentData());
        };

        window.addEventListener('sentimentUpdated', handleUpdate);
        window.addEventListener('storage', (e) => {
            if (e.key?.startsWith('grok_sentiment_v2_') || e.key?.startsWith('sentiment_cache_')) handleUpdate();
        });
        window.addEventListener('focus', handleUpdate);

        return () => {
            window.removeEventListener('sentimentUpdated', handleUpdate);
            window.removeEventListener('focus', handleUpdate);
            // removing anonymous storage listener can be tricky, but this is a light component
        };
    }, [asset.ticker]);

    const { value: sentimentValue, isCached } = localSentiment;

    // Usa a nota vinda do pai (estado centralizado) se disponível
    const aiScore = aiScoreFromParent ?? null;

    // Determine color based on sentiment (Termômetro)
    let sentimentColor = "text-slate-400";
    let sentimentBg = "bg-slate-400";
    let sentimentGlow = "";

    if (sentimentValue <= 30) {
        sentimentColor = "text-red-500";
        sentimentBg = "bg-red-500";
        sentimentGlow = "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]";
    } else if (sentimentValue <= 60) {
        sentimentColor = "text-amber-500";
        sentimentBg = "bg-amber-500";
        sentimentGlow = "drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]";
    } else {
        sentimentColor = "text-emerald-500";
        sentimentBg = "bg-emerald-500";
        sentimentGlow = "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]";
    }

    return (
        <Link
            href={`/asset/${asset.ticker}`}
            className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-2.5 border-b border-neutral-dark-border/50 hover:bg-neutral-dark-border/30 transition-colors items-center group cursor-pointer overflow-visible"
        >
            {/* Ticker and Name */}
            <div className="col-span-6 md:col-span-2 flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center shrink-0">
                    {hasMounted && (
                        <AssetLogo 
                            src={asset.logo} 
                            ticker={asset.ticker} 
                            name={asset.name} 
                            size={asset.ticker.length > 5 ? 7 : 8}
                            className="w-full h-full"
                        />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="font-bold text-slate-100 group-hover:text-primary transition-colors text-xs md:text-sm truncate">
                        {isLoading ? <div className="h-4 w-12 bg-neutral-dark-border animate-pulse rounded mt-1"></div> : asset.ticker}
                    </div>
                    <div className="text-[9px] md:text-[10px] text-slate-500 truncate max-w-[80px] sm:max-w-[150px]">
                        {isLoading ? <div className="h-3 w-16 bg-neutral-dark-border animate-pulse rounded mt-1"></div> : displayName}
                    </div>
                </div>
            </div>

            {/* Price & Variation */}
            <div className="col-span-6 md:col-span-2 text-right">
                <div className="text-white font-bold md:font-medium flex justify-end text-sm md:text-base">
                    {isLoading ? (
                        <div className="h-5 w-16 bg-neutral-dark-border animate-pulse rounded"></div>
                    ) : (
                        displayPrice !== "N/D" ? `${currency} ${displayPrice}` : "N/D"
                    )}
                </div>
                <div className={`flex justify-end items-center gap-1 text-[10px] md:text-xs font-medium ${isPositive ? 'text-market-up' : 'text-market-down'} mt-0.5 md:mt-1`}>
                    {isLoading ? (
                        <div className="h-3 w-10 bg-neutral-dark-border animate-pulse rounded"></div>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[10px] md:text-[12px]">
                                {isPositive ? 'trending_up' : 'trending_down'}
                            </span>
                            {displayVariation}%
                        </>
                    )}
                </div>
            </div>

            {/* Market Cap */}
            <div className="hidden md:block md:col-span-2 text-right text-slate-300 text-sm font-medium">
                {isLoading ? (
                    <div className="h-4 w-14 bg-neutral-dark-border animate-pulse rounded ml-auto"></div>
                ) : (
                    displayMarketCap !== "--" ? `${currencyPrefix}${displayMarketCap}` : "--"
                )}
            </div>

            {/* P/E */}
            <div className="hidden lg:block lg:col-span-1 text-right text-slate-300 text-sm font-medium">
                {isLoading ? (
                    <div className="h-4 w-10 bg-neutral-dark-border animate-pulse rounded ml-auto"></div>
                ) : (
                    (isCrypto || asset.sector === "Criptomoedas") ? <span className="text-slate-600 text-[11px] font-normal italic">N/A</span> : displayPeRatio
                )}
            </div>

            {/* DY */}
            <div className="hidden lg:block lg:col-span-1 text-right text-slate-300 text-sm font-medium">
                {isLoading ? (
                    <div className="h-4 w-10 bg-neutral-dark-border animate-pulse rounded ml-auto"></div>
                ) : (
                    (isCrypto || asset.sector === "Criptomoedas") ? <span className="text-slate-600 text-[11px] font-normal italic">N/A</span> : displayDividendYield
                )}
            </div>

            {/* Sentimento */}
            <div className="hidden sm:flex sm:col-span-2 items-center gap-2 px-2 overflow-visible">
                {aiScore !== null ? (
                    // Se houver nota de IA, priorizamos a nota e escondemos placeholder de sentimento
                    <div className="flex-1 flex items-baseline gap-1">
                        <span className={`text-[10px] font-bold ${sentimentColor} ${sentimentGlow}`}>{sentimentValue}%</span>
                        <div className="flex-1 h-1.5 min-w-[50px] bg-zinc-800/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${sentimentBg} ${sentimentGlow}`}
                                style={{ width: `${sentimentValue}%` }}
                            ></div>
                        </div>
                    </div>
                ) : isCached ? (
                    <div className="flex-1 flex items-baseline gap-1">
                        <span className={`text-[10px] font-bold ${sentimentColor} ${sentimentGlow}`}>{sentimentValue}%</span>
                        <div className="flex-1 h-1.5 min-w-[70px] bg-zinc-800/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${sentimentBg} ${sentimentGlow}`}
                                style={{ width: `${sentimentValue}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-600 font-bold text-[10px]">--</span>
                )}
            </div>

            {/* Analista Rastro Ativa (Score de IA) */}
            <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-2 px-2 overflow-visible">
                {aiScore !== null ? (
                    <div className="flex flex-col items-center">
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-emerald-400">
                                {aiScore.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">/10</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity" title="Aguardando análise automática (abra o ativo para carregar)">
                        <span className="material-symbols-outlined text-[14px]">terminal</span>
                        <span className="text-[9px] font-mono ml-1 uppercase tracking-tighter text-amber-500/80">[ PENDING ]</span>
                    </div>
                )}
            </div>
        </Link>
    );
};

export default function MercadoPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
    const [selectedSentiment, setSelectedSentiment] = useState("Todos");
    const [marketCapRange, setMarketCapRange] = useState<[number, number]>([0, 3000]); // 0 to $3T+
    const [selectedMarket, setSelectedMarket] = useState<string>("Todos");
    const [aiRatings, setAiRatings] = useState<Record<string, number>>({});
    const [b3Category, setB3Category] = useState<string>("Todos");
    const [currentPage, setCurrentPage] = useState(1);
    const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
    const [marketData, setMarketData] = useState<Record<string, number>>({});
    const itemsPerPage = 8;

    // Estados de Ordenação (FORÇADOS: Valor de Mercado Descendente)
    const sortBy = "marketCap";
    const sortOrder = "desc";

    // Função de Auxílio para Tratar Números (converte strings como "R$ 100B" em números)
    const parseValue = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        // Remove R$, pontos e converte B para bilhões, M para milhões
        let num = String(val).replace(/[R$U$\s.]/g, '').replace(',', '.');
        if (num.includes('T')) return parseFloat(num) * 1e12;
        if (num.includes('B')) return parseFloat(num) * 1e9;
        if (num.includes('M')) return parseFloat(num) * 1e6;
        return parseFloat(num) || 0;
    };

    // Accordion states
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Trigger para re-ordenar a lista quando os filhos buscam novos dados
    const [cacheTrigger, setCacheTrigger] = useState(0);
    const [pendingUpdate, setPendingUpdate] = useState(false);

    // Debounce: Evita o "Event Storm" (re-filtrar centenas de vezes por segundo)
    useEffect(() => {
        if (!pendingUpdate) return;
        
        const timer = setTimeout(() => {
            setCacheTrigger(prev => prev + 1);
            setPendingUpdate(false);
            console.log("⚡ [Performance] Re-filtrando mercado após lote de atualizações.");
        }, 1000); // Espera 1s de silêncio para re-ordenar

        return () => clearTimeout(timer);
    }, [pendingUpdate]);

    const loadMarketData = () => {
        const mData: Record<string, number> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('api_data_')) {
                try {
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        const ticker = key.replace('api_data_', '').toUpperCase();
                        const val = parsed.data?.marketCap;
                        if (val && val !== "--" && val !== "N/D") {
                            mData[ticker] = parseMarketValue(val);
                        }
                    }
                } catch (e) {}
            }
        }
        setMarketData(mData);
    };

    // Helper para converter "100B" etc em número real para o mapa
    const parseMarketValue = (val: any) => {
        if (typeof val === 'number') return val;
        const clean = String(val).replace(/[R$U$\s]/g, '').replace(',', '.');
        let factor = 1;
        if (clean.includes('T')) factor = 1e12;
        else if (clean.includes('B')) factor = 1e9;
        else if (clean.includes('M')) factor = 1e6;
        return (parseFloat(clean) || 0) * factor;
    };

    const loadRatings = () => {
        const ratingsMap: Record<string, number> = {};
        
        // 1. Coleta todas as chaves de AI Rating do localStorage de uma vez (O(K))
        const aiKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('ai_rating_')) aiKeys.push(key);
        }

        // 2. Mapeia chaves para assets (O(N + K))
        assetsDatabase.forEach(asset => {
            const cleanT = normalizeTickerForCache(asset.ticker);
            const legacyClean = asset.ticker.replace('.SA', '').replace('-USD', '').toUpperCase();
            
            let bestScore: number | null = null;
            let lastTimestamp = -1;

            // Filtra chaves relevantes (incluindo as novas normalizadas v2)
            const keysToSearch = [
                `ai_rating_v2_${cleanT}`,
                `ai_rating_${asset.ticker.toUpperCase()}`,
                `ai_rating_${legacyClean}`
            ];

            // Também considera chaves capturadas no scan inicial que contenham o ticker
            const additionalKeys = aiKeys.filter(k => k.includes(cleanT) || k.includes(legacyClean));
            const allKeys = Array.from(new Set([...keysToSearch, ...additionalKeys]));

            allKeys.forEach(k => {
                const saved = localStorage.getItem(k);
                if (!saved) return;

                try {
                    const parsed = JSON.parse(saved);
                    const val = parsed.score ?? parsed.aiScore ?? parsed.rating ?? parsed.data?.score;
                    const updateTime = parsed.lastUpdate ? new Date(parsed.lastUpdate).getTime() : 0;
                    
                    if (val !== undefined && val !== null) {
                        // Prioriza chaves com a marca v2 ou a mais recente cronologicamente
                        const isV2 = k.includes('_v2_');
                        if (bestScore === null || isV2 || updateTime > lastTimestamp) {
                            lastTimestamp = updateTime;
                            bestScore = parseFloat(String(val));
                        }
                    }
                } catch (e) {
                    const num = parseFloat(saved);
                    if (!isNaN(num) && bestScore === null) {
                        bestScore = num;
                    }
                }
            });

            if (bestScore !== null) {
                ratingsMap[asset.ticker] = bestScore;
            }
        });
        setAiRatings(ratingsMap);
    };

    useEffect(() => {
        // --- LIMPEZA DE ALUCINAÇÕES (PURGE) ---
        // Se encontrarmos notas que foram geradas sem relatório (usando o prompt genérico antigo),
        // nós as removemos do localStorage para que não apareçam mais no rastreamento.
        const purgeHallucinations = () => {
            let purgedCount = 0;
            const keysToRemove: string[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('ai_rating_')) {
                    const saved = localStorage.getItem(key);
                    if (saved && saved.includes("Avaliação do ativo") && saved.includes("como criptomoeda")) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(k => {
                localStorage.removeItem(k);
                purgedCount++;
            });
            
            if (purgedCount > 0) {
                console.log(`🧹 [Purge] Removidas ${purgedCount} análises alucinadas sem relatório.`);
                loadRatings(); // Recarrega as notas após a limpeza
            }
        };

        // Força uma re-avaliação do cache na hidratação do cliente
        setCacheTrigger(prev => prev + 1);
        purgeHallucinations();
        loadRatings();
        loadMarketData();
        
        const handleCacheUpdate = () => {
            setPendingUpdate(true);
            loadRatings();
            loadMarketData();
        };
        const handleFocus = () => {
            console.log("🔄 Janela focada: Atualizando dados do cache...");
            setPendingUpdate(true);
            loadRatings();
            loadMarketData();
        };
        const handleStorage = (e: StorageEvent) => {
            if (e.key?.startsWith('ai_rating_') || e.key === 'user_market_filters' || e.key?.startsWith('api_data_')) {
                console.log("💾 Storage alterado: Sincronizando notas...");
                setPendingUpdate(true);
                loadRatings();
                loadMarketData();
            }
        };

        window.addEventListener('marketDataUpdated', handleCacheUpdate);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleStorage);
        
        return () => {
            window.removeEventListener('marketDataUpdated', handleCacheUpdate);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    // Auto-Load Filters on Mount
    useEffect(() => {
        setIsMounted(true);
        // Tenta ler primeiro do sessionStorage (Navegação temporária Voltar)
        const sessionState = sessionStorage.getItem("rastro_market_session_state");
        
        if (sessionState) {
            try {
                const parsed = JSON.parse(sessionState);
                if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm);
                if (parsed.selectedSectors !== undefined) setSelectedSectors(parsed.selectedSectors);
                if (parsed.selectedSentiment !== undefined) setSelectedSentiment(parsed.selectedSentiment);
                if (parsed.marketCapRange !== undefined) setMarketCapRange(parsed.marketCapRange);
                if (parsed.selectedMarket !== undefined) setSelectedMarket(parsed.selectedMarket);
                if (parsed.b3Category !== undefined) setB3Category(parsed.b3Category);
                if (parsed.activeQuickFilter !== undefined) setActiveQuickFilter(parsed.activeQuickFilter);
                if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
            } catch (error) {
                console.error("Failed to parse session filters", error);
            }
        } else {
            // Fallback para filtros estáticos de localStorage se não houver sessão ativa
            const saved = localStorage.getItem("user_market_filters");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm);
                    if (parsed.selectedSectors !== undefined) setSelectedSectors(parsed.selectedSectors);
                    if (parsed.selectedSentiment !== undefined) setSelectedSentiment(parsed.selectedSentiment);
                    if (parsed.marketCapRange !== undefined) setMarketCapRange(parsed.marketCapRange);
                    if (parsed.selectedMarket !== undefined) setSelectedMarket(parsed.selectedMarket);
                } catch (error) {
                    console.error("Failed to parse saved localStorage filters", error);
                }
            }
        }
    }, []);

    // Sync state changes automatically to sessionStorage
    useEffect(() => {
        if (!isMounted) return;
        
        const stateSnapshot = {
            searchTerm,
            selectedSectors,
            selectedSentiment,
            marketCapRange,
            selectedMarket,
            b3Category,
            activeQuickFilter,
            currentPage
        };
        sessionStorage.setItem("rastro_market_session_state", JSON.stringify(stateSnapshot));
    }, [searchTerm, selectedSectors, selectedSentiment, marketCapRange, selectedMarket, b3Category, activeQuickFilter, currentPage, isMounted]);

    const saveFilters = () => {
        setIsSaving(true);
        localStorage.setItem("user_market_filters", JSON.stringify({
            searchTerm,
            selectedSectors,
            selectedSentiment,
            marketCapRange,
            selectedMarket
        }));
        setTimeout(() => setIsSaving(false), 2000);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedSectors([]);
        setSelectedSentiment("Todos");
        setMarketCapRange([0, 3000]);
        setSelectedMarket("Todos");
        setB3Category("Todos");
        localStorage.removeItem("user_market_filters");
    };

    // Extract unique sectors
    const sectors = ["Todos", ...Array.from(new Set(assetsDatabase.map(a => a.sector)))];

    // Helper to parse market cap strings (ex: "1.5T" -> 1500, "200B" -> 200)
    const parseMarketCap = (capStr?: string): number => {
        if (!capStr) return 0;
        // Remove "R$", "U$", "B", "T", spaces and handle decimal comma
        const cleanedStr = capStr.replace(/[R$U$BT\s,]/gi, (match) => match === ',' ? '.' : '');
        const value = parseFloat(cleanedStr);
        if (isNaN(value)) return 0;

        // Multiply by 1000 if it's Trillions to normalize everything to Billions
        if (capStr.toUpperCase().includes('T')) return value * 1000;
        return value;
    };

    const toggleSector = (sectorName: string) => {
        setSelectedSectors(prev =>
            prev.includes(sectorName) ? prev.filter(s => s !== sectorName) : [...prev, sectorName]
        );
    };

    const filteredAssets = useMemo(() => {
        // 1. FUNÇÃO DE PARSE UNIFICADA (Interna para garantir consistência)
        const getNumericValue = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val || val === "--" || val === "N/D") return 0;
            const clean = String(val).replace(/[R$U$\s]/g, '').replace(',', '.');
            let factor = 1;
            if (clean.includes('T')) factor = 1e12;
            else if (clean.includes('B')) factor = 1e9;
            else if (clean.includes('M')) factor = 1e6;
            return (parseFloat(clean) || 0) * factor;
        };

        // 2. PRÉ-PROCESSAMENTO: Resolve todos os market caps uma única vez (O(N)) usando o state otimizado
        const resolvedMarketCapMap = new Map<string, number>();
        const fallbackWeights: Record<string, string> = {
            "PETR4.SA": "500B", "PETR3.SA": "500B",
            "VALE3.SA": "300B",
            "ITUB4.SA": "300B", "ITUB3.SA": "300B",
            "WEGE3.SA": "160B",
            "BBAS3.SA": "160B",
            "BBDC4.SA": "140B", "BBDC3.SA": "140B",
            "ELET3.SA": "100B", "ELET6.SA": "100B",
            "RENT3.SA": "60B",
            "BPAC11.SA": "150B",
            "SUZB3.SA": "70B",
            "B3SA3.SA": "65B",
            "RADL3.SA": "45B",
            "EQTL3.SA": "40B",
            "VIVT3.SA": "85B",
            "JBSS3.SA": "60B",
            "SBSP3.SA": "55B",
            "GGBR4.SA": "40B",
            "HAPV3.SA": "35B",
            "RAIL3.SA": "45B"
        };

        assetsDatabase.forEach(asset => {
            const baseT = asset.ticker.replace('.SA', '').toUpperCase();
            // Tenta primeiro o state marketData (que já é numérico e pré-carregado)
            let mCap = marketData[baseT] || 0;

            if (mCap === 0) {
                const fw = fallbackWeights[asset.ticker];
                if (fw) mCap = getNumericValue(fw);
                else mCap = getNumericValue(asset.marketCap);
            }
            resolvedMarketCapMap.set(asset.ticker, mCap);
        });

        // 3. FILTRAGEM
        let result = assetsDatabase.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.ticker.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(asset.sector);

            // Filtro de Market Cap
            const mCap = resolvedMarketCapMap.get(asset.ticker) || 0;
            const minCap = marketCapRange[0] * 1e9; 
            const maxCap = marketCapRange[1] === 3000 ? Infinity : marketCapRange[1] * 1e9;
            const matchesMarketCap = mCap >= minCap && mCap <= maxCap;

            let matchesSentiment = true;
            if (selectedSentiment === "Muito Otimista") matchesSentiment = asset.sentiment >= 80;
            else if (selectedSentiment === "Otimista") matchesSentiment = asset.sentiment >= 55 && asset.sentiment < 80;
            else if (selectedSentiment === "Neutro") matchesSentiment = asset.sentiment < 55;

            let matchesMarket = true;
            if (selectedMarket === "Criptomoedas") {
                matchesMarket = !!asset.cgId || asset.sector === "Criptomoedas" || asset.exchange === "Crypto";
            } else if (selectedMarket === "B3") {
                matchesMarket = asset.exchange === "B3" || (!asset.cgId && asset.exchange !== "NASDAQ" && asset.exchange !== "NYSE" && asset.exchange !== "OTC" && asset.exchange !== "Crypto Market");

                if (matchesMarket && b3Category !== "Todos") {
                    const cleanTicker = asset.ticker.replace(".SA", "");
                    const isETF = asset.name.includes("ETF") || ["BOVA11", "IVVB11", "SMAL11", "HASH11", "ECOO11"].includes(cleanTicker);
                    const isFII = cleanTicker.endsWith("11") && !isETF;
                    const isAcao = !isETF && !isFII;

                    if (b3Category === "Ações") matchesMarket = isAcao;
                    else if (b3Category === "FIIs") matchesMarket = isFII;
                    else if (b3Category === "ETFs") matchesMarket = isETF;
                }
            } else if (selectedMarket === "EUA") {
                matchesMarket = asset.exchange === "NASDAQ" || asset.exchange === "NYSE" || asset.exchange === "OTC";
            }

            let matchesQuickFilter = true;
            if (activeQuickFilter) {
                const pl = getNumericValue(asset.peRatio);
                const pvp = getNumericValue((asset as any).pvp || (asset as any).priceToBook);
                const dy = getNumericValue(asset.dividendYield);
                
                if (activeQuickFilter === 'crescimento') {
                    matchesQuickFilter = pl > 20 && dy > 15;
                } else if (activeQuickFilter === 'valor') {
                    matchesQuickFilter = pl > 0 && pl < 12 && pvp > 0 && pvp < 1.5;
                } else if (activeQuickFilter === 'dividendos') {
                    matchesQuickFilter = dy > 6;
                } else if (activeQuickFilter === 'otimistas') {
                    const cachedStr = typeof window !== 'undefined' ? (localStorage.getItem(`grok_sentiment_v2_${asset.ticker}`) || localStorage.getItem(`sentiment_cache_${asset.ticker}`)) : null;
                    let sentVal = asset.sentiment || 0;
                    if (cachedStr) {
                        try {
                            const parsed = JSON.parse(cachedStr);
                            const val = parsed.data?.value ?? parsed.value;
                            sentVal = val !== undefined ? val : sentVal;
                        } catch (e) {}
                    }
                    matchesQuickFilter = sentVal >= 70;
                }
            }

            return matchesSearch && matchesSector && matchesMarketCap && matchesSentiment && matchesMarket && matchesQuickFilter;
        });

        // 4. ORDENAÇÃO (ESTABILIZADA: Removemos cacheTrigger das dependências)
        return [...result].sort((a, b) => {
            const valA = resolvedMarketCapMap.get(a.ticker) || 0;
            const valB = resolvedMarketCapMap.get(b.ticker) || 0;

            if (valA === valB) return a.ticker.localeCompare(b.ticker);
            return valB - valA; 
        });
    }, [searchTerm, selectedSectors, selectedSentiment, marketCapRange, selectedMarket, b3Category, activeQuickFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSectors, selectedSentiment, marketCapRange, selectedMarket, b3Category]);

    const totalFound = filteredAssets.length;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAssets = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);

    const counterText = totalFound > 0
        ? `Mostrando ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, totalFound)} de ${totalFound} ativos encontrados`
        : "Nenhum ativo encontrado";





    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col selection:bg-primary selection:text-black">
            <Header currentPath="/mercado" />
            <MarketTicker />

            <main className="flex-1 w-full bg-black h-auto lg:h-[calc(100vh-65px)] overflow-hidden">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-2 lg:py-3 h-full flex flex-col gap-3 lg:gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mt-0">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">Rastreador de <span className="text-primary">IA</span></h1>
                        <p className="text-slate-400 text-xs md:text-sm mt-1">Filtre ativos com métricas baseadas em IA e sentimento social.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* BARRA DE PESQUISA INTEGRADA AOS BOTÕES */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar ticker ou ativo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-neutral-dark-surface border border-neutral-dark-border text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${showFilters ? 'bg-primary text-black border-primary' : 'bg-neutral-dark-surface border-neutral-dark-border hover:border-primary/50 text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-sm">tune</span>
                                {showFilters ? 'Ocultar Filtros' : 'Filtrar Ativos'}
                            </button>
                        </div>

                        <button
                            onClick={saveFilters}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all group ${isSaving ? 'bg-primary/20 border-primary text-primary' : 'bg-neutral-dark-surface border-neutral-dark-border hover:border-primary text-white'}`}
                        >
                            <span className={`material-symbols-outlined transition-transform text-[18px] ${isSaving ? 'text-primary' : 'text-primary group-hover:scale-110'}`}>
                                {isSaving ? 'check_circle' : 'bookmark'}
                            </span>
                            {isSaving ? 'Salvo!' : 'Salvar Filtro'}
                        </button>
                        <button
                            onClick={() => {
                                // Limpa apenas caches de API (api_data_*)
                                Object.keys(localStorage).forEach(key => {
                                    if (key.startsWith('api_data_')) localStorage.removeItem(key);
                                });
                                window.location.reload();
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-neutral-dark-surface border border-neutral-dark-border hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-lg text-sm transition-all group"
                            title="Limpar cache e recarregar dados da API"
                        >
                            <span className="material-symbols-outlined text-[18px] group-hover:animate-spin">refresh</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 lg:gap-6 overflow-y-auto mt-2 custom-scrollbar">
                    {showFilters && (
                        <div className="w-full p-6 bg-zinc-950/50 border border-zinc-900 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col md:flex-row flex-wrap gap-8">
                                {/* SECTOR FILTER */}
                                <div className="flex flex-col gap-3 min-w-[200px] flex-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setor e Indústria</span>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedSectors([])}
                                            className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${selectedSectors.length === 0 ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-transparent border-zinc-800 text-slate-400 hover:border-zinc-700'}`}
                                        >
                                            Todos
                                        </button>
                                        {sectors.filter(s => s !== "Todos").map(sector => {
                                            const isSelected = selectedSectors.includes(sector);
                                            return (
                                                <button
                                                    key={sector}
                                                    onClick={() => toggleSector(sector)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${isSelected ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-transparent border-zinc-800 text-slate-400 hover:border-zinc-700'}`}
                                                >
                                                    {sector}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* VALOR DE MERCADO */}
                                <div className="flex flex-col gap-3 min-w-[280px]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor de Mercado</span>
                                    <div className="px-2 pt-2">
                                        <div className="relative h-1 mb-6">
                                            <div className="absolute w-full h-1 bg-zinc-800 rounded-full top-0"></div>
                                            <div
                                                className="absolute h-1 bg-primary rounded-full top-0"
                                                style={{
                                                    left: `${(marketCapRange[0] / 3000) * 100}%`,
                                                    right: `${100 - (marketCapRange[1] / 3000) * 100}%`
                                                }}
                                            ></div>
                                            <input
                                                type="range" min="0" max="3000" step="50"
                                                value={marketCapRange[0]}
                                                onChange={(e) => setMarketCapRange(prev => [Math.min(Number(e.target.value), prev[1] - 50), prev[1]])}
                                                className="absolute w-full -top-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                            />
                                            <input
                                                type="range" min="0" max="3000" step="50"
                                                value={marketCapRange[1]}
                                                onChange={(e) => setMarketCapRange(prev => [prev[0], Math.max(Number(e.target.value), prev[0] + 50)])}
                                                className="absolute w-full -top-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                            />
                                            <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400">
                                                <span>Min: {marketCapRange[0] >= 1000 ? `$${(marketCapRange[0] / 1000).toFixed(1)}T` : `$${marketCapRange[0]}B`}</span>
                                                <span>Max: {marketCapRange[1] >= 1000 ? (marketCapRange[1] >= 3000 ? "$3T+" : `$${(marketCapRange[1] / 1000).toFixed(1)}T`) : `$${marketCapRange[1]}B`}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SENTIMENTO */}
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                        Sentimento Social
                                        <InfoTooltip text="Pontuação baseada em fluxos sociais" />
                                    </span>
                                    <div className="flex gap-2">
                                        {[
                                            { label: "Otimista", value: "Muito Otimista", color: "bg-market-up" },
                                            { label: "Neutro", value: "Neutro", color: "bg-slate-500" }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSelectedSentiment(selectedSentiment === opt.value ? "Todos" : opt.value)}
                                                className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold transition-all ${selectedSentiment === opt.value ? 'bg-primary/10 border-primary text-white' : 'bg-black border-zinc-800 text-slate-400 hover:border-zinc-700'}`}
                                            >
                                                {opt.label}
                                                <div className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ÁREA DA TABELA - Restoration from HTML */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {/* Filtros Rápido */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                            <button
                                onClick={() => setActiveQuickFilter(activeQuickFilter === 'crescimento' ? null : 'crescimento')}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                                    activeQuickFilter === 'crescimento' 
                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-transparent border border-white/10 text-slate-400 hover:text-white'
                                }`}>
                                Alto Crescimento
                            </button>
                            <button
                                onClick={() => setActiveQuickFilter(activeQuickFilter === 'valor' ? null : 'valor')}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                                    activeQuickFilter === 'valor' 
                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-transparent border border-white/10 text-slate-400 hover:text-white'
                                }`}>
                                Ações de Valor
                            </button>
                            <button
                                onClick={() => setActiveQuickFilter(activeQuickFilter === 'dividendos' ? null : 'dividendos')}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                                    activeQuickFilter === 'dividendos' 
                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-transparent border border-white/10 text-slate-400 hover:text-white'
                                }`}>
                                Aristocratas de Dividendos
                            </button>
                            <button
                                onClick={() => setActiveQuickFilter(activeQuickFilter === 'otimistas' ? null : 'otimistas')}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                                    activeQuickFilter === 'otimistas' 
                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-transparent border border-white/10 text-slate-400 hover:text-white'
                                }`}>
                                Mais Otimistas no Fórum
                                <span className={`material-symbols-outlined text-[14px] ${activeQuickFilter === 'otimistas' ? 'text-black' : 'text-primary'}`}>forum</span>
                            </button>
                        </div>

                        {/* Filtros de Mercado */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-2 mr-1">Mercado:</span>
                            {["Todos", "B3", "EUA", "Criptomoedas"].map(market => (
                                <button
                                    key={market}
                                    onClick={() => {
                                        setSelectedMarket(market);
                                        setB3Category("Todos");
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                                        selectedMarket === market 
                                            ? 'bg-zinc-700 text-white border-zinc-600 shadow-sm' 
                                            : 'bg-transparent border-zinc-800 text-slate-400 hover:text-white hover:border-zinc-700'
                                    }`}>
                                    {market}
                                </button>
                            ))}
                        </div>

                        {/* SUB-FILTROS DINÂMICOS PARA B3 (Inserção Automática) */}
                        {selectedMarket === "B3" && (
                            <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-[10px] font-bold text-slate-500 uppercase ml-2 mr-1">Refinar:</span>
                                {["Todos", "Ações", "FIIs", "ETFs"].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setB3Category(cat)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${b3Category === cat
                                            ? "bg-zinc-700 border-zinc-600 text-white shadow-lg"
                                            : "bg-transparent border-zinc-800 text-slate-400 hover:border-zinc-700 hover:text-white"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 bg-neutral-dark-surface rounded-xl border border-neutral-dark-border flex flex-col shadow-2xl overflow-visible">
                            {/* CABEÇALHO TABELA */}
                            <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-2 bg-black border-b border-neutral-dark-border items-center sticky top-0 z-10 w-full">
                                <div className="col-span-6 md:col-span-2 text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1 cursor-default">
                                    Ticker
                                </div>
                                <div className="col-span-6 md:col-span-2 text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider text-right cursor-default">
                                    Preço
                                </div>
                                <div className="hidden md:block md:col-span-2 text-xs font-bold text-primary uppercase tracking-wider text-right cursor-default">
                                    Val. Mercado <span className="text-[10px]">↓</span>
                                </div>
                                <div className="hidden lg:block lg:col-span-1 text-xs font-bold text-primary uppercase tracking-wider text-right cursor-default">
                                    P/L
                                </div>
                                <div className="hidden lg:block lg:col-span-1 text-xs font-bold text-primary uppercase tracking-wider text-right cursor-default">Div Yield</div>
                                <div className="hidden sm:flex sm:col-span-2 text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider text-center justify-center items-center gap-1 cursor-default overflow-visible">
                                    Sentimento
                                    <InfoTooltip text="Pontuação baseada em notícias, redes sociais e fluxos institucionais de curto prazo." />
                                </div>
                                <div className="hidden sm:flex sm:col-span-2 text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider text-center justify-center items-center gap-1 cursor-default overflow-visible">
                                    <span className="material-symbols-outlined text-primary text-[14px] md:text-[16px]">psychology</span>
                                    <span className="whitespace-nowrap">Nota</span>
                                    <InfoTooltip text="Nota de 0 a 10 baseada na tese fundamentalista e fluxo institucional." />
                                </div>
                            </div>

                            {/* LINHAS TABELA */}
                            <div className="overflow-y-auto flex-1 custom-scrollbar overflow-x-hidden">
                                <div className="w-full">
                                    {isMounted ? (
                                        currentAssets.length > 0 ? (
                                            currentAssets.map(asset => (
                                                <AssetRow 
                                                    key={asset.ticker} 
                                                    asset={asset} 
                                                    aiScore={aiRatings[asset.ticker]} 
                                                />
                                            ))
                                        ) : (

                                            <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                                                <span className="material-symbols-outlined text-4xl mb-2 text-slate-500">search_off</span>
                                                <p className="text-lg font-bold text-white mb-1">Nenhum ativo encontrado</p>
                                                <p className="text-sm">Tente redefinir seus filtros ou buscar por outro termo.</p>
                                                <button
                                                    onClick={resetFilters}
                                                    className="mt-6 px-4 py-2 border border-neutral-dark-border bg-black hover:border-primary hover:text-primary text-white rounded transition-colors text-sm font-medium"
                                                >
                                                    Limpar Pesquisa
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                                            <p className="font-medium text-sm">Carregando mercado...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RODÉ TABELA */}
                            <div className="p-4 border-t border-neutral-dark-border bg-black/50 flex flex-col sm:flex-row items-center justify-between text-[10px] md:text-xs text-slate-500 gap-4">
                                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-6 w-full sm:w-auto">
                                    <span className="text-slate-400 font-medium text-center sm:text-left">{counterText}</span>
                                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 bg-neutral-dark-surface border border-neutral-dark-border rounded-lg text-slate-300 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-neutral-dark-border disabled:hover:text-slate-300 transition-all flex items-center gap-1 flex-1 sm:flex-none justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            disabled={indexOfLastItem >= totalFound}
                                            className="px-3 py-1.5 bg-neutral-dark-surface border border-neutral-dark-border rounded-lg text-slate-300 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-neutral-dark-border disabled:hover:text-slate-300 transition-all flex items-center gap-1 flex-1 sm:flex-none justify-center"
                                        >
                                            Próximo
                                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="hidden sm:block text-slate-400 font-medium">Base de Dados Completa</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            </main>
        </div>
    );
}
