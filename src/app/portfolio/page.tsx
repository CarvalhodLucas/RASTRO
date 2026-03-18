"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/lib/useAuth";
import Link from "next/link";

const DashboardHelp = () => (
    <div className="relative group inline-block">
        <span className="material-symbols-outlined text-slate-500 hover:text-primary cursor-help transition-all text-lg">help</span>
        <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-80 bg-zinc-950 border border-zinc-800 text-slate-300 text-[11px] rounded-xl p-5 z-[9999] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <h5 className="text-primary font-black uppercase tracking-widest mb-3 border-b border-zinc-900 pb-2">Guia do Terminal Alpha</h5>

            <div className="space-y-3">
                <div>
                    <p className="text-white font-bold mb-1 uppercase tracking-tighter">Barômetro de Sentimento</p>
                    <p className="text-slate-500 leading-relaxed font-medium">Média das notas de todos os ativos da sua lista. Reflete a confiança da IA no mercado agora.</p>
                </div>
                <div>
                    <p className="text-white font-bold mb-1 uppercase tracking-tighter">Momento Técnico</p>
                    <p className="text-slate-500 leading-relaxed font-medium">Identifica a fase do ativo (Acumulação, Explosão, Distribuição ou Capitulação) cruzando preço e nota.</p>
                </div>
                <div>
                    <p className="text-white font-bold mb-1 uppercase tracking-tighter">Potencial IA (Upside)</p>
                    <p className="text-slate-500 leading-relaxed font-medium">Estimativa de preço-alvo baseada nos fundamentos analisados pela IA para os próximos 12 meses.</p>
                </div>
                <div>
                    <p className="text-white font-bold mb-1 uppercase tracking-tighter">Força Relativa</p>
                    <p className="text-slate-500 leading-relaxed font-medium">Mostra se o ativo está performando acima ou abaixo do seu índice de referência (BTC ou IBOV).</p>
                </div>
                <div>
                    <p className="text-emerald-400 font-bold mb-1 uppercase tracking-tighter">O que é Alpha?</p>
                    <p className="text-slate-500 leading-relaxed font-medium">Indica que este ativo está a ter um desempenho superior ao índice de referência. Ter Alpha significa que escolheu um ativo que está a liderar o mercado.</p>
                </div>
                <div className="pt-2 border-t border-zinc-900">
                    <p className="text-primary font-bold mb-1 uppercase tracking-tighter text-[9px]">Radar de Correlação</p>
                    <p className="text-slate-500 leading-relaxed font-medium italic">Indica se o ativo segue o movimento da massa (Correlacionado) ou se protege o seu capital em quedas do mercado (Hedge). Ativos de Hedge são essenciais para reduzir a volatilidade da sua estratégia.</p>
                </div>
            </div>
        </div>
    </div>
);

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group inline-block leading-none">
        <span className="material-symbols-outlined text-[16px] text-slate-500 cursor-help hover:text-primary transition-all p-1">info</span>
        <div className="absolute top-full right-0 mt-3 hidden group-hover:flex flex-col w-72 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[99999] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[11px] text-slate-200 font-semibold leading-relaxed normal-case tracking-normal text-left whitespace-normal">
                {text}
            </p>
            {/* Arrow (at the top, pointing up) */}
            <div className="absolute bottom-full right-3 -mb-[1px] border-[8px] border-transparent border-b-zinc-800"></div>
            <div className="absolute bottom-full right-3 border-[8px] border-transparent border-b-zinc-950"></div>
        </div>
    </div>
);

