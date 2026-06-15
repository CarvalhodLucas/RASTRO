"use client";

import { useState, useEffect } from "react";
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

interface PendingUser {
    email: string;
    name: string;
    status: 'pending' | 'approved';
    createdAt: string;
    phone?: string;
    investorType?: string;
    profession?: string;
    experienceLevel?: string;
    reason?: string;
}

export default function AdminInboxPage() {
    const { user, hasMounted } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const isAdmin = user?.email === 'carvalhodlucas@hotmail.com';

    useEffect(() => {
        if (hasMounted) {
            fetchAll();
        }
    }, [hasMounted]);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [msgRes, usersRes] = await Promise.all([
                fetch("/api/support/message"),
                fetch("/api/admin/users")
            ]);

            if (msgRes.ok) {
                const data = await msgRes.json();
                setMessages(data);
            }

            if (usersRes.ok) {
                const data: PendingUser[] = await usersRes.json();
                setPendingUsers(data.filter(u => u.status === 'pending'));
            }
        } catch (err) {
            console.error("Fetch inbox error:", err);
            setError("Erro de conexão ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (email: string) => {
        setActionLoading(email);
        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                setPendingUsers(prev => prev.filter(u => u.email !== email));
            } else {
                alert("Erro ao aprovar usuário.");
            }
        } catch (err) {
            console.error("Approve user error:", err);
            alert("Erro de conexão.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (email: string) => {
        if (!confirm(`Tem certeza que deseja recusar o cadastro de ${email}?`)) return;

        setActionLoading(email);
        try {
            const response = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setPendingUsers(prev => prev.filter(u => u.email !== email));
            } else {
                alert("Erro ao recusar usuário.");
            }
        } catch (err) {
            console.error("Reject user error:", err);
            alert("Erro de conexão.");
        } finally {
            setActionLoading(null);
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

    if (!hasMounted) return null;

    const totalNotifications = pendingUsers.length + messages.length;

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col selection:bg-primary selection:text-black">
            <Header currentPath="/admin/inbox" />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">inbox</span>
                            Inbox do Administrador
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm">Solicitações de cadastro e mensagens de suporte.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {totalNotifications > 0 && (
                            <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Pendências:</span>
                                <span className="text-primary font-bold">{totalNotifications}</span>
                            </div>
                        )}
                        <button
                            onClick={fetchAll}
                            disabled={isLoading}
                            className="p-2 bg-neutral-dark-surface border border-neutral-dark-border rounded-lg hover:bg-neutral-dark-border transition-colors text-slate-400 hover:text-white"
                            title="Atualizar"
                        >
                            <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>
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
                        <p className="text-slate-500 font-medium animate-pulse">Carregando...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">

                        {/* === PENDING REGISTRATION REQUESTS === */}
                        {pendingUsers.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-amber-500">person_add</span>
                                    <h2 className="text-xl font-bold text-white">Solicitações de Cadastro</h2>
                                    <span className="relative flex h-3 w-3 ml-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium ml-1">({pendingUsers.length} pendente{pendingUsers.length > 1 ? 's' : ''})</span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {pendingUsers.map((userObj) => (
                                        <div
                                            key={userObj.email}
                                            className="group bg-neutral-dark-surface border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5"
                                        >
                                            {/* Top accent line */}
                                            <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                                            
                                            <div className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="size-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="material-symbols-outlined text-amber-500 !text-[24px]">person</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-white font-bold text-base truncate">{userObj.name}</h3>
                                                            <p className="text-slate-400 text-sm truncate">{userObj.email}</p>
                                                            <p className="text-slate-600 text-xs mt-0.5">
                                                                {userObj.createdAt ? new Date(userObj.createdAt).toLocaleString('pt-BR') : 'N/D'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => setExpandedUser(expandedUser === userObj.email ? null : userObj.email)}
                                                            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined !text-[18px]" style={{ transform: expandedUser === userObj.email ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>expand_more</span>
                                                            Ver Perfil
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(userObj.email)}
                                                            disabled={actionLoading !== null}
                                                            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                                                            Aprovar
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(userObj.email)}
                                                            disabled={actionLoading !== null}
                                                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined !text-[18px]">close</span>
                                                            Recusar
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expandable profile details */}
                                                {expandedUser === userObj.email && (
                                                    <div className="mt-5 pt-5 border-t border-neutral-dark-border animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">phone</span> Telefone
                                                                </span>
                                                                <p className="text-white font-medium">{userObj.phone || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">trending_up</span> Investidor
                                                                </span>
                                                                <p className="text-white font-medium">{userObj.investorType || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">work</span> Profissão
                                                                </span>
                                                                <p className="text-white font-medium">{userObj.profession || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">school</span> Experiência
                                                                </span>
                                                                <p className="text-white font-medium">{userObj.experienceLevel || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                            </div>
                                                        </div>
                                                        {userObj.reason && (
                                                            <div className="mt-4 space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="material-symbols-outlined !text-[14px]">edit_note</span> Motivo do Acesso
                                                                </span>
                                                                <p className="text-slate-300 text-sm leading-relaxed bg-black/40 rounded-lg p-3 border border-neutral-dark-border">{userObj.reason}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* === SUPPORT MESSAGES === */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-primary">mail</span>
                                <h2 className="text-xl font-bold text-white">Mensagens de Suporte</h2>
                                {messages.length > 0 && (
                                    <span className="text-xs text-slate-500 font-medium">({messages.length})</span>
                                )}
                            </div>

                            {messages.length === 0 ? (
                                <div className="bg-neutral-dark-surface/30 border border-dashed border-neutral-dark-border rounded-2xl py-16 flex flex-col items-center justify-center text-center">
                                    <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">mail_outline</span>
                                    <h3 className="text-white font-bold text-lg">Nenhuma mensagem</h3>
                                    <p className="text-slate-500 text-sm mt-1">A caixa de suporte está limpa.</p>
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
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${msg.subject === 'Bug' ? 'bg-red-500/20 text-red-400' :
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
                                                        onClick={() => handleDelete(msg.id)}
                                                    >
                                                        <span className="material-symbols-outlined">check_circle</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Empty state when everything is clean */}
                        {pendingUsers.length === 0 && messages.length === 0 && (
                            <div className="bg-neutral-dark-surface/30 border border-dashed border-neutral-dark-border rounded-2xl py-20 flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">task_alt</span>
                                <h3 className="text-white font-bold text-lg">Tudo em dia!</h3>
                                <p className="text-slate-500 text-sm mt-1">Nenhuma solicitação pendente ou mensagem nova.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

