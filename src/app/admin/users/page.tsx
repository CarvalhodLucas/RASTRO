"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserStatus {
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

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const [siteRestricted, setSiteRestricted] = useState<boolean>(true);
    const [isUpdatingRestriction, setIsUpdatingRestriction] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error("Failed to fetch users");
            }
        } catch (err) {
            console.error("Connection error fetching users:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSiteAccess = async () => {
        try {
            const response = await fetch("/api/admin/site-access");
            if (response.ok) {
                const data = await response.json();
                setSiteRestricted(data.restricted !== false);
            }
        } catch (err) {
            console.error("Error fetching site-access config:", err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchSiteAccess();
    }, []);

    const toggleSiteRestriction = async () => {
        const newValue = !siteRestricted;
        const msg = newValue 
            ? "Ativar restrições? Qualquer visitante precisará estar aprovado para acessar." 
            : "Desativar restrições? Qualquer visitante terá acesso total e ilimitado ao site sem precisar estar logado.";
        
        if (!confirm(msg)) return;

        setIsUpdatingRestriction(true);
        try {
            const response = await fetch("/api/admin/site-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restricted: newValue })
            });

            if (response.ok) {
                const data = await response.json();
                setSiteRestricted(data.restricted !== false);
                // Notifica o AuthContext para atualizar o estado de acesso em tempo real
                window.dispatchEvent(new Event("site-access-changed"));
            } else {
                alert("Erro ao alterar restrição de acesso.");
            }
        } catch (err) {
            console.error("Error updating site restriction:", err);
            alert("Erro de conexão.");
        } finally {
            setIsUpdatingRestriction(false);
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
                setUsers(prev => prev.map(u => u.email === email ? { ...u, status: 'approved' } : u));
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

    const handleRemove = async (email: string) => {
        if (!confirm(`Tem certeza que deseja remover/rejeitar o acesso de ${email}?`)) return;

        setActionLoading(email);
        try {
            const response = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setUsers(prev => prev.filter(u => u.email !== email));
            } else {
                alert("Erro ao remover usuário.");
            }
        } catch (err) {
            console.error("Remove user error:", err);
            alert("Erro de conexão.");
        } finally {
            setActionLoading(null);
        }
    };

    const pendingUsers = users.filter(u => u.status === 'pending');
    const approvedUsers = users.filter(u => u.status === 'approved');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentList = activeTab === 'pending' ? pendingUsers : approvedUsers;

    return (
        <div className="min-h-screen bg-black font-display text-slate-100 flex flex-col">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-dark-border px-8 py-4 bg-black/50 backdrop-blur-md sticky top-0 z-50 gap-4">
                <div className="flex items-center gap-6">
                    <Link href="/admin/inbox" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-medium">Voltar ao Inbox</span>
                    </Link>
                    <div className="h-6 w-px bg-neutral-dark-border"></div>
                    <h1 className="text-xl font-bold flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">group</span>
                        Gestão de Usuários & Aprovações
                    </h1>
                </div>

                <div className="flex items-center flex-wrap gap-4">
                    {/* Botão de Restrição do Site */}
                    <button
                        onClick={toggleSiteRestriction}
                        disabled={isUpdatingRestriction}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            siteRestricted 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5"
                        }`}
                        title={siteRestricted ? "Ativar Modo Público" : "Ativar Modo Restrito"}
                    >
                        <span className="material-symbols-outlined !text-[18px]">
                            {siteRestricted ? "lock" : "lock_open"}
                        </span>
                        {siteRestricted ? "Restrições: Ativas" : "Restrições: Inativas (Site Público)"}
                    </button>

                    <button
                        onClick={fetchUsers}
                        className="p-2 bg-neutral-dark-surface border border-neutral-dark-border rounded-lg hover:bg-neutral-dark-border transition-colors text-slate-400 hover:text-white"
                        title="Atualizar dados"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                    <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Total na Fila:</span>
                        <span className="text-primary font-bold">{users.length}</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-neutral-dark-border pb-3">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${
                            activeTab === 'pending' 
                            ? 'text-primary bg-primary/10 border border-primary/20' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Solicitações Pendentes ({pendingUsers.length})
                        {pendingUsers.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'approved' 
                            ? 'text-primary bg-primary/10 border border-primary/20' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Usuários Aprovados ({approvedUsers.length})
                    </button>
                </div>

                {/* List Container */}
                <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-neutral-dark-border bg-white/5">
                        <h2 className="text-lg font-bold">
                            {activeTab === 'pending' ? 'Fila de Aprovação' : 'Acessos Autorizados'}
                        </h2>
                        <p className="text-sm text-slate-400">
                            {activeTab === 'pending' 
                                ? 'Cadastros aguardando liberação para acessar as áreas fechadas do RASTRO.' 
                                : 'Usuários que possuem acesso total ao sistema.'
                            }
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-dark-border bg-black/20">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Solicitação</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-dark-border">
                                {currentList.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                            Nenhum cadastro nesta lista.
                                        </td>
                                    </tr>
                                ) : (
                                    currentList.map((userObj) => (
                                        <tr key={userObj.email} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setExpandedUser(expandedUser === userObj.email ? null : userObj.email)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined !text-[16px] text-slate-600 transition-transform" style={{ transform: expandedUser === userObj.email ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
                                                    <span className="text-sm font-semibold text-white">{userObj.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-300">{userObj.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-500">
                                                    {userObj.createdAt ? new Date(userObj.createdAt).toLocaleString('pt-BR') : 'N/D'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end items-center gap-2">
                                                    {userObj.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleApprove(userObj.email)}
                                                            disabled={actionLoading !== null}
                                                            className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined !text-[16px]">check_circle</span>
                                                            Aprovar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemove(userObj.email)}
                                                        disabled={actionLoading !== null}
                                                        className="p-1.5 text-slate-500 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10 cursor-pointer disabled:opacity-50"
                                                        title={userObj.status === 'pending' ? "Recusar Cadastro" : "Remover Acesso"}
                                                    >
                                                        <span className="material-symbols-outlined !text-[20px]">
                                                            {userObj.status === 'pending' ? 'close' : 'delete'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )).flatMap((row, idx) => {
                                        const userObj = currentList[idx];
                                        if (expandedUser !== userObj.email) return [row];
                                        return [row, (
                                            <tr key={`${userObj.email}-detail`} className="bg-white/[0.015]">
                                                <td colSpan={4} className="px-6 py-5">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone</span>
                                                            <p className="text-white font-medium">{userObj.phone || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Investidor</span>
                                                            <p className="text-white font-medium">{userObj.investorType || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Profissão</span>
                                                            <p className="text-white font-medium">{userObj.profession || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experiência</span>
                                                            <p className="text-white font-medium">{userObj.experienceLevel || <span className="text-slate-600 italic">Não informado</span>}</p>
                                                        </div>
                                                    </div>
                                                    {userObj.reason && (
                                                        <div className="mt-4 pt-4 border-t border-neutral-dark-border space-y-1">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Motivo do Acesso</span>
                                                            <p className="text-slate-300 text-sm leading-relaxed bg-black/30 rounded-lg p-3 border border-neutral-dark-border">{userObj.reason}</p>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )];
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <span className="material-symbols-outlined">info</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-400 mb-1">Validação de Acesso</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Os usuários cadastrados só conseguem fazer login e acessar o Dashboard quando seu status for alterado para "Aprovado" por você.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                <span className="material-symbols-outlined">security</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-primary mb-1">Armazenamento Centralizado</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Diferente do localStorage anterior, as aprovações agora são gerenciadas no backend e persistidas no servidor central.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