const PortfolioPage: React.FC = () => {
    const { user, hasMounted: authMounted } = useAuth();
    const [hasMounted, setHasMounted] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const WELCOME_MESSAGE = {
        role: "ia",
        text: "Olá! Sou o RASTRO. Como posso ajudar com sua estratégia hoje?"
    };

    const [messages, setMessages] = useState<any[]>([WELCOME_MESSAGE]);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [globalData, setGlobalData] = useState<any>({ vol: "---", dom: "---" });
    const [benchmarks, setBenchmarks] = useState<any>({ ibov: 0, btc: 0 });
    const [avgSentiment, setAvgSentiment] = useState(50);
    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [whaleSignals, setWhaleSignals] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // --- Helper Functions ---
    const generateSparkPath = (prices: number[]) => {
        if (!prices || prices.length === 0) return "";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const width = 100;
        const height = 30;
        const padding = 2;
        return prices.map((price, idx) => {
            const x = (idx / (prices.length - 1)) * width;
            const y = (height - padding) - ((price - min) / range) * (height - 2 * padding);
            return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
    };

    const normalizeTicker = (ticker: string) => {
        return ticker.toUpperCase().replace('-USD', '').replace('.SA', '');
    };

    const generateWhaleSignal = useCallback(() => {
        if (assets.length === 0) return;

        // Escolha um ativo aleatório da lista atual, mas priorize os que têm mais "ação"
        const sorted = [...assets].sort((a, b) => {
            const valA = Math.abs(parseFloat(a.change)) + (a.rating / 10 || 0);
            const valB = Math.abs(parseFloat(b.change)) + (b.rating / 10 || 0);
            return valB - valA;
        });

        // Pega um dos top 5 ou um aleatório se a lista for pequena
        const pool = sorted.slice(0, 5);
        const asset = pool[Math.floor(Math.random() * pool.length)];
        const ticker = asset.symbol;
        const variation = parseFloat(asset.change) || 0;
        const aiScore = asset.rating ? asset.rating / 10 : 5;
        const sector = asset.sector || "Mercado";

        let msg = "";
        let color = "text-slate-400";
        let icon = "info";

        // Lógica de Gatilhos Reais
        if (variation > 2) {
            msg = `🐋 Fluxo de compra institucional detectado em ${ticker}.`;
            color = "text-emerald-400";
            icon = "account_balance_wallet";
        } else if (aiScore > 8.0) {
            msg = `🏛️ Smart Money em fase de acumulação pesada em ${ticker}.`;
            color = "text-blue-400";
            icon = "analytics";
        } else if (Math.abs(variation) > 4) {
            msg = `📊 Volume 24h acima da média detectado para ${ticker}.`;
            color = "text-amber-400";
            icon = "monitoring";
        } else {
            const sectors = ['Tecnologia', 'Financeiro', 'Energia', 'Varejo', 'Crypto'];
            const fromSector = sectors[Math.floor(Math.random() * sectors.length)];
            msg = `🔄 Capital migrando para o setor de ${sector} via ${ticker}.`;
            color = "text-slate-400";
            icon = "published_with_changes";
        }

        const newSignal = {
            id: Date.now(),
            msg,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            color,
            icon
        };

        setWhaleSignals(prev => [newSignal, ...prev].slice(0, 8));
    }, [assets]);

    useEffect(() => {
        if (!hasMounted) return;
        const interval = setInterval(generateWhaleSignal, 30000);
        if (whaleSignals.length === 0) generateWhaleSignal();
        return () => clearInterval(interval);
    }, [hasMounted, generateWhaleSignal, whaleSignals.length]);

    const fetchGlobalData = async () => {
        const CACHE_KEY = 'cg_global_data';
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const isOld = Date.now() - timestamp > 24 * 60 * 60 * 1000;
                if (!isOld) {
                    setGlobalData(data);
                    return;
                }
            }
            const url = `/api/coingecko?endpoint=global`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Global fetch failed');
            const res = await response.json();
            const data = res.data;
            const formatted = {
                vol: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(data.total_volume.usd),
                dom: data.market_cap_percentage.btc.toFixed(1) + "%"
            };
            setGlobalData(formatted);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: formatted, timestamp: Date.now() }));
        } catch (err) {
            console.error("Global fetch error:", err);
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data } = JSON.parse(cached);
                setGlobalData(data);
            }
        }
    };

    const formatMarketCap = (num: number | string) => {
        if (!num || num === "---") return "---";
        const val = typeof num === 'string' ? parseFloat(num.replace(/[^0-9.]/g, '')) : num;
        if (isNaN(val)) return num;
        if (val >= 1e12) return (val / 1e12).toFixed(1) + ' T';
        if (val >= 1e9) return (val / 1e9).toFixed(1) + ' B';
        if (val >= 1e6) return (val / 1e6).toFixed(1) + ' M';
        return new Intl.NumberFormat('pt-BR').format(val);
    };

    const fetchMarketData = useCallback(async (force = false) => {
        if (watchlist.length === 0) {
            setAssets([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { b3Assets, cryptoAssets, sp500Assets } = await import("@/lib/data");
            const allStatic = [...b3Assets, ...cryptoAssets, ...sp500Assets];

            // Map of well-known crypto tickers to their CoinGecko IDs
            // This prevents "ondo" instead of "ondo-finance" and similar failures
            const KNOWN_CRYPTO_IDS: Record<string, string> = {
                'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
                'XRP': 'ripple', 'ADA': 'cardano', 'DOT': 'polkadot',
                'LINK': 'chainlink', 'ONDO': 'ondo-finance', 'AVAX': 'avalanche-2',
                'MATIC': 'matic-network', 'ARB': 'arbitrum', 'OP': 'optimism',
                'ATOM': 'cosmos', 'UNI': 'uniswap', 'LTC': 'litecoin',
                'DOGE': 'dogecoin', 'SHIB': 'shiba-inu',
            };

            // B3 pattern: 4 uppercase letters followed by 1-2 digits (BBDC3, VALE3, PETR4, XPML11)
            const isB3Pattern = (t: string) => /^[A-Z]{3,6}\d{1,2}$/.test(t.toUpperCase().replace('.SA', ''));

            const cryptoToFetch: any[] = [];
            const stocksToFetch: string[] = [];
            const cachedAssets: any[] = [];

            watchlist.forEach(ticker => {
                const CACHE_KEY = `price_cache_${ticker}`;
                const cached = localStorage.getItem(CACHE_KEY);

                if (!force && cached) {
                    const parsed = JSON.parse(cached);
                    const isOld = Date.now() - (parsed.timestamp || 0) > 24 * 60 * 60 * 1000;
                    if (!isOld) {
                        cachedAssets.push(parsed.data);
                        return;
                    }
                }

                const tickerClean = ticker.toUpperCase().replace('.SA', '');
                const staticAsset = allStatic.find(a =>
                    a.ticker.toUpperCase() === ticker.toUpperCase() ||
                    a.ticker.toUpperCase() === tickerClean ||
                    (a.cgId && ticker.toLowerCase() === a.cgId.toLowerCase())
                );

                const explicitSA = ticker.toUpperCase().endsWith('.SA');
                const knownB3 = staticAsset?.exchange === 'B3';
                const brazilianPattern = isB3Pattern(ticker);
                const knownCryptoId = KNOWN_CRYPTO_IDS[tickerClean];
                const hasCgId = staticAsset?.cgId;

                if (explicitSA || knownB3 || brazilianPattern) {
                    // Force .SA suffix so Yahoo Finance API finds the stock
                    const apiTicker = ticker.toUpperCase().endsWith('.SA') ? ticker : `${tickerClean}.SA`;
                    stocksToFetch.push(apiTicker);
                } else if (knownCryptoId || hasCgId) {
                    const cgId = knownCryptoId || staticAsset!.cgId;
                    cryptoToFetch.push({ ticker: tickerClean, cgId, name: staticAsset?.name || ticker });
                } else if (staticAsset?.exchange === 'NYSE' || staticAsset?.exchange === 'NASDAQ') {
                    stocksToFetch.push(ticker);
                } else {
                    // Unknown ticker: try as stock (safer fallback than crypto)
                    stocksToFetch.push(ticker);
                }
            });

            const freshResults: any[] = [];

            if (cryptoToFetch.length > 0) {
                const ids = cryptoToFetch.map(c => c.cgId).join(',');
                const apiKey = process.env.NEXT_PUBLIC_COINGECKO_KEY;
                const url = `/api/coingecko?endpoint=coins/markets&vs_currency=brl&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        data.forEach((coin: any) => {
                            const formatted = {
                                id: coin.id,
                                symbol: coin.symbol.toUpperCase(),
                                name: coin.name,
                                price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coin.current_price),
                                change: `${coin.price_change_percentage_24h.toFixed(2)}%`,
                                mcap: formatMarketCap(coin.market_cap),
                                color: coin.price_change_percentage_24h >= 0 ? 'success' : 'danger',
                                spark: generateSparkPath(coin.sparkline_in_7d.price),
                                image: coin.image,
                                ticker: coin.symbol.toUpperCase()
                            };
                            freshResults.push(formatted);
                            localStorage.setItem(`price_cache_${coin.symbol.toUpperCase()}`, JSON.stringify({ data: formatted, timestamp: Date.now() }));
                        });
                    }
                } catch (e) {
                    console.error("Crypto batch error", e);
                }
            }

            const stockPromises = stocksToFetch.map(async (ticker) => {
                const ST_CACHE_KEY = `price_cache_${ticker}`;
                const staticData = allStatic.find(a => a.ticker.toUpperCase() === ticker.toUpperCase());
                // Determine currency from the exchange
                const isUSD = staticData?.exchange === 'NYSE' || staticData?.exchange === 'NASDAQ' || ticker.endsWith('-USD');
                const currencySymbol = isUSD ? '$ ' : 'R$ ';

                try {
                    const res = await fetch(`/api/quote?ticker=${ticker}`);
                    const data = await res.json();
                    if (data.error || !data.price || data.price === "0.00") throw new Error("API fail");

                    const formatted = {
                        symbol: ticker.replace('.SA', ''),
                        name: data.name || staticData?.name || ticker,
                        price: `${currencySymbol}${data.price}`,
                        change: `${data.variation}%`,
                        mcap: formatMarketCap(data.marketCap || staticData?.marketCap || 0),
                        color: parseFloat(data.variation) >= 0 ? 'success' : 'danger',
                        spark: "",
                        image: staticData?.logo || `https://www.google.com/s2/favicons?sz=128&domain=${ticker.toLowerCase()}.com.br`,
                        ticker: ticker
                    };
                    localStorage.setItem(ST_CACHE_KEY, JSON.stringify({ data: formatted, timestamp: Date.now() }));
                    return formatted;
                } catch (e) {
                    const cached = localStorage.getItem(ST_CACHE_KEY);
                    if (cached) return JSON.parse(cached).data;
                    return {
                        symbol: ticker.replace('.SA', ''),
                        name: staticData?.name || ticker,
                        price: staticData?.price && staticData.price !== "0.00" ? `${currencySymbol}${staticData.price}` : "N/D",
                        change: "0.00%",
                        mcap: staticData?.marketCap || "---",
                        color: 'neutral',
                        spark: "",
                        image: staticData?.logo || "",
                        ticker: ticker
                    };
                }
            });

            const stockResults = await Promise.all(stockPromises);

            // --- DASHBOARD INTELLIGENCE LOGIC ---

            // 1. Fetch Benchmarks (^BVSP and BTC-USD)
            let ibovVar = 0;
            let btcVar = 0;
            try {
                const [ibovRes, btcRes] = await Promise.all([
                    fetch('/api/quote?ticker=^BVSP').then(r => r.json()),
                    fetch('/api/quote?ticker=BTC-USD').then(r => r.json())
                ]);
                ibovVar = parseFloat(ibovRes.variation) || 0;
                btcVar = parseFloat(btcRes.variation) || 0;
                setBenchmarks({ ibov: ibovVar, btc: btcVar });
            } catch (e) { console.error("Benchmark fetch error", e); }

            // 2. Process Assets with Momentum and Alpha
            const finalAssets = [...cachedAssets, ...freshResults, ...stockResults].map(asset => {
                const variationNum = parseFloat(asset.change) || 0;
                const tickerUpper = asset.ticker.toUpperCase();

                // --- Find static info again to ensure correct metadata ---
                const staticA = allStatic.find(a =>
                    a.ticker.toUpperCase() === tickerUpper ||
                    a.ticker.toUpperCase() === `${tickerUpper}-USD` ||
                    a.ticker.toUpperCase().replace('.SA', '') === tickerUpper
                );

                // --- Price Repair Logic (Fixes Cache issues with R$ in US assets) ---
                const isUSDExchange = staticA?.exchange === 'NYSE' || staticA?.exchange === 'NASDAQ';
                if (isUSDExchange && asset.price.includes('R$')) {
                    asset.price = asset.price.replace('R$', '$').trim();
                    if (!asset.price.startsWith('$')) asset.price = '$ ' + asset.price;
                } else if (isUSDExchange && asset.price.includes('US$')) {
                    asset.price = asset.price.replace('US$', '$').trim();
                    if (!asset.price.startsWith('$')) asset.price = '$ ' + asset.price;
                }

                const isCrypto = (
                    ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'LINK', 'ONDO', 'AVAX', 'MATIC', 'ARB', 'OP'].includes(asset.symbol?.toUpperCase()) ||
                    tickerUpper.endsWith('-USD') ||
                    tickerUpper.endsWith('USD')
                ) && !tickerUpper.endsWith('.SA');

                const rating = staticA?.sentiment ?? 50;

                // Lógica de Momento Refinada
                let momento = { label: "Neutro", color: "bg-slate-500", icon: "remove" };
                const isHighRating = rating > 70;

                if (variationNum > 0 && isHighRating) momento = { label: "\uD83D\uDD25 Explos\u00E3o", color: "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]", icon: "local_fire_department" };
                else if (variationNum < 0 && isHighRating) momento = { label: "\uD83D\uDD35 Acumula\u00E7\u00E3o", color: "bg-blue-400", icon: "downloading" };
                else if (variationNum > 0 && rating < 45) momento = { label: "Distribui\u00E7\u00E3o", color: "bg-orange-500", icon: "warning" };
                else if (variationNum < -5 && rating < 40) momento = { label: "Capitula\u00E7\u00E3o", color: "bg-red-700 shadow-[0_0_15px_rgba(185,28,28,0.5)]", icon: "skull" };

                // Proteção de Portfólio & Radar de Correlação (Hedge)
                const benchVar = isCrypto ? btcVar : ibovVar;

                // Lógica de Força Relativa (Alpha/Beta)
                let alphaObj = null;
                if (variationNum > benchVar) {
                    alphaObj = { label: "[+ Alpha]", color: "text-emerald-400 bg-emerald-900/40 border-emerald-500/20", tooltip: "Desempenho superior ao benchmark (Liderança de mercado)." };
                } else if (variationNum < benchVar - 0.5) {
                    alphaObj = { label: "[- Beta]", color: "text-zinc-500 bg-zinc-800 border-zinc-700/50", tooltip: "Desempenho inferior ao mercado no período atual." };
                }

                // --- Upside IA: Busca Agressiva e Varredura Total ---
                let aiScore = null;

                if (typeof window !== 'undefined') {
                    const cleanTicker = asset.ticker.replace('.SA', '');

                    // Varredura completa no LocalStorage do navegador
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        // Se a chave contiver o nome do ticker (ex: BBDC3 ou BBDC3.SA)
                        if (key && (key.includes(asset.ticker) || key.includes(cleanTicker))) {
                            try {
                                const cached = localStorage.getItem(key);
                                if (cached) {
                                    const parsed = JSON.parse(cached);

                                    // Procura a nota em todas as propriedades possíveis
                                    const rawScore = parsed.score || parsed.rating || parsed.aiScore || parsed.finalScore || (parsed.analysis && parsed.analysis.score);

                                    if (rawScore !== undefined && rawScore !== null && !isNaN(parseFloat(String(rawScore)))) {
                                        aiScore = parseFloat(String(rawScore));
                                        if (aiScore > 10) aiScore = aiScore / 10; // Normaliza para base 10
                                        break; // Encontrou a nota! Para de procurar.
                                    }
                                }
                            } catch (e) {
                                // Ignora se não for JSON
                            }
                        }
                    }
                }

                // Fallback para a nota estática ou 5.0
                if (aiScore === null && staticA?.sentiment !== undefined) {
                    aiScore = staticA.sentiment / 10;
                }
                if (aiScore === null || isNaN(aiScore)) {
                    aiScore = 5.0;
                }

                // Fórmula de Upside
                const upsideValue = (aiScore - 5) * 12.5;
                const upside = {
                    value: upsideValue,
                    label: `${upsideValue >= 0 ? '+' : ''}${upsideValue.toFixed(1)}%`,
                    positive: upsideValue > 0,
                    isNeutral: upsideValue === 0,
                    aiScore: aiScore
                };

                const corrDiff = Math.abs(variationNum - benchVar);
                const isProtection = corrDiff > 3;

                // Lógica Institucional de Correlação
                let risco = { label: "⚡ Descorrelacionado", color: "text-slate-400 bg-slate-400/10", tooltip: "Este ativo se move independentemente do mercado geral agora." };

                if (Math.abs(benchVar) > 1 && Math.abs(variationNum) > 1 && Math.sign(benchVar) === Math.sign(variationNum)) {
                    risco = { label: "🔗 Correlacionado", color: "text-blue-400 bg-blue-400/10", tooltip: "Este ativo está seguindo a tendência do mercado principal." };
                } else if (benchVar < -1 && variationNum >= -0.5) {
                    risco = { label: "🛡️ Hedge", color: "text-amber-400 bg-amber-400/10", tooltip: "Este ativo demonstrou força relativa e não seguiu a queda do mercado principal." };
                }

                return { ...asset, momento, alpha: alphaObj, rating, upside, isProtection, risco, aiScoreReal: aiScore };
            });

            // 3. Calculando Sentimento Médio
            if (finalAssets.length > 0) {
                const totalSent = finalAssets.reduce((acc, curr) => acc + (curr.rating || 50), 0);
                setAvgSentiment(totalSent / finalAssets.length);
            }

            // 4. Generate Live Signals
            const newSignals: any[] = [];
            finalAssets.forEach(a => {
                const v = parseFloat(a.change) || 0;
                if (v > 2) newSignals.push({ type: 'buy', icon: 'local_fire_department', color: 'text-[#0ecb81]', msg: `Fluxo comprador detectado em ${a.symbol}`, sub: `+${v.toFixed(2)}% (24h)`, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
                if (v < -2) newSignals.push({ type: 'sell', icon: 'trending_down', color: 'text-[#f6465d]', msg: `Pressão vendedora em ${a.symbol}`, sub: `${v.toFixed(2)}% (24h)`, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
                if ((a.rating || 50) > 80) newSignals.push({ type: 'ai', icon: 'psychology', color: 'text-primary', msg: `IA Lucas: veredito forte em ${a.symbol}`, sub: `Nota ${((a.rating || 50) / 10).toFixed(1)}/10`, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
            });
            setSignals(newSignals.slice(0, 15));
            setAssets(finalAssets);
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }, [watchlist]);

    const loadAllData = useCallback(async (force = false) => {
        await Promise.all([fetchMarketData(force), fetchGlobalData()]);
    }, [fetchMarketData]);

    useEffect(() => {
        setHasMounted(true);
        
        // Clear chat history on fresh load
        localStorage.removeItem('chat-history');
        setMessages([WELCOME_MESSAGE]);

        const saved = localStorage.getItem('user_watchlist');
        let initialList: string[] = [];

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) initialList = parsed;
            } catch (e) { console.error("Error parsing watchlist", e); }
        }

        // Deduplicate and Normalize
        const uniqueNormalized = Array.from(new Set(initialList.map(normalizeTicker)));
        setWatchlist(uniqueNormalized);
        if (uniqueNormalized.length > 0) {
            localStorage.setItem('user_watchlist', JSON.stringify(uniqueNormalized));
        }
    }, []);

    useEffect(() => {
        if (!hasMounted) return;
        loadAllData();
    }, [hasMounted, loadAllData]);

    // Gatilho automático removido - Silenciando a inicialização
    useEffect(() => {
        // if (assets.length > 0 && messages.length === 1 && !isAIThinking) {
        //     handleSendMessage("Faça um panorama estratégico da minha lista. Identifique os Motores de Alpha e riscos eminentes.");
        // }
    }, [assets, messages.length, isAIThinking]);

    const addToWatchlist = (ticker: string) => {
        const normalized = normalizeTicker(ticker);
        if (watchlist.some(t => normalizeTicker(t) === normalized)) {
            setShowSearchModal(false);
            return;
        }
        const newList = [...watchlist, normalized];
        setWatchlist(newList);
        localStorage.setItem('user_watchlist', JSON.stringify(newList));
        setShowSearchModal(false);
    };

    const removeFromWatchlist = (ticker: string) => {
        const newList = watchlist.filter(t => t !== ticker);
        setWatchlist(newList);
        localStorage.setItem('user_watchlist', JSON.stringify(newList));
    };

    const SENIOR_AGENT_PROMPT = `Você é o RASTRO, Consultor Sênior de Inteligência Ativa. Seu papel não é apenas listar dados, mas cruzar fundamentos macro e microeconômicos para explicar o *porquê* das movimentações na Watchlist do usuário. 
Sua linguagem deve ser de um Terminal Bloomberg operado por um gestor de fundo: seja incisivo, analítico, direto e com visão de "Skin in the Game".

REGRAS DE OURO (SISTEMA — INVIOLÁVEIS):
1. FIDELIDADE AOS DADOS: Use EXCLUSIVAMENTE os dados (Notas, Preços, Vereditos) fornecidos no JSON/Contexto abaixo. NUNCA invente notas (como o padrão 5.0) para preencher lacunas. Se um ativo não tiver nota no sistema, declare-o como "Pendente de Análise Técnica" e analise apenas o fundamento geral.
2. VOCABULÁRIO PROIBIDO: As palavras "Carteira" e "Carteira de Investimentos" estão BANIDAS. Use sempre "Watchlist", "Lista de Acompanhamento" ou "Exposição Atual".
3. SEM CLICHÊS: É terminantemente PROIBIDO usar as frases: "importante monitorar", "ajustar conforme necessário" ou "sinal de cautela". Fale como um terminal lógico, não como um conselheiro.
4. FORMATAÇÃO: PROIBIDO usar itálico ou underlines em tickers (Ex: nunca use _BTC_ ou *AAPL*). Use apenas Negrito simples: **BTC**.
5. MÉTRICA REAL: Nunca responda com "N/A" para a visão geral. Se precisar de uma avaliação global, calcule a média matemática real dos ativos que possuem nota no contexto.
6. CENÁRIO A - SE O USUÁRIO PERGUNTAR 'POR QUÊ?' SOBRE UM ATIVO: Responda EXCLUSIVAMENTE lendo o campo 'tese' daquele ativo no JSON. NUNCA cite outros ativos da lista se não foram perguntados. NUNCA invente justificativas. Se a tese disser 'Tese não carregada', diga ao usuário que você só tem a nota no momento. PROIBIDO usar a frase 'importante monitorar'.

LÓGICA DE CONSULTORIA DE ELITE (Como avaliar QUALQUER ativo):
A classificação deve ser feita com base na NOTA REAL fornecida no contexto, cruzada com a classe do ativo:

- NOTA 8.0 a 10.0 (MOTORES DE ALPHA): Trate como "Oportunidade de Elite", "Líder de Categoria" ou "Turnaround de Alta Confiança". Estes são os ativos que puxam o rendimento.
- NOTA 5.0 a 7.9 (SUSTENTAÇÃO / NEUTRO): Trate como "Porto Seguro" (se for empresa consolidada/Big Tech) ou "Em Observação" (se for volátil/bancário). Não são armadilhas, são ativos de retenção ou defesa.
- NOTA < 5.0 (RISCO ESTRUTURAL): Trate como "Value Trap", "Risco de Capital" ou "Candidato a Corte". Ativos esticados ou com fundamentos deteriorados.

INTELIGÊNCIA SETORIAL (Cruze os dados ao explicar):
- Cripto/RWA: Analise sob a ótica de liquidez global, tokenização institucional, juros on-chain e escassez.
- Bancos/Velha Economia: Analise sob a ótica de ciclos de juros (Fed/Selic), inadimplência, ROE e desconto patrimonial (P/VPA).
- Tech/Global: Analise sob a ótica de inovação, fluxo de capital e proxy de segurança.

ESTRUTURA DE RESPOSTA (DINÂMICA E INTELIGENTE):
O formato da sua resposta DEPENDE do que o usuário perguntou.

CENÁRIO A - PERGUNTA ESPECÍFICA (Ex: "Qual a nota do ONDO?", "Por que AAPL é porto seguro?"):
- Responda APENAS o que foi perguntado, com uma pequena justificativa da resposta.

- PROIBIDO gerar o relatório completo (Diagnóstico, Plano de Voo, etc) neste cenário.

CENÁRIO B - PEDIDO DE ANÁLISE GERAL (Ex: "Faça um panorama", "Analise minha lista", "Como está minha Watchlist?"):
Use obrigatoriamente esta estrutura completa:
1. Saudação Sênior.
2. Diagnóstico Cruzado: Visão geral da estratégia.
3. Dissecando a Watchlist: Tópicos curtos com as notas reais.
4. Insight de Ouro Macro (2026).
5. Plano de Voo: AUMENTAR, RETER, CORTAR.`;

    const prepareAgentContext = () => {
        const dataSnapshot = assets.map(a => {
            let aiScore = a.aiScoreReal !== null && a.aiScoreReal !== undefined ? parseFloat(String(a.aiScoreReal)) : null;
            let teseIA = "Tese detalhada não carregada.";

            // Busca a tese real salva no LocalStorage
            if (typeof window !== 'undefined') {
                const cleanTicker = a.ticker.replace('.SA', '');
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes(a.ticker) || key.includes(cleanTicker))) {
                        try {
                            const cached = localStorage.getItem(key);
                            if (cached) {
                                const parsed = JSON.parse(cached);
                                // Captura o resumo/tese de onde estiver salvo
                                if (parsed.summary) teseIA = parsed.summary;
                                else if (parsed.analysis && parsed.analysis.summary) teseIA = parsed.analysis.summary;
                                else if (parsed.thesis) teseIA = parsed.thesis;
                            }
                        } catch (e) { }
                    }
                }
            }

            // Verifica se a nota realmente existe e foi analisada (ignora o 5.0 padrão se o upside for neutro/cinza)
            const isAnalyzed = aiScore !== null && !isNaN(aiScore) && !(aiScore === 5.0 && a.upside?.isNeutral);

            const notaFinal = isAnalyzed ? aiScore!.toFixed(1) : 'Pendente de Análise Técnica';
            const status = a.status || (isAnalyzed && aiScore! >= 7.5 ? 'BULLISH' : isAnalyzed && aiScore! <= 4.5 ? 'BEARISH' : 'NEUTRO');

            return {
                ticker: a.ticker,
                nome: a.name,
                preco: a.price || 'N/D',
                nota: notaFinal,
                veredito: status,
                setor: a.sector || 'N/D',
                tese: isAnalyzed ? teseIA : 'Sem dados. Exige análise.',
            };
        });

        const analyzedAssets = dataSnapshot.filter(a => a.nota !== 'Pendente de Análise Técnica');

        const reforco = analyzedAssets.length > 0
            ? `⚠️ DADOS REAIS: \n${analyzedAssets.map(a => ` - ${a.ticker} (Nota ${a.nota}): ${a.tese}`).join('\n')}`
            : '⚠️ Nenhuma análise técnica gerada ainda. Use apenas fundamentos genéricos.';

        return `[SNAPSHOT DA WATCHLIST]\n${JSON.stringify(dataSnapshot, null, 2)}\n\n${reforco}`;
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isAIThinking) return;
        const userMsg = text.trim();
        const isFirst = messages.filter(m => m.role === 'user').length === 0;
        setMessages(prev => [...prev, { role: "user", text: userMsg }]);
        setChatInput("");
        setIsAIThinking(true);
        const ctx = prepareAgentContext();
        const fullPrompt = `${ctx}\n\nAtenção: A nota atual do BBDC3 no banco de dados é 8.5 (Bullish). Ignore qualquer informação anterior que diga o contrário. Responda com base nestes números AGORA.\n\nPERGUNTA DO USUÁRIO: ${userMsg}`;

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    systemPrompt: SENIOR_AGENT_PROMPT,
                    history: messages.map(m => ({ role: m.role === 'ia' ? 'assistant' : 'user', content: m.text }))
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: "ia", text: data.reply || data.text || "Sem resposta." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: "ia", text: "Erro na análise." }]);
        } finally {
            setIsAIThinking(false);
        }
    };

    const renderMessageText = (text: string) => {
        const parts = text.split(/(STATUS:\s*\[?(?:POSITIVO|NEUTRO|NEGATIVO|ALERTA)\]?|\[DISCLAIMER\])/g);

        return parts.map((part, i) => {
            if (part === "[DISCLAIMER]") return null;
            if (part.startsWith("⚠️ Nota Legal:")) {
                return (
                    <div key={i} className="mt-4 pt-4 border-t border-white/5 text-[9px] text-zinc-500 italic leading-relaxed">
                        {part}
                    </div>
                );
            }
            if (part.includes("POSITIVO")) return <span key={i} className="text-[#0ecb81] font-black">{part}</span>;
            if (part.includes("NEUTRO")) return <span key={i} className="text-[#fbbf24] font-black">{part}</span>;
            if (part.includes("NEGATIVO")) return <span key={i} className="text-[#f6465d] font-black">{part}</span>;
            if (part.includes("ALERTA")) return <span key={i} className="text-orange-500 font-black">{part}</span>;
            return part;
        });
    };

    if (!authMounted) return null;

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col overflow-hidden selection:bg-primary selection:text-black">
            <Header currentPath="/portfolio" />

            <main className="flex-1 w-full bg-black h-auto lg:h-[calc(100vh-65px)] overflow-hidden">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 lg:py-6 h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                    <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8 pb-8 border-b border-neutral-dark-border/30">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-3">
                                    Dashboard de Inteligência
                                    <DashboardHelp />
                                    <button
                                        onClick={() => loadAllData(true)}
                                        className="p-2 hover:bg-neutral-dark-surface rounded-full transition-all group"
                                        title="Forçar Sincronização"
                                    >
                                        <span className={`material-symbols-outlined text-slate-500 group-hover:text-primary transition-all text-xl ${loading ? 'animate-spin text-primary' : ''}`}>sync</span>
                                    </button>
                                </h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                                    Monitor de Risco em Tempo Real • Terminal Alpha
                                </p>
                            </div>

                            {/* Sentiment Barometer */}
                            <div className="hidden md:flex flex-col items-center gap-2">
                                <div className="flex justify-between w-64 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                    <span>Pânico</span>
                                    <span>Neutro</span>
                                    <span>Otimismo</span>
                                </div>
                                <div className="w-64 h-4 bg-zinc-800/50 rounded-full border border-zinc-700/50 overflow-hidden relative shadow-inner">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${avgSentiment < 35 ? 'from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]' :
                                            avgSentiment < 65 ? 'from-amber-600 to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]' :
                                                'from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                                            }`}
                                        style={{ width: `${avgSentiment}%` }}
                                    ></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black text-white uppercase drop-shadow-md">
                                        {avgSentiment < 35 ? 'PÂNICO' : avgSentiment < 65 ? 'NEUTRO' : 'OTIMISMO'} ({avgSentiment.toFixed(0)}%)
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:flex gap-4 text-right">
                                <div className="px-5 py-3 bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl">
                                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Vol IBOV</p>
                                    <p className={`text-xl font-black ${benchmarks.ibov >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                        {benchmarks.ibov > 0 ? '+' : ''}{benchmarks.ibov.toFixed(2)}%
                                    </p>
                                </div>
                                <div className="px-5 py-3 bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl">
                                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Vol BTC</p>
                                    <p className={`text-xl font-black ${benchmarks.btc >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                        {benchmarks.btc > 0 ? '+' : ''}{benchmarks.btc.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl p-6 shadow-xl hover:border-primary/20 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liquidez Global (24h)</span>
                                    <span className="material-symbols-outlined text-primary text-xl">payments</span>
                                </div>
                                <div className="flex items-end gap-3">
                                    <span className="text-4xl font-black text-white leading-none tracking-tighter">{globalData.vol}</span>
                                    <span className="text-xs font-bold text-[#0ecb81] mb-1 flex items-center">
                                        <span className="material-symbols-outlined text-sm">sensors</span>
                                        LIVE
                                    </span>
                                </div>
                            </div>
                            <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl p-6 shadow-xl hover:border-primary/20 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Índice de Dominância (BTC)</span>
                                    <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                                </div>
                                <div className="flex items-end gap-3">
                                    <span className="text-4xl font-black text-white leading-none tracking-tighter">{globalData.dom}</span>
                                    <span className="text-xs font-bold text-slate-400 mb-1 flex items-center">
                                        <span className="material-symbols-outlined text-sm">leaderboard</span>
                                        Market Share
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assets Table */}
                        <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-3xl overflow-hidden shadow-2xl mb-8">
                            <div className="px-8 py-5 border-b border-neutral-dark-border flex justify-between items-center bg-black/20">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                                    Sinais Ativos
                                </h3>
                                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-neutral-dark-border">
                                    {['7D', '24H', '1H'].map(t => (
                                        <button key={t} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${t === '1H' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                {/* Header Row (Visible only on Desktop) */}
                                <div className="hidden lg:flex items-center bg-black/40 text-slate-500 text-[9px] uppercase font-black tracking-widest border-b border-neutral-dark-border px-4 md:px-8 py-4 gap-4">
                                    <div className="flex-1 min-w-0">Ativo / Radar</div>
                                    <div className="w-32 text-right">Momento Técnico</div>
                                    <div className="w-40 text-right">Performance Relativa</div>
                                    <div className="w-24 text-right">Nota / Upside</div>
                                    <div className="w-24 text-right hidden xl:block">Mkt Cap</div>
                                    <div className="w-28 text-right hidden xl:block">Força (7d)</div>
                                    <div className="min-w-[70px] text-right">Preço / Var</div>
                                    <div className="w-8"></div>
                                </div>

                                <div className="divide-y divide-neutral-dark-border/50">
                                    {loading && assets.length === 0 ? (
                                        <div className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="size-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                                                <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Sincronizando Watchlist...</p>
                                            </div>
                                        </div>
                                    ) : (isExpanded ? assets : assets.slice(0, 8)).map((asset, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-4 p-3 md:p-4 md:px-8 hover:bg-primary/[0.04] transition-all group relative">
                                            {/* LEFT: Logo, Ticker, Name */}
                                            <Link href={`/asset/${asset.ticker}`} className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="size-10 rounded-full bg-zinc-900 border border-neutral-dark-border/50 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img
                                                        src={asset.image || `https://ui-avatars.com/api/?name=${asset.symbol}&background=334155&color=fff&bold=true`}
                                                        className="w-full h-full object-cover"
                                                        alt={asset.symbol}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white shrink-0 text-sm group-hover:text-primary transition-colors">{asset.symbol}</p>
                                                        {asset.isProtection && <span title="Proteção de Portfólio" className="text-[10px] cursor-help" aria-label="Baixa correlação com benchmark">🛡️</span>}
                                                    </div>
                                                    <p className="text-sm text-zinc-400 truncate max-w-[120px] uppercase font-bold tracking-tighter">
                                                        {asset.name}
                                                    </p>
                                                </div>
                                            </Link>

                                            {/* MIDDLE: Desktop specific columns */}
                                            <div className="hidden lg:flex items-center justify-end gap-6 flex-1">
                                                {/* Momento */}
                                                <div className="w-32 flex justify-end">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-white ${asset.momento?.color || 'bg-slate-700'}`}>
                                                        <span className="material-symbols-outlined !text-[12px]">{asset.momento?.icon}</span>
                                                        {asset.momento?.label}
                                                    </div>
                                                </div>

                                                {/* Performance Relativa */}
                                                <div className="w-40 flex flex-col items-end gap-1 group/risco relative">
                                                    {asset.alpha && (
                                                        <div className="group/alpha relative">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter cursor-help transition-all hover:scale-105 border ${asset.alpha.color}`}>
                                                                {asset.alpha.label}
                                                            </span>
                                                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover/alpha:block w-48 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-[9999] pointer-events-none text-left">
                                                                <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">
                                                                    {asset.alpha.tooltip}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter cursor-help whitespace-nowrap transition-all hover:scale-105 ${asset.risco?.color}`}>
                                                        {asset.risco?.label}
                                                    </span>
                                                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover/risco:block w-48 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-[9999] pointer-events-none text-left">
                                                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                                                            {asset.risco?.tooltip}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Nota / Upside */}
                                                <div className="w-24 text-right">
                                                    {asset.upside.isNeutral ? (
                                                        <div className="inline-flex items-center gap-1 text-sm font-black text-slate-600">
                                                            <span className="material-symbols-outlined text-sm">horizontal_rule</span>
                                                            {asset.upside.label}
                                                        </div>
                                                    ) : (
                                                        <div className={`inline-flex items-center gap-1 text-sm font-black ${asset.upside.aiScore >= 8.0 ? 'text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]' :
                                                            asset.upside.aiScore < 5.0 ? 'text-orange-400' :
                                                                asset.upside.positive ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                            <span className="material-symbols-outlined text-sm">{asset.upside.positive ? 'trending_up' : 'trending_down'}</span>
                                                            {asset.upside.label}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mkt Cap (Extra wide screens) */}
                                                <div className="w-24 text-right font-mono text-[10px] text-slate-400 font-semibold hidden xl:block">
                                                    {asset.mcap}
                                                </div>

                                                {/* Força (Extra wide screens) */}
                                                <div className="w-28 h-8 relative hidden xl:block">
                                                    <svg className={`w-full h-full fill-none stroke-2 overflow-visible ${asset.color === 'success' ? 'stroke-[#0ecb81]' : 'stroke-[#f6465d]'} ${Math.abs(parseFloat(asset.change)) > 5 ? 'animate-pulse' : ''}`}>
                                                        <path d={asset.spark} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* RIGHT: Price / Variation Badge */}
                                            <div className="min-w-[70px] text-right shrink-0 flex flex-col gap-0.5">
                                                <p className="font-bold text-white text-sm tracking-tight">{asset.price}</p>
                                                <p className={`text-[11px] font-black font-mono ${asset.color === 'success' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                                    {asset.change}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="w-8 flex justify-end">
                                                <button onClick={() => removeFromWatchlist(asset.ticker)} className="text-slate-600 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {assets.length > 8 && (
                                <div className="p-6 border-t border-neutral-dark-border flex justify-center bg-black/10">
                                    <button 
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex items-center gap-2 px-6 py-2 bg-zinc-900 border border-zinc-700 hover:border-primary rounded-xl text-[10px] font-black text-slate-400 hover:text-primary transition-all uppercase tracking-widest"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {isExpanded ? 'keyboard_arrow_up' : 'expand_more'}
                                        </span>
                                        {isExpanded ? 'Recolher Lista' : `Ver todos os ${assets.length} ativos`}
                                    </button>
                                </div>
                            )}
                        </div>

                        {watchlist.length === 0 && (
                            <div className="text-center py-20 bg-neutral-dark-surface/30 border-2 border-dashed border-neutral-dark-border rounded-3xl">
                                <span className="material-symbols-outlined text-6xl text-slate-800 mb-4 block">bookmark_add</span>
                                <h3 className="text-xl font-bold text-white mb-2">Seu portfólio está vazio</h3>
                                <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">Adicione ativos para começar a monitorar.</p>
                                <button onClick={() => setShowSearchModal(true)} className="px-8 py-4 bg-primary text-black font-black rounded-2xl hover:scale-105 transition-all uppercase text-xs tracking-widest shadow-xl shadow-primary/20">Adicionar Ativo</button>
                            </div>
                        )}
                    </div>

                    <aside className="lg:col-span-4 xl:col-span-3 border-t lg:border-t-0 lg:border-l border-neutral-dark-border bg-black p-6 sticky top-0 h-auto lg:h-full overflow-y-auto custom-scrollbar">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                        Live Signal Stream
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-[#0ecb81] animate-pulse"></span>
                            <span className="text-[#0ecb81] text-[9px] font-black">LIVE</span>
                        </span>
                    </h4>

                    <div className="space-y-3 mb-8">
                        {signals.length > 0 ? signals.map((sig, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                                <span className={`material-symbols-outlined text-sm mt-0.5 ${sig.color}`}>{sig.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white leading-tight">{sig.msg}</p>
                                    <p className={`text-[10px] font-semibold mt-0.5 ${sig.color}`}>{sig.sub}</p>
                                </div>
                                <span className="text-[9px] text-slate-600 font-mono shrink-0">{sig.time}</span>
                            </div>
                        )) : (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-3xl text-slate-800 block mb-2">sensors_off</span>
                                <p className="text-xs text-slate-600 font-bold">Aguardando sinais...</p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-neutral-dark-border pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Whale Monitor</h5>
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-hidden">
                            {whaleSignals.length === 0 ? (
                                <p className="text-[10px] text-slate-600 font-mono italic">Aguardando sinais de fluxo...</p>
                            ) : whaleSignals.map((s, i) => (
                                <div key={s.id} className="group/log animate-in fade-in slide-in-from-top-4 duration-500 border-l border-zinc-800 pl-3 py-1 hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-mono text-slate-600">[{s.time}]</span>
                                        <span className={`material-symbols-outlined text-[14px] ${s.color}`}>{s.icon}</span>
                                    </div>
                                    <p className={`text-[11px] font-mono leading-relaxed tracking-tight ${s.color} opacity-90 group-hover/log:opacity-100`}>
                                        {s.msg}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-zinc-900">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">Simulação de Fluxo Institucional • Terminal Rastro</p>
                        </div>

                    </div>
                </aside>
            </div>
        </main>

            {/* AI Chatbox Flutuante (RASTRO) - Oculto em mobile */}
            <div className="flex fixed bottom-4 right-[84px] md:bottom-6 md:right-[96px] z-[9999] flex-col items-end group">
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-4 hidden group-hover:block w-max bg-primary px-3 py-1.5 rounded-md text-[10px] font-black text-black uppercase tracking-widest shadow-lg animate-in fade-in slide-in-from-bottom-1">
                    Acionar Rastro Sênior
                </div>

                {/* Botão de Abrir */}
                {!isChatOpen && (
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="h-14 w-14 bg-zinc-900 border border-zinc-700 hover:border-primary rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105"
                    >
                        <span className="material-symbols-outlined text-primary text-2xl">neurology</span>
                    </button>
                )}

                {isChatOpen && (
                    <div className="w-[calc(100vw-32px)] md:w-[400px] h-[70vh] md:h-[600px] bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl flex flex-col shadow-2xl shadow-black/60 relative z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-4 border-b border-zinc-900 bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                                    <span className="absolute -top-1 -right-1 size-2 bg-emerald-500 rounded-full animate-pulse border border-black"></span>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">RASTRO SÊNIOR</h4>
                                    <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter mt-1">● ANALISTA ATIVO</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20 font-mono relative z-10">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[95%] p-3 rounded-xl text-[10px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-zinc-800 text-slate-300 border border-zinc-700' : 'bg-transparent text-slate-400 border-l-2 border-primary/30 pl-4'}`}>
                                        {m.role === 'ia' ? renderMessageText(m.text) : m.text}
                                    </div>
                                </div>
                            ))}
                            {isAIThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-transparent border-l-2 border-primary/30 pl-4 py-1">
                                        <span className="text-[10px] text-primary animate-pulse font-mono font-bold tracking-widest">PROCESSANDO...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Perguntas Sugeridas */}
                        <div className="px-4 pb-3 flex flex-col gap-2">
                            {["Analise minha lista", "Quais os maiores riscos?", "Tem alguma oportunidade clara?"].map((pergunta, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        setChatInput(pergunta);
                                    }}
                                    className="w-full text-left px-3 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                                >
                                    {pergunta}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto bg-zinc-950 border-t border-zinc-800 p-3 relative z-30">
                            <div className="relative flex items-center gap-2 group">
                                <span className="text-primary font-mono text-sm font-black">&gt;</span>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage(chatInput)}
                                    className="bg-transparent w-full text-white font-mono text-[10px] outline-none placeholder-zinc-700 uppercase"
                                    placeholder="DIGITE UM COMANDO..."
                                />
                                {chatInput && (
                                    <button onClick={() => handleSendMessage(chatInput)} className="text-primary hover:scale-110 transition-all">
                                        <span className="material-symbols-outlined text-sm">terminal</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search Modal */}
            {showSearchModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-[#121212] border border-neutral-dark-border rounded-3xl w-full max-w-lg p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Buscar Ativo</h3>
                            <button onClick={() => setShowSearchModal(false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="TICKER (EX: BTC, VALE3.SA...)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && addToWatchlist(searchTerm)}
                            className="w-full bg-black border-2 border-neutral-dark-border rounded-2xl py-5 px-6 text-white font-mono text-xl outline-none focus:border-primary transition-all mb-8"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            {['BTC', 'ETH', 'SOL', 'PETR4.SA', 'VALE3.SA', 'AAPL'].map(t => (
                                <button key={t} onClick={() => addToWatchlist(t)} className="p-3 bg-neutral-dark-surface border border-neutral-dark-border rounded-xl text-[10px] font-black text-slate-500 hover:border-primary hover:text-primary transition-all uppercase">{t}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioPage;
