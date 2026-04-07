"use client";

import React, { useState, useEffect } from "react";

interface TickerItem {
    label: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    icon: string;
}

const MarketTicker: React.FC = () => {
    const [items, setItems] = useState<TickerItem[]>([
        { label: "Liquidez Global", value: "A carregar...", icon: "🌐" },
        { label: "Dominância BTC", value: "A carregar...", icon: "👑" },
        { label: "Vol IBOV", value: "A carregar...", icon: "📊" },
        { label: "Ouro", value: "A carregar...", icon: "🥇" },
        { label: "Petróleo Brent", value: "A carregar...", icon: "🛢️" },
        { label: "Petróleo WTI", value: "A carregar...", icon: "🛢️" },
        { label: "Prata", value: "A carregar...", icon: "🥈" },
        { label: "Milho", value: "A carregar...", icon: "🌽" },
        { label: "Soja", value: "A carregar...", icon: "🌱" },
    ]);
    const [isLoading, setIsLoading] = useState(true);

    const formatCompact = (val: number, currency: string = "USD") => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(val);
    };

    const fetchMarketData = async () => {
        const CACHE_KEY = 'market_ticker_cache_v1';
        const SIX_HOURS = 6 * 60 * 60 * 1000;

        try {
            // 1. Check Cache
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    const isOld = Date.now() - timestamp > SIX_HOURS;
                    if (!isOld && data && data.length > 0) {
                        setItems(data);
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    localStorage.removeItem(CACHE_KEY);
                }
            }

            // 2. Refresh Data
            // Fetch Global Data (CoinGecko via Proxy)
            const globalRes = await fetch('/api/proxy?target=price&endpoint=global');
            const globalData = await globalRes.json();
            
            // Fetch Commodities & IBOV (Quote API)
            const tickers = [
                { id: 'ibov', ticker: '^BVSP', label: 'Vol IBOV', icon: '📊', currency: 'BRL' },
                { id: 'gold', ticker: 'GC=F', label: 'Ouro', icon: '🥇', currency: 'USD' },
                { id: 'brent', ticker: 'BZ=F', label: 'Brent', icon: '🛢️', currency: 'USD' },
                { id: 'wti', ticker: 'CL=F', label: 'WTI', icon: '🛢️', currency: 'USD' },
                { id: 'silver', ticker: 'SI=F', label: 'Prata', icon: '🥈', currency: 'USD' },
                { id: 'corn', ticker: 'ZC=F', label: 'Milho', icon: '🌽', currency: 'USD' },
                { id: 'soy', ticker: 'ZS=F', label: 'Soja', icon: '🌱', currency: 'USD' },
            ];

            const quotePromises = tickers.map(t => fetch(`/api/quote?ticker=${encodeURIComponent(t.ticker)}`).then(r => r.json()));
            const quotes = await Promise.all(quotePromises);

            const newItems: TickerItem[] = [
                { 
                    label: "Liquidez Global (24h)", 
                    value: globalData?.data ? formatCompact(globalData.data.total_volume.usd) : "$107B", 
                    icon: "🌐" 
                },
                { 
                    label: "Dominância (BTC)", 
                    value: globalData?.data ? globalData.data.market_cap_percentage.btc.toFixed(1) + "%" : "56.6%", 
                    icon: "👑" 
                },
                ...tickers.map((t, i) => {
                    const q = quotes[i];
                    const isIBOV = t.id === 'ibov';
                    return {
                        label: t.label,
                        value: isIBOV ? formatCompact(q.avgVolume || 0, 'BRL') : `$${(q.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        change: `${q.variation > 0 ? '+' : ''}${q.variation}%`,
                        isPositive: parseFloat(q.variation) >= 0,
                        icon: t.icon
                    };
                })
            ];

            // 3. Update State and Cache
            setItems(newItems);
            setIsLoading(false);
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: newItems,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error("Error fetching market ticker data:", error);
        }
    };

    useEffect(() => {
        fetchMarketData();
        // Refresh every 30 minutes
        const interval = setInterval(fetchMarketData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Duplicamos o array para o efeito de loop infinito ser contínuo
    const tickerItems = [...items, ...items];

    return (
        <>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
            
            <div className="w-full overflow-hidden bg-zinc-950 border-b border-zinc-900 py-2 flex items-center select-none">
                <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
                    {tickerItems.map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-2 px-4 border-r border-zinc-900 last:border-r-0 ${isLoading ? 'opacity-50' : ''}`}>
                            <span className="text-sm">{item.icon}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter font-mono">
                                {item.label}:
                            </span>
                            <span className="text-[11px] font-black text-white font-mono whitespace-nowrap">
                                {item.value}
                            </span>
                            {item.change && (
                                <span className={`text-[10px] font-bold font-mono ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    ({item.change})
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MarketTicker;

