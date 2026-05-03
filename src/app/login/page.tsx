"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { user, hasMounted } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showTerms, setShowTerms] = useState(false);

    useEffect(() => {
        if (hasMounted && user) {
            router.push("/");
        }

        // Check for error in URL
        const params = new URLSearchParams(window.location.search);
        const urlError = params.get('error');
        if (urlError) {
            setError(urlError);
        }
    }, [hasMounted, user, router]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);
        
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            setError(loginError.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : loginError.message);
        } else {
            router.push("/");
        }
        setIsLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!regEmail.includes("@")) return setError("E-mail inválido.");
        if (regPassword.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");

        setShowTerms(true);
    };

    const finalizeRegistration = async () => {
        setIsLoading(true);
        setError("");
        
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: regEmail,
            password: regPassword,
            options: {
                data: {
                    full_name: regName
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setShowTerms(false);
        } else {
            if (data.session) {
                router.push("/");
            } else {
                setSuccess("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
                setShowTerms(false);
            }
        }
        setIsLoading(false);
    };

    const handleSocialLogin = async (provider: 'google') => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) setError(error.message);
        setIsLoading(false);
    };

    if (!hasMounted) return null;

    return (
        <main className="bg-black font-display text-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl shadow-2xl overflow-hidden p-8">
                
                {/* Tabs */}
                {!showTerms && (
                    <div className="flex border-b border-neutral-dark-border mb-8">
                        <button onClick={() => { setActiveTab("login"); setError(""); setSuccess(""); }} className={`flex-1 py-4 text-sm font-bold ${activeTab === "login" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>Entrar</button>
                        <button onClick={() => { setActiveTab("register"); setError(""); setSuccess(""); }} className={`flex-1 py-4 text-sm font-bold ${activeTab === "register" ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>Criar Conta</button>
                    </div>
                )}

                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-4">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs p-3 rounded-lg mb-4">{success}</div>}

                {/* Forms */}
                {!showTerms && activeTab === "login" && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <button type="button" disabled={isLoading} onClick={() => handleSocialLogin('google')} className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 mb-2 hover:bg-slate-100 transition-colors">
                           <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" /> Continuar com Google
                        </button>
                        <p className="text-[10px] text-slate-500 text-center mb-6 leading-tight">
                            Ao continuar, você concorda com nossos <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                        </p>
                        <div className="relative flex items-center mb-4">
                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                            <span className="flex-shrink mx-4 text-slate-600 text-[10px] uppercase font-bold">ou</span>
                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                        </div>
                        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary text-white" />
                        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary text-white" />
                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50">
                            {isLoading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>
                )}

                {!showTerms && activeTab === "register" && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <button type="button" disabled={isLoading} onClick={() => handleSocialLogin('google')} className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 mb-2 hover:bg-slate-100 transition-colors">
                           <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" /> Continuar com Google
                        </button>
                        <p className="text-[10px] text-slate-500 text-center mb-6 leading-tight">
                            Ao continuar, você concorda com nossos <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                        </p>
                        <div className="relative flex items-center mb-4">
                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                            <span className="flex-shrink mx-4 text-slate-600 text-[10px] uppercase font-bold">ou</span>
                            <div className="flex-grow border-t border-neutral-dark-border"></div>
                        </div>
                        <input type="text" placeholder="Nome" value={regName} onChange={e => setRegName(e.target.value)} required className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary text-white" />
                        <input type="email" placeholder="E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary text-white" />
                        <input type="password" placeholder="Senha" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full bg-black border border-neutral-dark-border p-3 rounded-lg outline-none focus:border-primary text-white" />
                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-black font-bold rounded-lg hover:brightness-110 transition-all">
                            {isLoading ? "Processando..." : "Criar Conta"}
                        </button>
                    </form>
                )}

                {showTerms && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-xl font-bold text-center">Termo de Responsabilidade</h2>
                        <div className="bg-black/40 border border-neutral-dark-border p-4 rounded-xl max-h-60 overflow-y-auto text-xs text-slate-400 leading-relaxed text-justify">
                            <p className="font-bold text-white mb-2 italic">Ao criar sua conta no RASTRO, você declara estar ciente de que:</p>
                            <p className="mb-2"><strong>1. Não é Recomendação:</strong> Todo o conteúdo, análises e métricas exibidas são para fins estritamente educativos e informativos.</p>
                            <p className="mb-2"><strong>2. Tecnologia de IA:</strong> O relatório 'Visão 360' e demais análises são gerados automaticamente por modelos de Inteligência Artificial.</p>
                            <p><strong>3. Responsabilidade do Usuário:</strong> Você é o único responsável por suas decisões financeiras.</p>
                        </div>
                        <button onClick={finalizeRegistration} disabled={isLoading} className="w-full py-3 bg-primary text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
                            {isLoading ? "Cadastrando..." : "Aceitar e Finalizar Cadastro"} <span className="material-symbols-outlined">check_circle</span>
                        </button>
                        <button onClick={() => setShowTerms(false)} className="w-full py-2 text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">Discordo e Cancelar</button>
                    </div>
                )}
            </div>
            <Link href="/" className="mt-8 text-slate-500 hover:text-primary transition-colors text-sm">Voltar para o Dashboard</Link>
        </main>
    );
}
