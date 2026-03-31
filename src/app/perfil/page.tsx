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

    const [investorProfile, setInvestorProfile] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [assetCount, setAssetCount] = useState(0);

    useEffect(() => {
        const checkStats = () => {
            const saved = localStorage.getItem('user_watchlist');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setAssetCount(parsed.length);
                    }
                } catch (e) {}
            }
        };

        checkStats();
        window.addEventListener("storage", checkStats);
        // Dispatching a custom event when watchlist changes would be ideal, 
        // but for now we listen to storage and auth-update
        window.addEventListener("auth-update", checkStats);
        return () => {
            window.removeEventListener("storage", checkStats);
            window.removeEventListener("auth-update", checkStats);
        };
    }, []);

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
            // Updated size limit to 5MB to accommodate modern images better
            if (file.size > 5 * 1024 * 1024) {
                alert("A imagem é muito grande. Por favor, escolha uma imagem com menos de 5MB.");
                return;
            }
            setIsSaving(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatarImage(base64String);
                setAvatarUrl("");
                
                // Formulate immediate update to user profile
                if (user) {
                    updateProfile({
                        avatarImage: base64String
                    });
                }
                
                setTimeout(() => {
                    setIsSaving(false);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                }, 500);
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

    const handleAnalyzeProfile = async () => {
        const saved = localStorage.getItem('user_watchlist');
        let portfolio = [];
        if (saved) {
            try {
                portfolio = JSON.parse(saved);
            } catch (e) {}
        }

        if (!portfolio || portfolio.length === 0) {
            setInvestorProfile("Não foi possível realizar a análise porque a lista de ativos se encontra vazia.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/profile/analyze', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolio: portfolio.join(', ') })
            });
            const data = await res.json();
            if (data.profile) {
                setInvestorProfile(data.profile);
            }
        } catch (error) {
            console.error("Erro ao analisar perfil:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };


    if (!hasMounted || !user) return null;

    const avatars = ["person", "face", "account_circle", "sentiment_very_satisfied", "star", "rocket_launch"];
    const themes = [
        { id: "dark", name: "Dark (Padrão)", color: "bg-[#121212]", border: "border-[#333333]" },
        { id: "light", name: "Light Mode", color: "bg-white", border: "border-slate-200" },
        { id: "amoled", name: "Amoled (Preto Puro)", color: "bg-[#000000]", border: "border-[#111111]" },
        { id: "market-blue", name: "Market Blue", color: "bg-[#0a192f]", border: "border-[#172a45]" }
    ];

    return (
        <div className="bg-[#0a0a0a] font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            <Header currentPath="#" />

            {/* PROFILE HEADER (Banner) */}
            <div className="w-full bg-neutral-950 border-b border-neutral-900 pt-8 pb-12 px-4 md:px-8 relative overflow-hidden">
                {/* Efeito visual de fundo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-primary/5 blur-[100px] pointer-events-none rounded-full"></div>
                
                <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
                    {/* Avatar Grande */}
                    <div className="relative group">
                        <button 
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            disabled={isSaving}
                            className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-black border border-neutral-800 shadow-2xl flex items-center justify-center overflow-hidden transition-all hover:border-primary/50 group/avatar relative"
                        >
                            {isSaving ? (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/40 flex items-center justify-center transition-all z-10 opacity-0 group-hover/avatar:opacity-100">
                                    <span className="material-symbols-outlined text-white !text-24px">upload</span>
                                </div>
                            )}
                            
                            {avatarUrl || avatarImage ? (
                                <img src={avatarUrl || avatarImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined !text-[48px] text-primary">{selectedAvatar}</span>
                            )}
                        </button>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-neutral-950 text-black shadow-lg pointer-events-none">
                            <span className="material-symbols-outlined !text-[14px] font-bold">edit</span>
                        </div>
                    </div>

                    {/* Info do Usuário */}
                    <div className="text-center md:text-left flex-1 pb-2">
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">{nickname || user.name || 'Usuário RASTRO'}</h1>
                        <p className="text-slate-400 font-medium text-sm flex items-center justify-center md:justify-start gap-2">
                            <span className="material-symbols-outlined !text-[16px]">mail</span>
                            {user.email}
                        </p>
                    </div>
                    
                    {/* Badge de Status */}
                    <div className="pb-4">
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Conta Ativa
                        </div>
                    </div>
                </div>
            </div>

            {/* RESTANTE DO CONTEÚDO */}
            <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
                {/* Sidebar atualizada */}
                <aside className="w-full lg:w-64 flex flex-col gap-1.5 shrink-0">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 mb-3">Configurações</h2>
                    {[
                        { id: "geral", icon: "person", label: "Perfil Geral" },
                        { id: "aparencia", icon: "palette", label: "Aparência" },
                        { id: "seguranca", icon: "security", label: "Segurança" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-neutral-900 hover:text-white"}`}
                        >
                            <span className="material-symbols-outlined !text-[20px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}

                    <div className="mt-8 pt-6 border-t border-neutral-900">
                        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all w-full text-left">
                            <span className="material-symbols-outlined !text-[20px]">logout</span>
                            Sair da Conta
                        </button>
                    </div>
                </aside>

                {/* Content Area */}
                <section className="flex-1 bg-transparent p-0">
                    {activeTab === "geral" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* CARDS DE ESTATÍSTICAS & IA */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {/* Card 1: Ativos */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                                        <span className="material-symbols-outlined">monitoring</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Ativos no Portfólio</p>
                                        <h3 className="text-2xl font-black text-white">{assetCount}</h3>
                                    </div>
                                </div>

                                {/* Card 2: Tempo de Conta */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Membro Desde</p>
                                        <h3 className="text-2xl font-black text-white">{user?.joinedAt || "2026"}</h3>
                                    </div>
                                </div>

                                {/* Card 3: Perfil IA */}
                                <div className="bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full"></div>
                                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined !text-[14px]">smart_toy</span> IA RASTRO
                                    </p>
                                    
                                    {investorProfile ? (
                                        <p className="text-sm text-neutral-300 leading-relaxed font-medium">{investorProfile}</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-sm font-bold text-white">Descubra seu Perfil de Investidor</h3>
                                            <button 
                                                onClick={handleAnalyzeProfile}
                                                disabled={isAnalyzing}
                                                className="mt-1 h-9 bg-neutral-800 hover:bg-primary hover:text-black text-white text-xs font-bold rounded-lg transition-all border border-neutral-700 hover:border-primary w-full"
                                            >
                                                {isAnalyzing ? "Analisando..." : "Gerar Análise"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-neutral-950/50 border border-neutral-900 rounded-2xl p-6 md:p-8">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-white mb-2">Informações Pessoais</h1>
                                    <p className="text-slate-400 text-sm">Gerencie seu perfil e como você aparece para outros usuários.</p>
                                </div>

                                <form onSubmit={handleSaveGeneral} className="space-y-8">
                                    {/* Avatar Selection */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">Avatar Personalizado</label>
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="w-24 h-24 rounded-2xl bg-black border-2 border-dashed border-neutral-800 flex items-center justify-center overflow-hidden group relative transition-colors hover:border-primary/50">
                                                {avatarUrl || avatarImage ? (
                                                    <img src={avatarUrl || avatarImage} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined !text-[40px] text-slate-600 group-hover:text-primary transition-colors">{selectedAvatar}</span>
                                                )}
                                                <input
                                                    id="avatar-upload"
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
                                                        className="block w-full h-10 px-3 rounded-lg bg-black border border-neutral-800 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-xs outline-none"
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
                                                    onClick={() => { 
                                                        setSelectedAvatar(icon); 
                                                        setAvatarImage(""); 
                                                        setAvatarUrl("");
                                                        // Auto-save the icon choice
                                                        if (user) {
                                                            setIsSaving(true);
                                                            updateProfile({ avatar: icon, avatarImage: undefined });
                                                            setTimeout(() => {
                                                                setIsSaving(false);
                                                                setSaveSuccess(true);
                                                                setTimeout(() => setSaveSuccess(false), 3000);
                                                            }, 400);
                                                        }
                                                    }}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${selectedAvatar === icon && !avatarImage && !avatarUrl ? "bg-primary text-black scale-110 shadow-lg shadow-primary/20" : "bg-black border border-neutral-800 text-slate-500 hover:border-slate-400"}`}
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
                                                className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-800 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                placeholder="Seu apelido"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="email-profile">E-mail atual</label>
                                            <div className="flex items-center gap-2.5 bg-black/50 border border-neutral-800 rounded-lg px-3.5 h-11">
                                                <div className="w-6 h-6 rounded-full bg-black border border-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                                                    {avatarUrl || avatarImage ? (
                                                        <img src={avatarUrl || avatarImage} alt="Mini Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined !text-[16px] text-primary">{selectedAvatar}</span>
                                                    )}
                                                </div>
                                                <input
                                                    id="email-profile"
                                                    className="bg-transparent border-none text-slate-500 cursor-not-allowed text-sm outline-none flex-1 truncate"
                                                    type="email"
                                                    value={user.email}
                                                    readOnly
                                                    placeholder="email@exemplo.com"
                                                />
                                            </div>
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
                        </div>
                    )}

                    {activeTab === "aparencia" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-neutral-950/50 border border-neutral-900 rounded-2xl p-6 md:p-8">
                                <div className="mb-8">
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
                                                className={`group relative flex flex-col p-4 rounded-xl border transition-all text-left ${theme === t.id ? "border-primary bg-primary/5" : "border-neutral-800 bg-black hover:border-slate-500"}`}
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
                        </div>
                    )}

                    {activeTab === "seguranca" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-neutral-950/50 border border-neutral-900 rounded-2xl p-6 md:p-8">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-white mb-2">Segurança e Acesso</h1>
                                    <p className="text-slate-400 text-sm">Gerencie suas credenciais e configurações de segurança.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {/* Email Change Section */}
                                    <div className="p-6 rounded-xl bg-black border border-neutral-800 space-y-6">
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
                                                        className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-800 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
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
                                    <div className="p-6 rounded-xl bg-black border border-neutral-800 space-y-6">
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
                                                    className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-800 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
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
                                                    className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-800 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
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
                                                    className="block w-full h-11 px-4 rounded-lg bg-black border border-neutral-800 text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
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
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
