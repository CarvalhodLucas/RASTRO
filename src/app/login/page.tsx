"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { user, hasMounted, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [verifyingSignup, setVerifyingSignup] = useState(false);
    const [signupCode, setSignupCode] = useState("");
    const [sentCode, setSentCode] = useState("");
    const [showTerms, setShowTerms] = useState(false);
    const [pendingSocialUser, setPendingSocialUser] = useState<any>(null);

    useEffect(() => {
        if (hasMounted && user) {
            router.push("/");
        }

        // Listen for Terms requirement
        const handleRequireTerms = (e: any) => {
            setPendingSocialUser(e.detail.socialUser);
            setRegEmail(e.detail.email);
            setShowTerms(true);
            setVerifyingSignup(false);
            setIsLoading(false);
        };

        // Listen for "No account found" error from useAuth
        const handleNoAccount = () => {
            setError("Conta não encontrada. Deseja criar uma?");
            setActiveTab("register");
            setIsLoading(false);
        };

        window.addEventListener("auth-require-terms", handleRequireTerms as any);
        window.addEventListener("auth-no-account", handleNoAccount);

        // PERSISTENCE CHECK: If we reloaded and have a pending registration, show terms
        const mode = localStorage.getItem("pending_auth_mode");
        if (mode === "register_intercepted") {
            setShowTerms(true);
        }

        return () => {
            window.removeEventListener("auth-require-terms", handleRequireTerms as any);
            window.removeEventListener("auth-no-account", handleNoAccount);
        };
    }, [hasMounted, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        
        localStorage.setItem("pending_auth_mode", "login");
        // For simplicity, we use handleLogin logic which will be caught by useAuth if it's social
        // or handled here if manual. Let's assume manual for now.
        
        // Manual login simulation
        await new Promise(r => setTimeout(r, 1000));
        const registeredStr = localStorage.getItem("registered_emails") || "[]";
        const registered = JSON.parse(registeredStr);
        
        if (registered.includes(email.toLowerCase().trim())) {
            const session = {
                name: email.split("@")[0],
                email: email,
                isLoggedIn: true,
                theme: "dark"
            };
            localStorage.setItem("user_session", JSON.stringify(session));
            window.dispatchEvent(new Event("auth-update"));
            router.push("/");
        } else {
            setError("E-mail não cadastrado.");
        }
        setIsLoading(false);
        localStorage.removeItem("pending_auth_mode");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!regEmail.includes("@")) return setError("E-mail inválido.");
        if (regPassword.length < 4) return setError("Senha curta.");

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        console.log(`CODE: ${code}`); // In a real app, send via email
        
        setVerifyingSignup(true);
        setIsLoading(false);
    };

    const handleConfirmSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (signupCode !== sentCode) return setError("Código incorreto.");
        
        setShowTerms(true);
        setVerifyingSignup(false);
    };

    const finalizeRegistration = async () => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1000));

        const emailToRegister = regEmail || pendingSocialUser?.email;
        const nameToRegister = regName || pendingSocialUser?.name || emailToRegister.split("@")[0];

        const session = {
            name: nameToRegister,
            email: emailToRegister,
            isLoggedIn: true,
            theme: "dark"
        };
        localStorage.setItem("user_session", JSON.stringify(session));

        const registeredStr = localStorage.getItem("registered_emails") || "[]";
        const registered = JSON.parse(registeredStr);
        if (!registered.includes(emailToRegister.toLowerCase())) {
            registered.push(emailToRegister.toLowerCase());
            localStorage.setItem("registered_emails", JSON.stringify(registered));
        }

        localStorage.removeItem("pending_auth_mode");
        window.dispatchEvent(new Event("auth-update"));
        setIsLoading(false);
        router.push("/");
    };

    if (!hasMounted) return null;

    return (
        <main className="bg-black font-display text-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl shadow-2xl overflow-hidden p-8">
                
                {/* Tabs */}
                {!verifyingSignup && !showTerms && (
                    <div className="flex border-b border-neutral-dark-border mb-8">
                        <button onClick={() => setActiveTab("login")} className={`flex-1 py-4 text-sm font-bold ${activeTab === "login" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>Entrar</button>
                        <button onClick={() => setActiveTab("register")} className={`flex-1 py-4 text-sm font-bold ${activeTab === "register" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>Criar Conta</button>
                    </div>
                )}

                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-4">{error}</div>}

                {/* Forms */}
                {!showTerms && !verifyingSignup && activeTab === "login" && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <button type="button" onClick={() => { localStorage.setItem("pending_auth_mode", "login"); signIn("google"); }} className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 mb-2">Continuar com Google</button>
                        <p className="text-[10px] text-slate-500 text-center mb-6 leading-tight">
                            Ao continuar, você concorda com nossos <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                        </p>
                        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary" />
                        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary" />
                        <button type="submit" className="w-full py-3 bg-primary text-black font-bold rounded-lg">Entrar</button>
                    </form>
                )}

                {!showTerms && !verifyingSignup && activeTab === "register" && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <button type="button" onClick={() => { localStorage.setItem("pending_auth_mode", "register"); signIn("google"); }} className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 mb-2">Continuar com Google</button>
                        <p className="text-[10px] text-slate-500 text-center mb-6 leading-tight">
                            Ao continuar, você concorda com nossos <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                        </p>
                        <input type="text" placeholder="Nome" value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary" />
                        <input type="email" placeholder="E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary" />
                        <input type="password" placeholder="Senha" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary" />
                        <button type="submit" className="w-full py-3 bg-primary text-black font-bold rounded-lg">Criar Conta</button>
                    </form>
                )}

                {verifyingSignup && !showTerms && (
                    <form onSubmit={handleConfirmSignup} className="space-y-4 text-center">
                        <p className="text-sm text-slate-400 mb-4">Insira o código enviado para {regEmail}</p>
                        <input type="text" maxLength={6} placeholder="000000" value={signupCode} onChange={e => setSignupCode(e.target.value)} className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg text-center text-xl tracking-widest outline-none focus:border-primary" />
                        <button type="submit" className="w-full py-3 bg-primary text-black font-bold rounded-lg">Ativar Conta</button>
                    </form>
                )}

                {showTerms && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-center">Termo de Responsabilidade</h2>
                        <div className="bg-black/40 border border-neutral-dark-border p-4 rounded-xl max-h-60 overflow-y-auto text-xs text-slate-400 leading-relaxed text-justify">
                            <p className="font-bold text-white mb-2 italic">Ao criar sua conta no RASTRO, você declara estar ciente de que:</p>
                            <p className="mb-2"><strong>1. Não é Recomendação:</strong> Todo o conteúdo, análises e métricas exibidas são para fins estritamente educativos e informativos.</p>
                            <p className="mb-2"><strong>2. Tecnologia de IA:</strong> O relatório 'Visão 360' e demais análises são gerados automaticamente por modelos de Inteligência Artificial.</p>
                            <p><strong>3. Responsabilidade do Usuário:</strong> Você é o único responsável por suas decisões financeiras.</p>
                        </div>
                        <button onClick={finalizeRegistration} className="w-full py-3 bg-primary text-black font-bold rounded-lg flex items-center justify-center gap-2">Aceitar e Finalizar Cadastro <span className="material-symbols-outlined">check_circle</span></button>
                        <button onClick={() => { setShowTerms(false); setActiveTab("login"); localStorage.removeItem("pending_auth_mode"); }} className="w-full py-2 text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">Discordo e Cancelar</button>
                    </div>
                )}
            </div>
            <Link href="/" className="mt-8 text-slate-500 hover:text-primary transition-colors text-sm">Voltar para o Dashboard</Link>
        </main>
    );
}
