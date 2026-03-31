"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ADMIN_EMAILS } from "@/lib/constants";

export default function AuthModal() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"login" | "register" | "no-account">("login");

    // Login fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Register fields
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [showRegPassword, setShowRegPassword] = useState(false);

    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [verifyingSignup, setVerifyingSignup] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [signupCode, setSignupCode] = useState("");
    const [sentCode, setSentCode] = useState("");
    const [pendingSocialUser, setPendingSocialUser] = useState<any>(null);

    useEffect(() => {
        const handleOpen = (e: any) => {
            if (e.detail?.tab) setActiveTab(e.detail.tab);
            setIsOpen(true);
            setError("");
            setVerifyingSignup(false);
        };

        window.addEventListener("open-auth-modal" as any, handleOpen);
        return () => window.removeEventListener("open-auth-modal" as any, handleOpen);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setError("");
        setVerifyingSignup(false);
        setShowTerms(false);
    };

    useEffect(() => {
        const handleRequireTerms = (e: any) => {
            console.log("[AuthModal] Terms required event received");
            setPendingSocialUser(e.detail.socialUser);
            setRegEmail(e.detail.email);
            setShowTerms(true);
            setVerifyingSignup(false);
            setIsLoading(false);
            setIsOpen(true); // Open the modal automatically!
        };

        const handleNoAccount = () => {
            console.log("[AuthModal] No account event received");
            setActiveTab("no-account");
            setIsLoading(false);
            setIsOpen(true); // Open the modal automatically!
        };

        window.addEventListener("auth-require-terms", handleRequireTerms as any);
        window.addEventListener("auth-no-account", handleNoAccount);

        // PERSISTENCE CHECK: If we reloaded and have a pending registration
        const mode = localStorage.getItem("pending_auth_mode");
        if (mode === "register_intercepted") {
            setShowTerms(true);
            setIsOpen(true);
            setActiveTab("register");
        }

        return () => {
            window.removeEventListener("auth-require-terms", handleRequireTerms as any);
            window.removeEventListener("auth-no-account", handleNoAccount);
        };
    }, []);

    const simulateEmailSend = (targetEmail: string, code: string) => {
        console.log(`[SIMULAÇÃO] Enviando e-mail para ${targetEmail}: Seu código é ${code}`);
        alert(`Simulação: Um e-mail de confirmação foi enviado para ${targetEmail}. Código: ${code}`);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email.includes("@")) return setError("E-mail inválido.");
        if (password.length < 4) return setError("Senha curta.");

        setIsLoading(true);

        const emailLower = email.toLowerCase().trim();
        const registeredStr = localStorage.getItem("registered_emails") || "[]";
        const registered: string[] = JSON.parse(registeredStr);
        const allAllowed = [...registered, ...ADMIN_EMAILS].map(e => e.toLowerCase().trim());

        if (!allAllowed.includes(emailLower)) {
            setActiveTab("no-account");
            setIsLoading(false);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const session = {
            name: email.split("@")[0],
            email: email,
            isLoggedIn: true,
            theme: "dark",
            joinedAt: new Date().getFullYear().toString()
        };
        localStorage.setItem("user_session", JSON.stringify(session));
        window.dispatchEvent(new Event("auth-update"));
        
        setIsLoading(false);
        handleClose();
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!regEmail.includes("@")) return setError("E-mail inválido.");
        if (regPassword.length < 4) return setError("Senha curta.");

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        simulateEmailSend(regEmail, code);
        setVerifyingSignup(true);
        setIsLoading(false);
    };

    const handleConfirmSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (signupCode !== sentCode) return setError("Código de verificação incorreto.");

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Instead of finalizing, show Terms
        setShowTerms(true);
        setVerifyingSignup(false);
        setIsLoading(false);
    };

    const finalizeRegistration = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const emailToRegister = regEmail || pendingSocialUser?.email;
        const nameToRegister = regName || pendingSocialUser?.name || emailToRegister.split("@")[0];

        const session = {
            name: nameToRegister,
            email: emailToRegister,
            isLoggedIn: true,
            theme: "dark",
            avatarImage: pendingSocialUser?.avatarImage || undefined
        };
        localStorage.setItem("user_session", JSON.stringify(session));

        // Add email to registered accounts list
        const regEmailLower = emailToRegister.toLowerCase().trim();
        const registeredStr = localStorage.getItem("registered_emails") || "[]";
        const registered: string[] = JSON.parse(registeredStr);
        if (!registered.some(e => e.toLowerCase() === regEmailLower)) {
            registered.push(regEmailLower);
            localStorage.setItem("registered_emails", JSON.stringify(registered));
        }

        localStorage.removeItem("pending_auth_mode");
        sessionStorage.removeItem("auth_intercepted");
        window.dispatchEvent(new Event("auth-update"));
        setIsLoading(false);
        handleClose();
        router.push("/");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={handleClose}>
            <div 
                className="w-full max-w-md z-10 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl shadow-2xl shadow-black overflow-y-auto max-h-[92vh] relative no-scrollbar">
                    {/* Top accent line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                    {/* Close Button */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {/* Tabs */}
                    {!verifyingSignup && !showTerms && activeTab !== "no-account" && (
                        <div className="flex border-b border-neutral-dark-border">
                            <button
                                onClick={() => { setActiveTab("login"); setError(""); }}
                                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "login" ? "text-primary border-b-2 border-primary bg-neutral-dark-surface" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => { setActiveTab("register"); setError(""); }}
                                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "register" ? "text-primary border-b-2 border-primary bg-neutral-dark-surface" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                            >
                                Criar Conta
                            </button>
                        </div>
                    )}

                    <div className="px-8 py-6 flex flex-col gap-5">
                        {activeTab === "no-account" ? (
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" />
                                    </svg>
                                </div>
                                
                                <h2 className="text-2xl font-bold text-white mb-2">Conta não encontrada</h2>
                                <p className="text-slate-400 mb-8">
                                    Vimos que você ainda não possui uma conta vinculada a este e-mail. Vamos criar uma agora?
                                </p>

                                <div className="flex flex-col gap-3 w-full">
                                    <button 
                                        onClick={() => {
                                            setActiveTab("register");
                                        }}
                                        className="w-full h-12 bg-primary hover:bg-primary-hover text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                                    >
                                        Criar minha conta
                                    </button>
                                    <button 
                                        onClick={() => {
                                            handleClose();
                                            router.push("/");
                                        }}
                                        className="w-full h-12 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-medium rounded-xl transition-all"
                                    >
                                        Voltar ao início
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Title */}
                                {!verifyingSignup && !showTerms && (
                                    <div className="text-center mb-8">
                                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                            {activeTab === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
                                        </h1>
                                        <p className="text-slate-400 text-sm">
                                            {activeTab === "login"
                                                ? "Acesse seu painel personalizado de inteligência de mercado."
                                                : "Comece a rastrear o mercado com inteligência artificial."}
                                        </p>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                        <span className="material-symbols-outlined !text-[18px]">error</span>
                                        {error}
                                    </div>
                                )}

                                {/* Login Form */}
                                {activeTab === "login" && !verifyingSignup && !showTerms && (
                                    <div className="flex flex-col gap-4">
                                        {/* Social Login */}
                                        <div className="flex flex-col gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    localStorage.setItem("pending_auth_mode", "login");
                                                    signIn('google', { callbackUrl: '/' });
                                                }}
                                                className="w-full h-12 bg-white hover:bg-gray-50 text-[#3c4043] font-medium text-[15px] rounded-lg transition-all flex items-center justify-center gap-3 border border-gray-300 shadow-sm mb-4"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                                    <path fill="#FBBC05" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                                    <path fill="#EA4335" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                                    <path fill="#34A853" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                                    <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                                </svg>
                                                Continuar com o Google
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="relative flex py-1 items-center mb-2">
                                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                                            <span className="flex-shrink-0 mx-4 text-xs text-slate-500 font-medium uppercase tracking-wider">ou entre com e-mail</span>
                                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                                        </div>

                                        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide ml-1">
                                                    Endereço de E-mail
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                        <span className="material-symbols-outlined !text-[20px]">mail</span>
                                                    </span>
                                                    <input
                                                        type="email"
                                                        placeholder="nome@exemplo.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        required
                                                        className="block w-full h-11 pl-10 pr-3 rounded-lg bg-black border border-neutral-dark-border text-white placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center ml-1">
                                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                                                        Senha
                                                    </label>
                                                    <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Esqueceu?</a>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                        <span className="material-symbols-outlined !text-[20px]">lock</span>
                                                    </span>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        required
                                                        className="block w-full h-11 pl-10 pr-10 rounded-lg bg-black border border-neutral-dark-border text-white placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined !text-[20px]">
                                                            {showPassword ? "visibility_off" : "visibility"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span className="material-symbols-outlined !text-[20px] animate-spin">progress_activity</span>
                                                        A verificar...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Entrar</span>
                                                        <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Register Form */}
                                {activeTab === "register" && !verifyingSignup && !showTerms && (
                                    <div className="flex flex-col gap-4">
                                        {/* Social Signup */}
                                        <div className="flex flex-col gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    localStorage.setItem("pending_auth_mode", "register");
                                                    signIn('google', { callbackUrl: '/' });
                                                }}
                                                className="w-full h-12 bg-white hover:bg-gray-50 text-[#3c4043] font-medium text-[15px] rounded-lg transition-all flex items-center justify-center gap-3 border border-gray-300 shadow-sm mb-4"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                                    <path fill="#FBBC05" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                                    <path fill="#EA4335" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                                    <path fill="#34A853" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                                    <path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                                </svg>
                                                Continuar com o Google
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="relative flex py-1 items-center mb-2">
                                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                                            <span className="flex-shrink-0 mx-4 text-xs text-slate-500 font-medium uppercase tracking-wider">ou cadastre com e-mail</span>
                                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                                        </div>

                                        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide ml-1">
                                                    Nome Completo
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                        <span className="material-symbols-outlined !text-[20px]">person</span>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        placeholder="Seu nome"
                                                        value={regName}
                                                        onChange={e => setRegName(e.target.value)}
                                                        className="block w-full h-11 pl-10 pr-3 rounded-lg bg-black border border-neutral-dark-border text-white placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide ml-1">
                                                    Endereço de E-mail
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                        <span className="material-symbols-outlined !text-[20px]">mail</span>
                                                    </span>
                                                    <input
                                                        type="email"
                                                        placeholder="nome@exemplo.com"
                                                        value={regEmail}
                                                        onChange={e => setRegEmail(e.target.value)}
                                                        required
                                                        className="block w-full h-11 pl-10 pr-3 rounded-lg bg-black border border-neutral-dark-border text-white placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide ml-1">
                                                    Senha
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                        <span className="material-symbols-outlined !text-[20px]">lock</span>
                                                    </span>
                                                    <input
                                                        type={showRegPassword ? "text" : "password"}
                                                        placeholder="Crie uma senha forte"
                                                        value={regPassword}
                                                        onChange={e => setRegPassword(e.target.value)}
                                                        required
                                                        className="block w-full h-11 pl-10 pr-10 rounded-lg bg-black border border-neutral-dark-border text-white placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRegPassword(!showRegPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined !text-[20px]">
                                                            {showRegPassword ? "visibility_off" : "visibility"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span className="material-symbols-outlined !text-[20px] animate-spin">progress_activity</span>
                                                        A verificar...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Criar Conta</span>
                                                        <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Verification Form */}
                                {verifyingSignup && (
                                    <form className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleConfirmSignup}>
                                        <div className="text-center space-y-2">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined !text-[32px] text-primary">mark_email_read</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-white">Verifique seu E-mail</h2>
                                            <p className="text-sm text-slate-400">
                                                Enviamos um código para <span className="text-white font-medium">{regEmail}</span>.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide text-center" htmlFor="otp">
                                                Código de 6 dígitos
                                            </label>
                                            <input
                                                id="otp"
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={signupCode}
                                                onChange={e => setSignupCode(e.target.value)}
                                                required
                                                className="block w-full h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-lg bg-black border border-neutral-dark-border text-primary placeholder-slate-800 focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? "Validando..." : "Ativar Conta"}
                                        </button>
                                    </form>
                                )}

                                {/* Terms of Responsibility Step */}
                                {showTerms && (
                                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="text-center space-y-2">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined !text-[32px] text-primary">gavel</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Termo de Responsabilidade</h2>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                                                Uso de Inteligência Artificial
                                            </p>
                                        </div>

                                        <div className="bg-black/40 border border-neutral-dark-border rounded-xl p-5 overflow-y-auto max-h-[350px] no-scrollbar text-[13px] text-slate-300 leading-relaxed font-sans text-justify shadow-inner">
                                            <p className="mb-4 text-white font-bold italic text-sm">
                                                Ao criar sua conta no RASTRO, você declara estar ciente de que:
                                            </p>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-primary font-bold text-[11px] uppercase tracking-wider mb-1">1. Não é Recomendação</h4>
                                                    <p>Todo o conteúdo, análises e métricas exibidas são para fins estritamente educativos e informativos. Nada nesta plataforma constitui oferta, solicitação ou recomendação de compra ou venda de ativos financeiros.</p>
                                                </div>

                                                <div>
                                                    <h4 className="text-primary font-bold text-[11px] uppercase tracking-wider mb-1">2. Tecnologia de IA</h4>
                                                    <p>O relatório 'Visão 360' e demais análises são gerados automaticamente por modelos de Inteligência Artificial. Embora busquemos a máxima precisão, sistemas de IA podem apresentar 'alucinações' ou dados imprecisos.</p>
                                                </div>

                                                <div>
                                                    <h4 className="text-primary font-bold text-[11px] uppercase tracking-wider mb-1">3. Responsabilidade do Usuário</h4>
                                                    <p>Você é o único responsável por suas decisões financeiras. Recomendamos a validação de qualquer dado em fontes oficiais e a consulta a profissionais certificados antes de investir.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <button
                                                type="button"
                                                onClick={finalizeRegistration}
                                                disabled={isLoading}
                                                className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? (
                                                    <span className="material-symbols-outlined !text-[20px] animate-spin">progress_activity</span>
                                                ) : (
                                                    <>
                                                        <span>Aceitar e Finalizar Cadastro</span>
                                                        <span className="material-symbols-outlined !text-[20px]">check_circle</span>
                                                    </>
                                                )}
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowTerms(false);
                                                    setActiveTab("login");
                                                    setPendingSocialUser(null);
                                                    localStorage.removeItem("pending_auth_mode");
                                                    sessionStorage.removeItem("auth_intercepted");
                                                }}
                                                className="w-full h-10 bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 font-medium rounded-xl transition-all text-xs uppercase tracking-widest"
                                            >
                                                Discordo e Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Footer note */}
                        <p className="text-center text-xs text-slate-500">
                            Ao entrar, você concorda com nossos{" "}
                            <a className="text-slate-400 hover:text-primary underline decoration-slate-600 hover:decoration-primary underline-offset-2 transition-all" href="#">
                                Termos
                            </a>{" "}
                            e{" "}
                            <a className="text-slate-400 hover:text-primary underline decoration-slate-600 hover:decoration-primary underline-offset-2 transition-all" href="#">
                                Privacidade
                            </a>
                            .
                        </p>

                        {/* Back link */}
                        <div className="text-center mt-2">
                            <Link 
                                href="/" 
                                onClick={handleClose}
                                className="text-slate-500 hover:text-primary transition-colors text-sm flex items-center justify-center gap-1"
                            >
                                <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
                                Voltar para o Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
