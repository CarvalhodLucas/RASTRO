"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const menuItems = [
        { name: "Painel Principal", icon: "dashboard", href: "/" },
        { name: "Sinais de Mercado", icon: "trending_up", href: "/mercado" },
        { name: "Portifolio", icon: "account_balance_wallet", href: "/portfolio" },
        { name: "Square", icon: "forum", href: "/square" },
        { name: "Análise IA", icon: "psychology", href: "#" },
    ];

    const toolsItems = [
        { name: "Fluxo de Baleias", icon: "water_drop", href: "#" },
        { name: "Alertas Rápidos", icon: "notifications", href: "#" },
    ];

    return (
        <aside className="w-64 flex-shrink-0 border-r border-neutral-dark-border bg-black hidden lg:flex flex-col h-full sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="size-8 bg-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-black font-bold">radar</span>
                </div>
                <div>
                    <h1 className="text-white text-sm font-bold leading-tight">RASTRO radar</h1>
                    <p className="text-primary text-[10px] uppercase tracking-widest font-semibold">Terminal Financeiro</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname === item.href
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-slate-400 hover:text-white hover:bg-neutral-dark-surface"
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                ))}

                <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ferramentas</div>

                {toolsItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-dark-surface text-slate-400 hover:text-white cursor-pointer transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-neutral-dark-border">
                <div className="bg-neutral-dark-surface rounded-xl p-4 mb-4 border border-neutral-dark-border/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-primary uppercase">Plano Pro</span>
                        <span className="material-symbols-outlined text-primary text-sm">verified</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">Acesso total a insights da Groq AI e sinais de baleias.</p>
                    <button className="w-full py-2 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/10">
                        UPGRADE AGORA
                    </button>
                </div>

                <div className="flex items-center gap-3 px-2">
                    <div className="size-8 rounded-full bg-neutral-dark-surface border border-neutral-dark-border flex items-center justify-center overflow-hidden">
                        {user?.avatarImage ? (
                            <img src={user.avatarImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-primary font-bold text-xs">{user?.name?.substring(0, 2).toUpperCase() || "TA"}</span>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{user?.name || "Trader Elite"}</p>
                        <p className="text-[10px] text-slate-500 truncate">Sessão Ativa • Pro</p>
                    </div>
                    <button onClick={logout} className="text-slate-500 hover:text-primary transition-colors ml-auto mr-2">
                        <span className="material-symbols-outlined text-sm">logout</span>
                    </button>
                    <Link href="/perfil" className="text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">settings</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
