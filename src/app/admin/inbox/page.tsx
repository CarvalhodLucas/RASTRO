"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Header from "@/components/Header";

interface SupportMessage {
    id: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
    status: 'unread' | 'read';
}

export default function AdminInboxPage() {
    const { user, hasMounted } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const isAdmin = user?.email === 'carvalhodlucas@hotmail.com';

    useEffect(() => {
        if (hasMounted) {
            if (!user) {
                router.push("/login");
            } else if (!isAdmin) {
                router.push("/");
            } else {
                fetchMessages();
            }
        }
    }, [hasMounted, user, isAdmin, router]);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/support/message");
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            } else {
                setError("Falha ao buscar mensagens.");
            }
        } catch (err) {
            console.error("Fetch inbox error:", err);
            setError("Erro de conexão ao carregar mensagens.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return;

        try {
            const response = await fetch(`/api/support/message?id=${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setMessages(prev => prev.filter(m => m.id !== id));
            } else {
                alert("Erro ao excluir mensagem.");
            }
        } catch (err) {
            console.error("Delete message error:", err);
            alert("Erro de conexão.");
        }
    };

    if (!hasMounted || !isAdmin) return null;

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col selection:bg-primary selection:text-black">
            <Header currentPath="/admin/inbox" />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">inbox</span>
                            Inbox do Suporte
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm">Gerencie as mensagens e reclamações enviadas pelos usuários.</p>
                    </div>
                    <button 
                        onClick={fetchMessages}
                        disabled={isLoading}
                        className="p-2 bg-neutral-dark-surface border border-neutral-dark-border rounded-lg hover:bg-neutral-dark-border transition-colors text-slate-400 hover:text-white"
                        title="Atualizar"
                    >
                        <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined italic">report</span>
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium animate-pulse">Carregando mensagens...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="bg-neutral-dark-surface/30 border border-dashed border-neutral-dark-border rounded-2xl py-20 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">mail_outline</span>
                        <h3 className="text-white font-bold text-lg">Caixa de entrada limpa!</h3>
                        <p className="text-slate-500 text-sm mt-1">Nenhuma mensagem nova pendente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className="group bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                                msg.subject === 'Bug' ? 'bg-red-500/20 text-red-400' :
                                                msg.subject === 'Reclamação' ? 'bg-amber-500/20 text-amber-400' :
                                                msg.subject === 'Sugestão' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-primary/20 text-primary'
                                            }`}>
                                                {msg.subject}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium italic">
                                                {new Date(msg.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold flex items-center gap-2">
                                                <span className="material-symbols-outlined text-slate-500 text-lg">person</span>
                                                {msg.email}
                                            </h3>
                                        </div>
                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 group-hover:border-primary/10 transition-colors">
                                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                {msg.message}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 h-full">
                                        <button 
                                            onClick={() => handleDelete(msg.id)}
                                            className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                            title="Excluir mensagem"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                        <button 
                                            className="p-3 text-slate-500 hover:text-market-up hover:bg-market-up/10 rounded-xl transition-all"
                                            title="Marcar como resolvido"
                                            onClick={() => handleDelete(msg.id)} // For now same as delete
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
