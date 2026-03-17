"use client";

import React, { useState, useRef, useEffect } from "react";

const SUPPORT_PROMPT = `Você é o Agente de Suporte do Terminal RASTRO. O seu único objetivo é ajudar o usuário a navegar e usar a plataforma.
REGRAS DE OURO:
- COMO ADICIONAR ATIVO: Acesse 'Rastreamento' no menu, pesquise o ticker e clique no ícone de estrela (+) para adicionar à sua Watchlist.
- NOTA IA (Score): São geradas por análise técnica e fundamentalista. Escala de 0 a 10. 0-4 = Bearish (Pessimista), 5-7 = Neutro, 7.5-10 = Bullish (Otimista).
- CÁLCULO DE UPSIDE: O sistema projeta o crescimento estimado com base na nota da IA versus o preço atual de mercado.
- RELATÓRIO 360°: Disponível na página individual de cada ativo. Clique em "Ver Relatório Completo" para expandir.
- DUELO DE GIGANTES: Compare dois ativos lado a lado clicando no botão "Comparar" na página do ativo.
- CHAT DA IA: Cada página de ativo tem um chat contextual onde você pode fazer perguntas específicas sobre aquele ativo.
- CRIPTOMOEDAS: Dados de criptos são obtidos em tempo real via CoinGecko. Mercado cripto opera 24/7.
- CONTATO: Para suporte técnico, entre em contato pelos canais oficiais do RASTRO.
ESTILO: Seja breve, técnico e direto. Use emojis de terminal (⚡, 🔗, 🛡️, 📊, 🎯). Máximo de 3-4 linhas por resposta.
IMPORTANTE: Responda APENAS dúvidas sobre a plataforma RASTRO. Se perguntado sobre análise de ativos específicos, redirecione o usuário para a página do ativo com o chat IA contextual.`;

interface Message {
    role: "user" | "assistant";
    text: string;
}

const QUICK_QUESTIONS = [
    "Como adicionar um ativo?",
    "O que significa a nota IA?",
    "Como calcular o Upside?",
    "Como comparar dois ativos?",
];

export default function SupportChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showBadge, setShowBadge] = useState(true);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const handleOpen = () => {
        setIsOpen(true);
        setShowBadge(false);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { role: "user", text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: text,
                    systemPrompt: SUPPORT_PROMPT,
                }),
            });

            const data = await response.json();
            const reply = data.reply || data.text || "Não consegui processar sua dúvida. Tente novamente.";
            setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", text: "⚠️ Erro de conexão. Tente novamente." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* BOTÃO FLUTUANTE */}
            <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end gap-3 group transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                {/* Tooltip de Info */}
                <div className="mb-1 hidden group-hover:block w-max bg-black border border-amber-400/50 px-3 py-1 rounded text-[10px] font-black text-amber-400 uppercase tracking-tighter shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                    SUPORTE RASTRO
                </div>

                {/* JANELA DO CHAT */}
                {isOpen && (
                    <div className="w-[90vw] md:w-[380px] max-h-[80vh] bg-zinc-950 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 absolute bottom-full right-0 mb-3">

                        {/* HEADER */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black/40">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center text-black">
                                        <span className="material-symbols-outlined text-lg">support_agent</span>
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Suporte RASTRO</p>
                                    <p className="text-[10px] text-green-400 font-mono uppercase">● Online</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* MESSAGES AREA */}
                        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ minHeight: "240px", maxHeight: "280px" }}>

                            {/* Mensagem de boas-vindas */}
                            {messages.length === 0 && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex-none flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">S</div>
                                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 max-w-[85%] border border-zinc-700">
                                        <p className="text-xs text-slate-200">⚡ Olá! Sou o Suporte do <strong className="text-amber-400">RASTRO</strong>. Posso ajudar com dúvidas sobre como usar a plataforma.</p>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className={`w-7 h-7 rounded-full flex-none flex items-center justify-center text-[10px] font-bold ${msg.role === "user" ? "bg-slate-700 text-white" : "bg-primary/20 text-primary border border-primary/20"}`}>
                                        {msg.role === "user" ? "EU" : "S"}
                                    </div>
                                    <div className={`rounded-2xl p-3 max-w-[85%] ${msg.role === "user" ? "bg-primary/20 border border-primary/30 rounded-tr-none text-white" : "bg-zinc-800 border border-zinc-700 rounded-tl-none text-slate-200"}`}>
                                        <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex-none flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">S</div>
                                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 border border-zinc-700 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PERGUNTAS RÁPIDAS */}
                        {messages.length === 0 && (
                            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                                {QUICK_QUESTIONS.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="text-[10px] px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 hover:text-white rounded-lg border border-zinc-700 hover:border-zinc-500 transition-all font-medium"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* INPUT */}
                        <div className="p-3 border-t border-zinc-800 bg-black/30">
                            <div className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                                    placeholder="Sua dúvida sobre o RASTRO..."
                                    disabled={isLoading}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary placeholder-slate-500 disabled:opacity-50"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={isLoading || !input.trim()}
                                    className="p-2 bg-primary hover:bg-primary/90 text-black rounded-xl transition-all disabled:opacity-40 flex-none"
                                >
                                    <span className="material-symbols-outlined text-sm">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BOTÃO DE ABRIR/FECHAR */}
                <button
                    onClick={isOpen ? () => setIsOpen(false) : handleOpen}
                    className="relative w-14 h-14 bg-gradient-to-br from-amber-500 to-primary hover:from-amber-400 hover:to-primary/90 text-black rounded-full shadow-2xl shadow-amber-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl">
                        {isOpen ? "close" : "support_agent"}
                    </span>

                    {/* Badge de notificação */}
                    {!isOpen && showBadge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900 animate-pulse"></span>
                    )}
                </button>
            </div>
        </>
    );
}
