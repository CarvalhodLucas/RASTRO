"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserSession {
    name: string;
    email: string;
    isLoggedIn: boolean;
    isAdmin?: boolean;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simple security check (client-side only for prototype)
        const sessionStr = localStorage.getItem("user_session");
        if (!sessionStr) {
            router.push("/login");
            return;
        }

        const session: UserSession = JSON.parse(sessionStr);
        // Any logic needed to verify admin status could go here

        // Load emails from localStorage
        const emails = JSON.parse(localStorage.getItem("registered_emails") || "[]");
        setRegisteredEmails(emails);
        setIsLoading(false);
    }, [router]);

    const handleRemoveEmail = (emailToRemove: string) => {
        if (confirm(`Tem certeza que deseja remover o e-mail ${emailToRemove}?`)) {
            const updated = registeredEmails.filter(e => e !== emailToRemove);
            localStorage.setItem("registered_emails", JSON.stringify(updated));
            setRegisteredEmails(updated);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black font-display text-slate-100 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-neutral-dark-border px-8 py-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/admin/reports" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-medium">Voltar</span>
                    </Link>
                    <div className="h-6 w-px bg-neutral-dark-border"></div>
                    <h1 className="text-xl font-bold flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">group</span>
                        Gestão de Usuários
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Total de Registros:</span>
                        <span className="text-primary font-bold">{registeredEmails.length}</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
                <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-neutral-dark-border bg-white/5">
                        <h2 className="text-lg font-bold">E-mails Cadastrados</h2>
                        <p className="text-sm text-slate-400">Lista completa de usuários que realizaram o cadastro no sistema.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-dark-border bg-black/20">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-dark-border">
                                {registeredEmails.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">
                                            Nenhum usuário cadastrado até o momento.
                                        </td>
                                    </tr>
                                ) : (
                                    registeredEmails.map((email, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                                    <span className="text-xs font-medium text-green-500 uppercase">Ativo</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-white">{email}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveEmail(email)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"
                                                    title="Remover Acesso"
                                                >
                                                    <span className="material-symbols-outlined !text-[20px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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
                                <h3 className="font-bold text-blue-400 mb-1">Acesso via Google</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Apenas os e-mails listados acima (mais os administradores permitidos) podem utilizar a opção "Continuar com o Google".
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
                                <h3 className="font-bold text-primary mb-1">Sincronização</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Os dados são armazenados localmente no navegador (localStorage) para fins de prototipagem e validação do fluxo de login.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
