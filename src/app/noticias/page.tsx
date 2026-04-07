"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

// Removed all mock news data to ensure real-time dynamic content
interface NewsItem {
    id: number;
    title: string;
    source: string;
    time: string;
    logo: string;
    url: string;
}


export default function NoticiasPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInHours < 1) return "agora";
        if (diffInHours < 24) return `há ${diffInHours}h`;
        return `há ${Math.floor(diffInHours / 24)}d`;
    };

    const searchRealNews = async (query: string) => {
        setIsSearching(true);
        setError(null);
        setNews([]);

        const cacheKey = `news_cache_${query.toLowerCase().trim()}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                const isOld = Date.now() - timestamp > 60 * 60 * 1000; // 1 hora (3600s)

                if (!isOld && data && data.articles) {
                    console.log(`🟢 [CACHE] Usando notícias em cache para: ${query}`);
                    const mappedNews = mapNews(data.articles);
                    setNews(mappedNews);
                    setIsSearching(false);
                    return;
                }
            } catch (e) {
                console.error("Erro ao ler cache de notícias:", e);
            }
        }

        try {
            // Chamada para a nossa nova API Proxy unificada
            const url = `/api/proxy?target=news&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error || "Erro na API de Notícias");
            }

            if (!data.articles || data.articles.length === 0) {
                setNews([]);
                return;
            }

            // Salva no cache com timestamp
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

            const mappedNews = mapNews(data.articles);
            setNews(mappedNews);
        } catch (err: any) {
            console.error("Erro na busca de notícias:", err);
            setError("Ocorreu um erro ao buscar notícias. Tente novamente mais tarde.");
        } finally {
            setIsSearching(false);
        }
    };

    const mapNews = (articles: any[]) => {
        return articles.map((article: any, idx: number) => ({
            id: Date.now() + idx,
            title: article.title,
            source: article.source.name,
            url: article.url,
            time: formatTimeAgo(article.publishedAt),
            logo: `https://www.google.com/s2/favicons?domain=${new URL(article.url).hostname}&sz=64`
        }));
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setNews([]);
            return;
        }
        searchRealNews(query);
    };

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col selection:bg-primary selection:text-black">
            <Header currentPath="/noticias" />

            <main className="flex-1 max-w-[1200px] mx-auto w-full flex flex-col border-x border-neutral-dark-border min-h-[calc(100vh-65px)] bg-black">
                {/* Search Section */}
                <header className="p-6 border-b border-neutral-dark-border sticky top-[65px] bg-black/95 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="material-symbols-outlined text-primary text-3xl">newspaper</span>
                        <h1 className="text-xl font-bold tracking-tight text-white">Notícias</h1>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            className="w-full bg-black border border-neutral-dark-border rounded-lg py-3.5 pl-12 pr-12 text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm"
                            placeholder="Pesquise por ticker ou empresa (ex: PETR4, Apple)..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <button
                                onClick={() => handleSearch(searchQuery)}
                                className="flex items-center justify-center text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                                title="AI Search Assistant"
                            >
                                <span className={`material-symbols-outlined ${isSearching ? 'animate-spin' : ''}`}>
                                    {isSearching ? 'autorenew' : 'auto_awesome'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Search Pills */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {["BTC", "NVDA", "VALE3", "PETR4", "TSLA"].map(pill => (
                            <button
                                key={pill}
                                onClick={() => handleSearch(pill)}
                                className="px-3 py-1.5 rounded-full bg-neutral-dark-border/40 border border-neutral-dark-border hover:border-primary/50 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
                            >
                                {pill === "BTC" && <span className="size-1.5 rounded-full bg-primary"></span>}
                                {pill}
                            </button>
                        ))}
                    </div>
                </header>

                {/* News Content */}
                <div className="p-6">
                    {isSearching ? (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse mb-4 px-2 flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[16px]">rss_feed</span>
                                Buscando notícias reais em tempo real...
                            </h2>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <NewsSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-red-500/10 p-6 rounded-full mb-6">
                                <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">Ops! Algo deu errado</h3>
                            <p className="text-slate-400 text-sm max-w-sm">{error}</p>
                        </div>
                    ) : news.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-primary/5 p-6 rounded-full mb-6">
                                <span className="material-symbols-outlined text-primary text-5xl">inventory_2</span>
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">Nenhuma notícia encontrada</h3>
                            <p className="text-slate-400 text-sm max-w-sm">Nenhuma notícia recente encontrada para este ativo hoje.</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Resultados em Tempo Real</h2>
                            {news.map(item => (
                                <NewsCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-4 border-t border-neutral-dark-border bg-black mt-auto">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                        <span>© 2026 Terminal de Rastreamento</span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-green-500"></span> Conectado</span>
                            <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-primary"></span> Premium AI</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

function NewsCard({ item }: { item: NewsItem }) {
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!item.url || item.url === "#" || item.url.length < 15) {
            e.preventDefault();
            alert("Link temporariamente indisponível ou incompleto.");
        }
    };

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="group flex items-center justify-between p-4 hover:bg-neutral-dark-border/20 border-b border-neutral-dark-border/50 transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-neutral-dark-border">
                    <img
                        alt={`${item.source} logo`}
                        className="w-full h-full object-cover p-1"
                        src={item.logo || `https://ui-avatars.com/api/?name=${item.source}&background=334155&color=fff&bold=true`}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.source}&background=334155&color=fff&bold=true`;
                        }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{item.source} • {item.time}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
                <span className="material-symbols-outlined text-slate-500 group-hover:text-slate-300 text-lg">open_in_new</span>
            </div>
        </a>
    );
}
function NewsSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border-b border-neutral-dark-border/50 animate-pulse">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-neutral-dark-border shrink-0"></div>
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-neutral-dark-border rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-dark-border rounded w-1/4"></div>
                </div>
            </div>
            <div className="w-6 h-6 bg-neutral-dark-border rounded ml-4"></div>
        </div>
    );
}
