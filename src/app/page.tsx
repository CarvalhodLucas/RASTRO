"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assetsDatabase } from "@/lib/data";
import Header from "@/components/Header";

export default function Home() {
    const router = useRouter();

    // -- State for Search --
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [hasMounted, setHasMounted] = useState(false);

    // -- State for Heatmap --
    const [heatmapMarket, setHeatmapMarket] = useState("B3");

    // -- State for Footer Ticker Tape --
    const [tickerData, setTickerData] = useState<Record<string, { price: string; variation: string }>>({});
    const tickerSymbols = [
        { label: "Ibovespa", symbol: "^BVSP" },
        { label: "S&P 500", symbol: "^GSPC" },
        { label: "BTC/USD", symbol: "BTC-USD" },
        { label: "Dólar", symbol: "USDBRL=X" }
    ];

    const MOCK_INSIGHTS = [
        {
            id: 1,
            author: "Sarah Jenkins",
            role: "Macro Strategist",
            avatar: "SJ",
            content: "A divergência nos rendimentos dos títulos sugere que o Fed pivot está mais próximo do que precificado. Aumentando exposição a Small Caps $IWM e Biotecnologia.",
            sentiment: "BULLISH",
            likes: "2.4k",
            comments: 142,
            time: "há 2h"
        },
        {
            id: 2,
            author: "David Chen",
            role: "Quant Trader",
            avatar: "DC",
            content: "Análise de sentimento em $TSLA está atingindo mínimas anuais apesar do rali recente. Meus modelos indicam um recuo para os níveis de $180.",
            sentiment: "BEARISH",
            likes: "856",
            comments: 94,
            time: "há 4h"
        },
        {
            id: 3,
            author: "Elena Rodriguez",
            role: "Crypto Analyst",
            avatar: "ER",
            content: "O suporte do $BTC em $60k parece sólido. A absorção de ordens de venda sugere uma nova fase de acumulação antes do próximo breakout.",
            sentiment: "BULLISH",
            likes: "1.2k",
            comments: 56,
            time: "há 6h"
        }
    ];

    const InsightCard = ({ insight }: { insight: typeof MOCK_INSIGHTS[0] }) => {
        const renderContent = (content: string) => {
            return content.split(/(\$[A-Z]+)/g).map((part, i) => {
                if (part.startsWith("$")) {
                    return <span key={i} className="text-primary font-bold">{part}</span>;
                }
                return part;
            });
        };

        const badgeStyles = insight.sentiment === "BULLISH"
            ? "bg-[#064e3b] text-[#10b981] border-[#10b981]"
            : "bg-[#7f1d1d] text-[#ef4444] border-[#ef4444]";

        return (
            <div className="bg-[#121212] border border-[#333] rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors group cursor-pointer mb-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-slate-800 overflow-hidden relative border border-[#333] flex items-center justify-center font-bold text-xs text-white">
                            {insight.avatar}
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{insight.author}</h4>
                                <span className="material-symbols-outlined text-primary !text-[14px]">verified</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{insight.role}</p>
                        </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${badgeStyles}`}>
                        {insight.sentiment}
                    </span>
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed line-clamp-4">
                    {renderContent(insight.content)}
                </p>
                <div className="flex items-center gap-4 text-slate-500 text-[11px] pt-1 font-medium">
                    <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined !text-[16px]">favorite</span>
                        <span>{insight.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined !text-[16px]">chat_bubble</span>
                        <span>{insight.comments}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto opacity-70">
                        <span className="material-symbols-outlined !text-[16px]">schedule</span>
                        <span>{insight.time}</span>
                    </div>
                </div>
            </div>
        );
    };

    const [cacheTime, setCacheTime] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const CACHE_KEY = "ticker_cache";
    const CACHE_EXPIRATION = 6 * 60 * 60 * 1000; // 6 hours (21600 seconds)

    const getRelativeTimeString = (timestamp: number | null) => {
        if (!timestamp) return "";
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "agora mesmo";
        if (minutes < 60) return `há ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        return `há ${hours}h`;
    };

    // -- Handlers --
    const fetchTickers = React.useCallback(async (force = false) => {
        if (!force) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = Date.now();
                if (now - timestamp < CACHE_EXPIRATION) {
                    setTickerData(data);
                    setCacheTime(timestamp);
                    return;
                }
            }
        }

        setIsRefreshing(true);
        const results: Record<string, { price: string; variation: string }> = {};
        for (const item of tickerSymbols) {
            try {
                const res = await fetch(`/api/quote?ticker=${item.symbol}`);
                const data = await res.json();
                if (!data.error) {
                    results[item.symbol] = {
                        price: data.price !== "0.00" ? data.price : "N/D",
                        variation: data.variation || "0.0"
                    };
                }
            } catch (e) {
                console.error("Error fetching", item.symbol, e);
            }
        }

        const now = Date.now();
        setTickerData(results);
        setCacheTime(now);
        setIsRefreshing(false);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: results, timestamp: now }));
    }, []);

    useEffect(() => {
        setHasMounted(true);
        fetchTickers();

        // Close search dropdown on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [fetchTickers]);

    // -- Derived Data --
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return assetsDatabase.filter(a =>
            a.name.toLowerCase().includes(term) || a.ticker.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    // Seeded random performance for visual variety
    const getSeededPerf = (ticker: string) => {
        let h = 0;
        for (let i = 0; i < ticker.length; i++) h = ticker.charCodeAt(i) + ((h << 5) - h);
        return (Math.abs(h) % 61) / 10 - 3; // -3.0% to +3.0%
    };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Treemap layout slots — matches the reference image proportions exactly
    // Each slot: gridArea (row/col), fontSize tier
    const DESKTOP_SLOTS = [
        { area: '1 / 1 / 3 / 4', tier: 'xl' },   // Big top-left
        { area: '1 / 4 / 2 / 6', tier: 'md' },   // Medium top-center
        { area: '1 / 6 / 3 / 9', tier: 'lg' },   // Big top-right
        { area: '2 / 4 / 3 / 6', tier: 'md' },   // Medium center
        { area: '2 / 6 / 3 / 7', tier: 'sm' },   // Small center-right
        { area: '2 / 7 / 4 / 9', tier: 'md' },   // Medium right
        { area: '3 / 1 / 4 / 3', tier: 'sm' },   // Small bottom-left
        { area: '3 / 3 / 4 / 5', tier: 'sm' },   // Small bottom-center
        { area: '3 / 5 / 4 / 6', tier: 'sm' },   // Small bottom-center
        { area: '3 / 6 / 4 / 7', tier: 'sm' },   // Small bottom-right
        { area: '4 / 1 / 5 / 3', tier: 'sm' },   // Row 4 - 1
        { area: '4 / 3 / 5 / 5', tier: 'sm' },   // Row 4 - 2
        { area: '4 / 5 / 5 / 6', tier: 'sm' },   // Row 4 - 3
        { area: '4 / 6 / 5 / 7', tier: 'sm' },   // Row 4 - 4
        { area: '4 / 7 / 5 / 9', tier: 'sm' },   // Row 4 - 5
    ];

    const MOBILE_SLOTS = [
        { area: '1 / 1 / 2 / 3', tier: 'lg' },   // Big top
        { area: '2 / 1 / 3 / 2', tier: 'md' },   // Medium
        { area: '2 / 2 / 3 / 3', tier: 'md' },   // Medium
        { area: '3 / 1 / 4 / 3', tier: 'lg' },   // Big center
        { area: '4 / 1 / 5 / 2', tier: 'sm' },   // Small
        { area: '4 / 2 / 5 / 3', tier: 'sm' },   // Small
        { area: '5 / 1 / 6 / 2', tier: 'sm' },   // Small
        { area: '5 / 2 / 6 / 3', tier: 'sm' },   // Small
    ];

    const currentSlots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;

    const heatmapAssets = useMemo(() => {
        let filtered: any[] = [];
        if (heatmapMarket === "B3") {
            filtered = assetsDatabase.filter(a => a.ticker.includes(".SA"));
        } else if (heatmapMarket === "S&P 500") {
            filtered = assetsDatabase.filter(a => !a.ticker.includes(".SA") && !a.ticker.includes("-USD") && a.exchange !== "Crypto");
        } else if (heatmapMarket === "Cripto") {
            filtered = assetsDatabase.filter(a => a.ticker.includes("-USD") || a.exchange === "Crypto");
        } else {
            filtered = assetsDatabase;
        }

        // Shuffle randomly on every page load
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        // Use currentSlots length (8 for mobile, 15 for desktop)
        return shuffled.slice(0, currentSlots.length);
    }, [heatmapMarket, isMobile, currentSlots.length]);


    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            <Header currentPath="/" />

            <main className="flex-1 w-full bg-black">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">

                    {/* Search Section */}
                    <section className="flex flex-col items-center justify-center py-10 gap-6 w-full max-w-3xl mx-auto z-40">
                        <div className="text-center space-y-2">
                            <h1 className="text-white tracking-tight text-4xl md:text-[40px] font-bold leading-tight">
                                Pesquisa de <span className="text-primary">Inteligência de Mercado</span>
                            </h1>
                            <p className="text-slate-400 text-lg">Dados em tempo real, análises de IA e insights da comunidade em um só lugar.</p>
                        </div>

                        <div className="w-full relative group" ref={searchRef}>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="block w-full h-14 pl-12 pr-12 rounded-xl bg-neutral-dark-surface border border-neutral-dark-border text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-lg shadow-black/50 text-lg focus:outline-none"
                                placeholder="Pesquisar Tickers (ex. AAPL, PETR4)..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                                <button className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-neutral-dark-border transition-colors">
                                    <span className="material-symbols-outlined">mic</span>
                                </button>
                            </div>

                            {/* Dropdown Results */}
                            {searchFocused && searchTerm.length > 0 && (
                                <div className="absolute top-16 left-0 right-0 bg-neutral-dark-surface border border-neutral-dark-border rounded-xl shadow-2xl overflow-hidden z-50">
                                    {searchResults.length > 0 ? (
                                        <div className="flex flex-col max-h-[300px] overflow-y-auto">
                                            {searchResults.map(asset => (
                                                <button
                                                    key={asset.ticker}
                                                    onClick={() => router.push(`/asset/${asset.ticker}`)}
                                                    className="w-full text-left px-4 py-3 border-b border-neutral-dark-border hover:bg-neutral-dark-border/50 transition-colors flex justify-between items-center group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                            <img
                                                                src={asset.logo || `https://ui-avatars.com/api/?name=${asset.ticker}&background=334155&color=fff&bold=true`}
                                                                alt={asset.ticker}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.ticker}&background=334155&color=fff&bold=true`;
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-bold group-hover:text-primary transition-colors">{asset.name}</div>
                                                            <div className="text-slate-500 text-xs">{asset.ticker}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-6 text-center text-slate-400">
                                            Nenhum ativo encontrado para "{searchTerm}".
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center text-sm">
                            <span className="text-slate-400">Em alta:</span>
                            <Link className="px-3 py-1 rounded-full bg-neutral-dark-surface border border-neutral-dark-border text-slate-300 hover:border-primary hover:text-primary transition-all shadow-sm" href="/asset/PETR4">PETR4</Link>
                            <Link className="px-3 py-1 rounded-full bg-neutral-dark-surface border border-neutral-dark-border text-slate-300 hover:border-primary hover:text-primary transition-all shadow-sm" href="/asset/VALE3">VALE3</Link>
                            <Link className="px-3 py-1 rounded-full bg-neutral-dark-surface border border-neutral-dark-border text-slate-300 hover:border-primary hover:text-primary transition-all shadow-sm" href="/asset/AAPL">AAPL</Link>
                        </div>
                    </section>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full relative z-0">
                        {/* Heatmap */}
                        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between px-1 gap-4">
                                <h2 className="text-white text-xl font-bold flex items-center gap-2 text-center sm:text-left">
                                    <span className="material-symbols-outlined text-primary">grid_view</span>
                                    Mapa de Calor do Mercado
                                </h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
                                    {cacheTime && (
                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] md:text-[11px] font-medium bg-neutral-dark-surface/50 px-2 py-1 rounded-md border border-neutral-dark-border/50 whitespace-nowrap">
                                            <span className="material-symbols-outlined !text-[14px] hidden sm:inline">history</span>
                                            {isRefreshing ? "Atualizando..." : (isMobile ? `Visto há ${getRelativeTimeString(cacheTime).split(' ')[1]}` : `Atualizado ${getRelativeTimeString(cacheTime)}`)}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => fetchTickers(true)}
                                        disabled={isRefreshing}
                                        className={`flex items-center justify-center p-1.5 rounded-lg border border-neutral-dark-border bg-neutral-dark-surface text-slate-400 hover:text-primary hover:border-primary transition-all group ${isRefreshing ? "animate-spin cursor-not-allowed opacity-50" : ""}`}
                                        title="Atualizar dados manualmente"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">refresh</span>
                                    </button>
                                    <div className="flex bg-neutral-dark-surface rounded-lg p-1 border border-neutral-dark-border overflow-x-auto no-scrollbar max-w-full">
                                        <button
                                            onClick={() => setHeatmapMarket("B3")}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${heatmapMarket === "B3" ? "bg-primary text-black shadow-sm" : "text-slate-400 hover:text-white"}`}
                                        >
                                            B3
                                        </button>
                                        <button
                                            onClick={() => setHeatmapMarket("S&P 500")}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${heatmapMarket === "S&P 500" ? "bg-primary text-black shadow-sm" : "text-slate-400 hover:text-white"}`}
                                        >
                                            S&P 500
                                        </button>
                                        <button
                                            onClick={() => setHeatmapMarket("Cripto")}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${heatmapMarket === "Cripto" ? "bg-primary text-black shadow-sm" : "text-slate-400 hover:text-white"}`}
                                        >
                                            Cripto
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Premium Treemap Heatmap */}
                            <div
                                className="w-full bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl border border-[#333]"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(8, 1fr)',
                                    gridTemplateRows: isMobile ? 'repeat(5, 120px)' : 'repeat(4, 120px)',
                                    gap: '3px',
                                    padding: '3px'
                                }}
                            >
                                {!hasMounted ? (
                                    currentSlots.map((slot, i) => (
                                        <div
                                            key={i}
                                            className="bg-[#222] animate-pulse rounded-lg"
                                            style={{ gridArea: slot.area }}
                                        ></div>
                                    ))
                                ) : (
                                    heatmapAssets.map((asset, index) => {
                                        if (index >= currentSlots.length) return null;
                                        const slot = currentSlots[index];

                                        const displayVar = asset.variation !== "0.0"
                                            ? parseFloat(asset.variation)
                                            : getSeededPerf(asset.ticker);

                                        const isPositive = displayVar > 0;
                                        const isNeutral = displayVar === 0;

                                        // Vivid solid colors matching the reference image
                                        const bgColor = isPositive
                                            ? 'bg-[#1B7A3D]'
                                            : isNeutral
                                                ? 'bg-[#2a3a2a]'
                                                : 'bg-[#B91C1C]';

                                        const varColor = isPositive
                                            ? 'text-[#4ade80]'
                                            : isNeutral
                                                ? 'text-slate-400'
                                                : 'text-[#fca5a5]';

                                        // Font sizes based on slot tier
                                        const tickerSize = slot.tier === 'xl' ? 'text-4xl md:text-5xl'
                                            : slot.tier === 'lg' ? 'text-3xl md:text-4xl'
                                                : slot.tier === 'md' ? 'text-2xl md:text-3xl'
                                                    : 'text-lg md:text-xl';

                                        const varSize = slot.tier === 'xl' || slot.tier === 'lg'
                                            ? 'text-lg md:text-xl'
                                            : 'text-sm';

                                        const cleanTicker = asset.ticker.replace('.SA', '').replace('-USD', '');

                                        return (
                                            <Link
                                                key={asset.ticker}
                                                href={`/asset/${asset.ticker}`}
                                                className={`${bgColor} relative overflow-hidden rounded-lg border border-black/30 transition-all duration-200 hover:brightness-125 hover:z-10 cursor-pointer group`}
                                                style={{ gridArea: slot.area }}
                                            >
                                                {/* Ticker — top-left, bold */}
                                                <span className={`absolute top-3 left-4 ${tickerSize} font-black text-white tracking-tight leading-none`}>
                                                    {cleanTicker}
                                                </span>

                                                {/* Variation — top-right for large, below ticker for small to avoid overlap */}
                                                <span className={`absolute ${slot.tier === 'sm' || slot.tier === 'md' ? 'top-9 md:top-12 left-4' : 'top-3 right-4'} ${varSize} font-bold ${varColor}`}>
                                                    {isPositive ? '+' : ''}{displayVar.toFixed(1)}%
                                                </span>

                                                {/* Sector — bottom-left, muted */}
                                                {(slot.tier === 'xl' || slot.tier === 'lg') && (
                                                    <span className="absolute bottom-3 left-4 text-xs text-white/30 font-semibold tracking-wide">
                                                        {asset.sector}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })
                                )}
                                {hasMounted && heatmapAssets.length === 0 && (
                                    <div className="col-span-full row-span-full flex items-center justify-center text-slate-500 py-20">
                                        Nenhum ativo encontrado para este mercado.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Forum Insights (Hardcoded as requested) */}
                        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full max-h-[800px]">
                            <div className="flex items-center justify-between px-1 mb-4">
                                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">forum</span>
                                    Square Insights
                                </h2>
                                <a className="text-primary text-sm font-medium hover:text-white transition-colors" href="#">Ver Todos</a>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {MOCK_INSIGHTS.map((insight) => (
                                    <InsightCard key={insight.id} insight={insight} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Footer / Ticker Tape */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-neutral-dark-border mt-4 mb-10 overflow-x-auto">
                        {!hasMounted ? (
                            tickerSymbols.map(({ label, symbol }) => (
                                <div key={symbol} className="flex flex-col gap-1 min-w-[140px]">
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="animate-pulse bg-neutral-dark-border h-4 w-16 rounded block"></span>
                                        <span className="animate-pulse bg-neutral-dark-border h-4 w-8 rounded block"></span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            tickerSymbols.map(({ label, symbol }) => {
                                const data = tickerData[symbol];
                                const isPos = data && !data.variation.startsWith('-');

                                return (
                                    <div key={symbol} className="flex flex-col gap-1 min-w-[140px]">
                                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-white font-bold">{data ? data.price : <span className="animate-pulse bg-neutral-dark-border h-4 w-16 rounded block"></span>}</span>
                                            {data ? (
                                                <span className={`font-medium ${isPos ? 'text-market-up' : 'text-market-down'}`}>
                                                    {isPos ? '+' : ''}{data.variation}%
                                                </span>
                                            ) : (
                                                <span className="animate-pulse bg-neutral-dark-border h-4 w-8 rounded block"></span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
