"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Header from "@/components/Header";

type TabType = "geral" | "seguranca" | "aparencia";

export default function ProfilePage() {
    const { user, hasMounted, logout, updateProfile } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("geral");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form states
    const [nickname, setNickname] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [emailCode, setEmailCode] = useState("");
    const [sentEmailCode, setSentEmailCode] = useState("");

    // Avatar & Theme states
    const [avatarImage, setAvatarImage] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState("person");
    const [theme, setTheme] = useState("dark");

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (hasMounted && !user) {
            router.push("/login");
        }
    }, [hasMounted, user, router]);

    useEffect(() => {
        if (user) {
            setNickname(user.name || "");
            setTheme(user.theme || "dark");
            setSelectedAvatar(user.avatar || "person");
            setAvatarImage(user.avatarImage || "");
            setAvatarUrl(user.avatarImage?.startsWith("http") ? user.avatarImage : "");
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert("A imagem é muito grande. Por favor, escolha uma imagem com menos de 1MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatarImage(base64String);
                setAvatarUrl("");
            };
            reader.readAsDataURL(file);
        }
    };

    const simulateEmailSend = (targetEmail: string, code: string) => {
        console.log(`[SIMULAÇÃO] Enviando e-mail para ${targetEmail}: Seu código é ${code}`);
        alert(`Simulação: Um e-mail de confirmação foi enviado para ${targetEmail}. Verifique sua caixa de entrada.`);
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 800));

        const finalAvatarImage = avatarUrl || avatarImage;

        updateProfile({
            name: nickname,
            // We don't update email directly here anymore for security
            avatar: selectedAvatar,
            avatarImage: finalAvatarImage
        });

        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleSaveTheme = (newTheme: string) => {
        setTheme(newTheme);
        updateProfile({ theme: newTheme });
    };

    const handleStartEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (newEmail === user.email) {
            alert("O novo e-mail não pode ser igual ao atual.");
            return;
        }
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentEmailCode(code);
        simulateEmailSend(newEmail, code);

        setVerifyingEmail(true);
        setIsSaving(false);
    };

    const handleConfirmEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emailCode !== sentEmailCode) {
            alert("Código incorreto. Tente novamente.");
            return;
        }
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        updateProfile({ email: newEmail });

        setVerifyingEmail(false);
        setNewEmail("");
        setEmailCode("");
        setIsSaving(false);
        alert("E-mail alterado com sucesso!");
    };

    const handleSaveSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("As senhas não coincidem!");
            return;
        }
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsSaving(false);
        alert("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    if (!hasMounted || !user) return null;

    const avatars = ["person", "face", "account_circle", "sentiment_very_satisfied", "star", "rocket_launch"];
    const themes = [
        { id: "dark", name: "Dark (Padrão)", color: "bg-[#121212]", border: "border-[#333333]" },
        { id: "amoled", name: "Amoled (Preto Puro)", color: "bg-[#000000]", border: "border-[#111111]" },
        { id: "market-blue", name: "Market Blue", color: "bg-[#0a192f]", border: "border-[#172a45]" }
    ];

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            <Header currentPath="#" />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 flex flex-col gap-2">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Configurações</h2>
                    <button
                        onClick={() => setActiveTab("geral")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === "geral" ? "bg-primary text-black" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                        <span className="material-symbols-outlined !text-[20px]">person</span>
                        Geral
                    </button>
                    <button
                        onClick={() => setActiveTab("aparencia")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === "aparencia" ? "bg-primary text-black" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                        <span className="material-symbols-outlined !text-[20px]">palette</span>
                        Aparência
                    </button>
                    <button
                        onClick={() => setActiveTab("seguranca")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === "seguranca" ? "bg-primary text-black" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                        <span className="material-symbols-outlined !text-[20px]">security</span>
                        Segurança
                    </button>

                    <div className="mt-auto pt-8">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
                        >
                            <span className="material-symbols-outlined !text-[20px]">logout</span>
                            Sair da Conta
                        </button>
                    </div>
                </aside>

                {/* Content Area */}
                <section className="flex-1 bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl p-6 md:p-8 shadow-xl">
                    {activeTab === "geral" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">Informações Pessoais</h1>
                                <p className="text-slate-400 text-sm">Gerencie seu perfil e como você aparece para outros usuários.</p>
                            </div>

                            <form onSubmit={handleSaveGeneral} className="space-y-6">
                                {/* Avatar Selection */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Avatar Personalizado</label>
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="w-24 h-24 rounded-2xl bg-black border-2 border-dashed border-neutral-dark-border flex items-center justify-center overflow-hidden group relative transition-colors hover:border-primary/50">
                                            {avatarUrl || avatarImage ? (
                                                <img src={avatarUrl || avatarImage} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined !text-[40px] text-slate-600 group-hover:text-primary transition-colors">{selectedAvatar}</span>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                title="Upload image"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <span className="material-symbols-outlined text-white">upload</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-3 w-full">
                                            <div className="space-y-1.5">
                                                <p className="text-xs text-slate-400">Clique no quadro ao lado para carregar um arquivo ou insira um link abaixo:</p>
                                                <input
                                                    type="url"
                                                    placeholder="URL da imagem (ex: https://...)"
                                                    className="block w-full h-10 px-3 rounded-lg bg-black border border-neutral-dark-border text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-xs outline-none"
                                                    value={avatarUrl}
                                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setAvatarImage(""); setAvatarUrl(""); }}
                                                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined !text-[14px]">delete</span>
                                                Remover imagem personalizada
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Icon Avatar Selection */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Ou escolha um ícone</label>
                                    <div className="flex flex-wrap gap-4">
                                        {avatars.map((icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => { setSelectedAvatar(icon); setAvatarImage(""); setAvatarUrl(""); }}
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${selectedAvatar === icon && !avatarImage && !avatarUrl ? "bg-primary text-black scale-110 shadow-lg shadow-primary/20" : "bg-black border border-neutral-dark-border text-slate-500 hover:border-slate-400"}`}
                                            >
                                                <span className="material-symbols-outlined !text-[24px]">{icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="nickname">Nickname</label>
                                        <input
                                            id="nickname"
                                            className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-dark-border text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            placeholder="Seu apelido"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="email-profile">E-mail atual</label>
                                        <input
                                            id="email-profile"
                                            className="block w-full h-11 px-4 rounded-lg bg-black/50 border border-neutral-dark-border text-slate-500 cursor-not-allowed text-sm outline-none"
                                            type="email"
                                            value={user.email}
                                            readOnly
                                            placeholder="email@exemplo.com"
                                        />
                                        <p className="text-[10px] text-slate-500 italic">Para alterar seu e-mail, vá para a aba de Segurança.</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold px-8 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? "A salvar..." : "Salvar Alterações"}
                                    </button>
                                    {saveSuccess && (
                                        <span className="text-market-up text-sm font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                                            Alterações salvas!
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "aparencia" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">Personalização</h1>
                                <p className="text-slate-400 text-sm">Escolha o visual que melhor se adapta ao seu estilo de análise.</p>
                            </div>

                            <div className="space-y-6">
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Temas de Interface</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {themes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleSaveTheme(t.id)}
                                            className={`group relative flex flex-col p-4 rounded-xl border transition-all text-left ${theme === t.id ? "border-primary bg-primary/5" : "border-neutral-dark-border bg-black hover:border-slate-500"}`}
                                        >
                                            <div className={`w-full h-24 rounded-lg mb-3 ${t.color} border ${t.border} overflow-hidden flex flex-col p-2 gap-1`}>
                                                <div className="w-1/2 h-2 bg-slate-700 rounded opacity-50"></div>
                                                <div className="w-full h-12 bg-slate-800 rounded opacity-30 mt-auto border border-white/5"></div>
                                            </div>
                                            <span className={`text-sm font-bold ${theme === t.id ? "text-primary" : "text-white group-hover:text-primary"}`}>{t.name}</span>
                                            {theme === t.id && (
                                                <span className="absolute top-2 right-2 text-primary">
                                                    <span className="material-symbols-outlined !text-[20px]">check_circle</span>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 italic">* O tema selecionado será aplicado a todas as páginas do RASTRO.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "seguranca" && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h1 className="text-2xl font-bold text-white mb-2">Segurança e Acesso</h1>
                                <p className="text-slate-400 text-sm">Gerencie suas credenciais e configurações de segurança.</p>
                            </div>

                            {/* Email Change Section */}
                            <div className="p-6 rounded-xl bg-black/40 border border-neutral-dark-border space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">alternate_email</span>
                                    <h3 className="text-lg font-bold text-white">Alterar E-mail</h3>
                                </div>

                                {!verifyingEmail ? (
                                    <form onSubmit={handleStartEmailChange} className="space-y-4 max-w-md">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="new-email">Novo Endereço de E-mail</label>
                                            <input
                                                id="new-email"
                                                type="email"
                                                placeholder="novo-email@exemplo.com"
                                                className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-dark-border text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold px-6 rounded-lg transition-all flex items-center gap-2"
                                        >
                                            {isSaving ? "A enviar..." : "Salvar Novo E-mail"}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleConfirmEmailChange} className="space-y-6 max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2">
                                            <p className="text-sm text-slate-300">
                                                Um código foi enviado para <span className="text-primary font-bold">{newEmail}</span>.
                                            </p>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                className="block w-full h-12 text-center text-xl tracking-[0.4em] font-mono rounded-lg bg-black border border-primary/50 text-primary outline-none"
                                                value={emailCode}
                                                onChange={(e) => setEmailCode(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold px-8 rounded-lg transition-all"
                                            >
                                                Confirmar Alteração
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setVerifyingEmail(false)}
                                                className="text-sm text-slate-400 hover:text-white transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>)}
                            </div>

                            {/* Password Change Section */}
                            <div className="p-6 rounded-xl bg-black/40 border border-neutral-dark-border space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">lock_reset</span>
                                    <h3 className="text-lg font-bold text-white">Alterar Senha</h3>
                                </div>
                                <form onSubmit={handleSaveSecurity} className="max-w-md space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="current-pass">Senha Atual</label>
                                        <input
                                            id="current-pass"
                                            type="password"
                                            className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-dark-border text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="new-pass">Nova Senha</label>
                                        <input
                                            id="new-pass"
                                            type="password"
                                            className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-dark-border text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="confirm-pass">Confirmar Nova Senha</label>
                                        <input
                                            id="confirm-pass"
                                            type="password"
                                            className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-dark-border text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-black font-bold rounded-lg transition-all shadow-lg shadow-primary/20"
                                        >
                                            Alterar Senha
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
