"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export default function LogoutModal() {
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-logout-confirm", handleOpen);
        return () => window.removeEventListener("open-logout-confirm", handleOpen);
    }, []);

    if (!isOpen) return null;

    const handleConfirm = () => {
        logout();
        setIsOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-neutral-dark-surface border border-neutral-dark-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        <span className="material-symbols-outlined !text-[32px]">logout</span>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white tracking-tight">Encerrar Sessão?</h3>
                        <p className="text-sm text-slate-400 leading-relaxed uppercase tracking-widest font-black text-[10px]">
                            Você tem certeza que deseja sair da plataforma RASTRO?
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="h-12 border border-neutral-dark-border text-slate-300 font-bold rounded-xl hover:bg-neutral-dark-surface transition-all text-xs uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 text-xs uppercase tracking-widest"
                        >
                            Sim, Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
