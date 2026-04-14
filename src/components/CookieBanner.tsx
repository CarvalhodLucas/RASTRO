"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("rastro-cookie-consent");
        if (!consent) {
            // Pequeno delay para impacto visual premium
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleConsent = (level: "accepted" | "essential") => {
        localStorage.setItem("rastro-cookie-consent", level);
        setIsVisible(false);
        // Dispara evento para o componente de Analytics recarregar se necessário
        window.dispatchEvent(new Event("cookie-consent-updated"));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[600px] z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6">
                <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">cookie</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-white font-bold text-lg">Cookies & Privacidade</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Utilizamos cookies para personalizar sua experiência e analisar nosso tráfego. 
                            Ao clicar em "Aceitar", você concorda com nossa <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => handleConsent("accepted")}
                        className="flex-1 bg-primary text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Aceitar Todos
                    </button>
                    <button 
                        onClick={() => handleConsent("essential")}
                        className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                        Apenas Necessários
                    </button>
                </div>
            </div>
        </div>
    );
}
