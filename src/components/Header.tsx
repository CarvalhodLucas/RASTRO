"use client";

import React, { useState, useEffect, useDeferredValue } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

interface HeaderProps {
    currentPath?: string;
    hideNav?: boolean;
}

export default function Header({ currentPath = "/", hideNav = false }: HeaderProps) {
    const { user, hasMounted: authMounted, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const deferredQuery = useDeferredValue(searchQuery);

    useEffect(() => {
        const fetchResults = async () => {
            if (deferredQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/assets/search?q=${encodeURIComponent(deferredQuery)}`);
                const data = await res.json();
                setSearchResults(data);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        fetchResults();
    }, [deferredQuery]);

    const navLinks = [
        { name: "Início", href: "/" },
        { name: "Rastreamento", href: "/mercado" },
        { name: "Notícias", href: "/noticias" },
        { name: "Square", href: "/square" },
        { name: "Portifolio", href: "/portfolio" },
    ];

    return (
        <header className="border-b border-solid border-neutral-dark-border bg-black sticky top-0 z-50 h-16 w-full">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-full flex items-center justify-between whitespace-nowrap">
                <div className="flex items-center gap-4 lg:gap-8">
                    {/* Mobile Menu Button */}
                    {!hideNav && (
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden text-white p-1"
                        >
                            <span className="material-symbols-outlined text-2xl">
                                {isMobileMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    )}

                    <Link href="/" className="flex items-center gap-2 md:gap-4 text-white hover:opacity-80 transition-opacity">
                        <div className="size-8 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined !text-[32px]">candlestick_chart</span>
                        </div>
                        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">RASTRO</h2>
                    </Link>

                    {!hideNav && (
                        <nav className="hidden lg:flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`${currentPath === link.href
                                        ? "text-primary font-bold"
                                        : "text-slate-400 hover:text-white"
                                        } transition-colors text-sm font-medium`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                <div className="flex flex-1 justify-end items-center gap-3 md:gap-6">
                    <div className="relative w-full max-w-xs hidden lg:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                        <input
                            className="w-full bg-neutral-dark-surface border border-neutral-dark-border rounded-xl pl-10 pr-10 py-2 text-xs focus:ring-1 focus:ring-primary text-slate-200 placeholder:text-slate-500 outline-none transition-all"
                            placeholder="Buscar ticker ou ativo..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="size-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Dropdown de Resultados */}
                        {deferredQuery.length >= 2 && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#121212] border border-neutral-dark-border rounded-xl shadow-2xl z-[100] max-h-80 overflow-y-auto custom-scrollbar overflow-x-hidden">
                                {searchResults.length > 0 ? (
                                    <div className="py-2">
                                        {searchResults.map((result) => (
                                            <Link
                                                key={result.ticker}
                                                href={`/asset/${result.ticker}`}
                                                onClick={() => setSearchQuery("")}
                                                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-dark-surface transition-colors group"
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                                        {result.ticker}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium uppercase truncate max-w-[180px]">
                                                        {result.name}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] px-2 py-0.5 bg-neutral-dark-border text-slate-400 rounded-md font-bold uppercase tracking-wider">
                                                    {result.type}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : !isSearching && (
                                    <div className="p-4 text-center">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Nenhum ativo encontrado</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>


                    <div className="flex items-center gap-3">
                        {authMounted && user ? (
                            <div className="flex items-center gap-3">
                                <Link href="/perfil" className="flex items-center gap-2 text-sm text-white hover:text-primary transition-colors group">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs group-hover:scale-110 transition-transform overflow-hidden">
                                        {user.avatarImage ? (
                                            <img src={user.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined !text-[18px]">{user.avatar || 'person'}</span>
                                        )}
                                    </div>
                                    <span className="hidden lg:inline font-bold">{user.name}</span>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Sair"
                                >
                                    <span className="material-symbols-outlined text-xl">logout</span>
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="px-4 py-2 bg-primary text-black rounded-lg text-sm font-bold hover:bg-primary-hover transition-all">
                                Entrar
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-zinc-950 border-b border-zinc-800 lg:hidden animate-in slide-in-from-top-2 duration-300 z-[60]">
                    <div className="p-4 space-y-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                            <input
                                className="w-full bg-neutral-dark-surface border border-neutral-dark-border rounded-xl pl-10 py-3 text-xs text-slate-200 outline-none"
                                placeholder="Buscar ticker ou ativo..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <nav className="flex flex-col gap-2 pb-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-xl ${currentPath === link.href
                                        ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                        : "text-slate-400 border border-transparent"
                                        } transition-all text-sm uppercase tracking-widest font-black`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
