"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    // Tab state: "login" | "register"
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");

    // Form fields
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
    const [signupCode, setSignupCode] = useState("");
    const [sentCode, setSentCode] = useState("");

    const simulateEmailSend = (targetEmail: string, code: string) => {
        console.log(`[SIMULAÇÃO] Enviando e-mail para ${targetEmail}: Seu código é ${code}`);
        // Simple alert as a "toast" simulation
        alert(`Simulação: Um e-mail de confirmação foi enviado para ${targetEmail}. Verifique sua caixa de entrada.`);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.includes("@")) {
            setError("Por favor, insira um e-mail válido.");
            return;
        }
        if (password.length < 4) {
            setError("A senha deve ter pelo menos 4 caracteres.");
            return;
        }

        setIsLoading(true);

        // Simulate async login
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Save auth to localStorage using consolidated object
        const displayName = email.split("@")[0];
        const session = {
            name: displayName,
            email: email,
            isLoggedIn: true,
            theme: "dark"
        };
        localStorage.setItem("user_session", JSON.stringify(session));

        // Dispatch event for local state update
        window.dispatchEvent(new Event("auth-update"));

        setIsLoading(false);
        router.push("/");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!regEmail.includes("@")) {
            setError("Por favor, insira um e-mail válido.");
            return;
        }
        if (regPassword.length < 4) {
            setError("A senha deve ter pelo menos 4 caracteres.");
            return;
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (regEmail === "teste@exemplo.com") {
            setError("E-mail já cadastrado. Tente outro.");
            setIsLoading(false);
            return;
        }

        // Generate a simple 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        simulateEmailSend(regEmail, code);

        setVerifyingSignup(true);
        setIsLoading(false);
    };

    const handleConfirmSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (signupCode !== sentCode) {
            setError("Código incorreto. Tente novamente.");
            return;
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        const displayName = regName || regEmail.split("@")[0];
        const session = {
            name: displayName,
            email: regEmail,
            isLoggedIn: true,
            theme: "dark"
        };
        localStorage.setItem("user_session", JSON.stringify(session));

        window.dispatchEvent(new Event("auth-update"));

        setIsLoading(false);
        router.push("/");
    };

    const handleSocialLogin = (provider: string) => {
        alert(`Login com ${provider} em breve! 🚀`);
    };

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-neutral-dark-border px-6 md:px-10 py-3 bg-black sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-4 text-white hover:opacity-80 transition-opacity">
                    <div className="size-8 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined !text-[32px]">candlestick_chart</span>
                    </div>
                    <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">RASTRO</h2>
                </Link>
                <div className="flex flex-1 justify-end gap-8">
                    <nav className="hidden md:flex items-center gap-9">
                        <Link className="text-slate-300 hover:text-primary transition-colors text-sm font-medium leading-normal" href="/">Início</Link>
                        <Link className="text-slate-300 hover:text-primary transition-colors text-sm font-medium leading-normal" href="/mercado">Mercados</Link>
                    </nav>
                    <div className="flex gap-2">
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary hover:bg-primary-hover transition-colors text-black text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20">
                            <span className="truncate">Seja Pro</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative w-full bg-black overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                    <svg className="absolute top-1/2 left-0 w-full h-64 -translate-y-1/2 text-primary" fill="none" preserveAspectRatio="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 250 C 200 250, 200 150, 400 150 C 600 150, 600 200, 800 100 C 1000 0, 1000 50, 1200 50"></path>
                    </svg>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="w-full max-w-md z-10">
                    <div className="bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl shadow-2xl shadow-black overflow-hidden relative">
                        {/* Top accent line */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                        {/* Tabs */}
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

                        <div className="p-8 flex flex-col gap-6">
                            {/* Title */}
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    {activeTab === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    {activeTab === "login"
                                        ? "Acesse seu painel personalizado de inteligência de mercado."
                                        : "Comece a rastrear o mercado com inteligência artificial."}
                                </p>
                            </div>

                            {/* Social Login */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleSocialLogin("Google")}
                                    className="flex items-center justify-center gap-3 w-full h-11 bg-black border border-neutral-dark-border hover:border-slate-500 rounded-lg text-white text-sm font-medium transition-colors"
                                >
                                    <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrtPYcdpuJB3NQwA3F51BGuFRT3bybXkAEsJUkM2n6XgFdlBMKxjcghjmtZSEhHuP028HE9D9vsm-XPMp_o4htvxO0GQCM-3feW0tum4uAUhKmNgZBTX8Ji5rEcXeCIa52qZDVWEap0L4_PJIV3y3frccnrua188MDG6cifw3mT5HD3n-fGg12DdyjXP3C7l52DB3RsZEGJrCxpt8Yn8e4syLeScwDpzUier0wqYbTlz-JVB9p_0GnsECnW1njO_zX2oZqvMNt8v4" />
                                    Continuar com Google
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleSocialLogin("Apple")}
                                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-black border border-neutral-dark-border hover:border-slate-500 rounded-lg text-white text-sm font-medium transition-colors"
                                    >
                                        <img alt="Apple" className="w-5 h-5 invert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4PFHxe7SnyBkYrrh0vTfpRpoemdiL_gNy_J34HfVbgnBa7C7FTetk4Trrzq3SGnGYC3r0OiSahmVh9NZyz8iJ4eaFy04xVdMFnix6YUsjomLRq7n44fHaertU5VemwHJvspJ7iAFgIXklikZ6q4yTJFTQKHR-_hbZwenrzvj6JgP9CDEfkNDroyb2qOITpD2OFtqoXhtq8ZIqFPWE2irovTBWu2gTI2iPCtkABhE-FVtDAcL9ZXyRHPYiy-yFQCzwuVgTYzEC2QU" />
                                        <span className="hidden sm:inline">Apple</span>
                                    </button>
                                    <button
                                        onClick={() => handleSocialLogin("Microsoft")}
                                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-black border border-neutral-dark-border hover:border-slate-500 rounded-lg text-white text-sm font-medium transition-colors"
                                    >
                                        <img alt="Microsoft" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHzZ76FbUYTZg3OL6NKYE-AJkIMBfl9UgDkdmL-duI4SOqpQGRDAdHRZB5GiD82PwdwMOOI3eO6jmlPhbArsPFHBgp5rV4uAZzoQjZcUxlr4L9XJL1rvzEjfFzVPjjAfpavCmRaZT5_MarBOXJ4Atdutvzrmp0d1gAAobNj9bO9zayWcDZ7qdxVSpHgMx97__FaJGoNxMopLdMzz6SXs-n5EIR23azWyUNjccgGiNWaht91DRROkbyYeTfBPYJ8-fwIHNzeU-A2gM" />
                                        <span className="hidden sm:inline">Microsoft</span>
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-neutral-dark-border"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-slate-500 font-medium uppercase tracking-wider">ou entre com e-mail</span>
                                <div className="flex-grow border-t border-neutral-dark-border"></div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                                    <span className="material-symbols-outlined !text-[18px]">error</span>
                                    {error}
                                </div>
                            )}

                            {/* Login Form */}
                            {activeTab === "login" && (
                                <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="email">
                                            Endereço de E-mail
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined !text-[20px]">mail</span>
                                            </span>
                                            <input
                                                id="email"
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
                                        <div className="flex justify-between items-center">
                                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="password">
                                                Senha
                                            </label>
                                            <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Esqueceu a senha?</a>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined !text-[20px]">lock</span>
                                            </span>
                                            <input
                                                id="password"
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
                            )}

                            {/* Register Form */}
                            {activeTab === "register" && !verifyingSignup && (
                                <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="reg-name">
                                            Nome Completo
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined !text-[20px]">person</span>
                                            </span>
                                            <input
                                                id="reg-name"
                                                type="text"
                                                placeholder="Seu nome"
                                                value={regName}
                                                onChange={e => setRegName(e.target.value)}
                                                className="block w-full h-11 pl-10 pr-3 rounded-lg bg-black border border-neutral-dark-border text-white placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="reg-email">
                                            Endereço de E-mail
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined !text-[20px]">mail</span>
                                            </span>
                                            <input
                                                id="reg-email"
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
                                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="reg-password">
                                            Senha
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined !text-[20px]">lock</span>
                                            </span>
                                            <input
                                                id="reg-password"
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
                            )}

                            {/* Verification Form */}
                            {activeTab === "register" && verifyingSignup && (
                                <form className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleConfirmSignup}>
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined !text-[32px] text-primary">mark_email_read</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Verifique seu E-mail</h2>
                                        <p className="text-sm text-slate-400">
                                            Enviamos um código para <span className="text-white font-medium">{regEmail}</span>.
                                            Insira-o abaixo para ativar sua conta.
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
                                        {isLoading ? (
                                            <>
                                                <span className="material-symbols-outlined !text-[20px] animate-spin">progress_activity</span>
                                                Validando...
                                            </>
                                        ) : (
                                            <>
                                                <span>Ativar Conta</span>
                                                <span className="material-symbols-outlined !text-[20px]">verified</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setVerifyingSignup(false); setError(""); }}
                                        className="text-sm text-slate-400 hover:text-white transition-colors text-center"
                                    >
                                        Tentar outro e-mail
                                    </button>
                                </form>
                            )}

                            {/* Footer note */}
                            <p className="text-center text-xs text-slate-500">
                                Ao entrar, você concorda com nossos{" "}
                                <a className="text-slate-400 hover:text-primary underline decoration-slate-600 hover:decoration-primary underline-offset-2 transition-all" href="#">
                                    Termos de Serviço
                                </a>{" "}
                                e{" "}
                                <a className="text-slate-400 hover:text-primary underline decoration-slate-600 hover:decoration-primary underline-offset-2 transition-all" href="#">
                                    Política de Privacidade
                                </a>
                                .
                            </p>
                        </div>
                    </div>

                    {/* Back link */}
                    <div className="text-center mt-6">
                        <Link href="/" className="text-slate-500 hover:text-primary transition-colors text-sm flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
                            Voltar para o Dashboard
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
