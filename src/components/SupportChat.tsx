"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { usePathname } from "next/navigation";

const SUPPORT_PROMPT = `Você é o Assistente Virtual Oficial da plataforma RASTRO, um painel avançado de análise de investimentos impulsionado por IA.
Sua missão é EXCLUSIVAMENTE ajudar os usuários a navegarem no site, explicarem métricas (como o Dividend Yield validado por IA, Score de Sentimento e Visão 360) e recolher feedbacks ou reportes de bugs.

REGRAS DE INTELIGÊNCIA E TOM DE VOZ:

IDENTIDADE E TOM:

Você se chama "Assistente Rastro". Refira-se à inteligência analítica do site como "Nossa IA". Nunca mencione o nome de outras IAs (como ChatGPT, Grok, etc).

Seja extremamente educado, direto e profissional, mas com um toque de modernidade tecnológica.

CONHECIMENTO DA PLATAFORMA (RASTRO):

Visão 360: Um relatório completo gerado por IA sobre um ativo.

Dividend Yield (DY): Diga que nossa IA tenta validar o DY lendo relatórios recentes para corrigir erros comuns de APIs externas.

Perfil de Investidor: Nossa IA analisa os ativos do usuário e define o perfil dele.

Tickers N/D: Se o usuário reclamar que um ativo está "N/D" (Não Disponível), explique que o ticker pode ter mudado de nome, falido ou sido comprado na B3, e peça o código para repassarmos aos desenvolvedores.

DISTINÇÃO DE SENTIMENTO (FEEDBACKS):

Elogio/Sugestão de Melhoria: Seja grato e entusiasmado. Ex: "Ficamos muito felizes com a sua sugestão! Queremos sempre melhorar o RASTRO."

Bug/Erro/Reclamação: Seja empático e resolutivo. Ex: "Pedimos desculpas por esse problema técnico. Vamos registrar isso agora mesmo para a nossa equipe corrigir."

CAPTAÇÃO DE DADOS (TRIAGEM):

Se o usuário reportar um erro ou der uma sugestão estrutural, pergunte sempre o e-mail dele e peça que detalhe o que aconteceu, para que a equipe de engenharia possa investigar.

O GATILHO DE ENCERRAMENTO (OBRIGATÓRIO):

Assim que o usuário fornecer o e-mail e a descrição do problema/sugestão, sua resposta seguinte (e final sobre o assunto) DEVE OBRIGATORIAMENTE conter a frase exata:
"Muito obrigado! Registramos sua mensagem e seu contato."

Você pode completar a frase (ex: "Muito obrigado! Registramos sua mensagem e seu contato. Nossa equipe técnica vai analisar o caso."), mas o gatilho exato deve estar presente para o sistema salvar no banco de dados.

GUARDA-COSTAS JURÍDICO:

NUNCA dê conselhos financeiros. Se o usuário perguntar "Qual ação eu compro?" ou "Acha que PETR4 vai subir?", responda que o RASTRO fornece dados e análises de IA para estudo, mas não faz recomendações de investimento. O usuário é o único responsável por suas decisões.`;

interface Message {
    role: "user" | "assistant";
    text: string;
}

const suggestionPool = [
    // TECNOLOGIA E IA
    { icon: 'psychology', text: 'Como a Nossa IA analisa o Visão 360?', cat: 'Tecnologia' },
    { icon: 'auto_awesome', text: 'Qual a fonte de dados que a Nossa IA utiliza?', cat: 'Tecnologia' },
    { icon: 'verified', text: 'O que significa o selo "Validado por IA" no DY?', cat: 'Tecnologia' },
    { icon: 'query_stats', text: 'A Nossa IA consegue prever preços futuros?', cat: 'Dúvida' },
    { icon: 'precision_manufacturing', text: 'Como a IA resume os Bull e Bear Cases?', cat: 'IA' },
    { icon: 'analytics', text: 'O que é o Score de Sentimento do Rastro?', cat: 'Análise' },

    // DIVIDENDOS E MÉTRICAS
    { icon: 'payments', text: 'Por que o Dividend Yield da IA difere da API?', cat: 'Dividendos' },
    { icon: 'trending_up', text: 'Como vejo as projeções de dividendos futuros?', cat: 'Dividendos' },
    { icon: 'account_balance', text: 'Onde encontro o P/L e P/VP dos ativos?', cat: 'Métricas' },
    { icon: 'show_chart', text: 'A variação diária é atualizada em tempo real?', cat: 'Dados' },
    { icon: 'history', text: 'Como a IA filtra dividendos extraordinários?', cat: 'Dividendos' },

    // PERFIL E CONTA
    { icon: 'account_circle', text: 'Como altero minha foto de perfil e apelido?', cat: 'Perfil' },
    { icon: 'monitoring', text: 'Como a Nossa IA define meu perfil de investidor?', cat: 'Perfil' },
    { icon: 'manage_accounts', text: 'Como posso alterar meu e-mail de cadastro?', cat: 'Conta' },
    { icon: 'lock', text: 'Como faço para redefinir minha senha?', cat: 'Segurança' },
    { icon: 'badge', text: 'O que significa o status "Conta Ativa" no perfil?', cat: 'Conta' },
    { icon: 'logout', text: 'Como faço para sair da minha conta com segurança?', cat: 'Conta' },

    // SUPORTE E ERROS
    { icon: 'error', text: 'O que fazer se um ticker aparecer como N/D?', cat: 'Suporte' },
    { icon: 'bug_report', text: 'Encontrei um erro visual, como posso reportar?', cat: 'Suporte' },
    { icon: 'travel_explore', text: 'Por que não encontro um ticker específico?', cat: 'Busca' },
    { icon: 'refresh', text: 'Com que frequência os dados de mercado atualizam?', cat: 'Dados' },
    { icon: 'help', text: 'Como entrar em contato com um administrador?', cat: 'Suporte' },

    // JURÍDICO E RISCO
    { icon: 'gavel', text: 'Onde leio os termos de isenção de responsabilidade?', cat: 'Segurança' },
    { icon: 'warning', text: 'As análises do Rastro são recomendações de compra?', cat: 'Aviso' },
    { icon: 'shield', text: 'Como meus dados de portfólio são protegidos?', cat: 'Segurança' },
    { icon: 'description', text: 'Onde aceito os termos de uso de IA?', cat: 'Segurança' },

    // NAVEGAÇÃO E RECURSOS
    { icon: 'visibility_off', text: 'Por que alguns dados aparecem borrados?', cat: 'Vitrine' },
    { icon: 'hub', text: 'Como funciona o Rastro de ativos?', cat: 'Plataforma' },
    { icon: 'star', text: 'Como vejo os ativos favoritos da Nossa IA?', cat: 'Destaque' },
    { icon: 'lightbulb', text: 'Como usar o Visão 360 para estudar uma ação?', cat: 'Educação' },
    { icon: 'school', text: 'Onde encontro os tutoriais de uso do RASTRO?', cat: 'Aprendizado' },
    { icon: 'group', text: 'Como participo da comunidade no Square?', cat: 'Social' },
    { icon: 'workspace_premium', text: 'Quais os planos de assinatura disponíveis?', cat: 'Premium' }
];

export default function SupportChat() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [randomSuggestions, setRandomSuggestions] = useState<typeof suggestionPool>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showBadge, setShowBadge] = useState(true);
    const [hasTriggeredIdle, setHasTriggeredIdle] = useState(false);
    const [isFeedbackFlow, setIsFeedbackFlow] = useState(false);

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const getPageName = useCallback((path: string) => {
        if (path === '/') return "Página Inicial";
        if (path.startsWith('/asset/')) {
            const ticker = path.split('/')[2];
            return `Análise do ativo ${ticker}`;
        }
        if (path === '/tracking') return "Rastreamento de ativos";
        if (path === '/square') return "Comunidade Square";
        if (path === '/portfolio') return "Meu Portfólio";
        if (path === '/profile') return "Meu Perfil";
        if (path === '/login') return "Página de Login";
        return "Navegação do site";
    }, []);

    const triggerIdleHelp = useCallback(() => {
        if (isOpen || hasTriggeredIdle) return;
        
        const pageName = getPageName(pathname);
        setIsOpen(true);
        setShowBadge(false);
        setHasTriggeredIdle(true);
        
        const idleMessage: Message = {
            role: "assistant",
            text: `Olá! Notei que você está na seção de **${pageName}** há alguns minutos. 

Posso te ajudar com alguma dúvida sobre como usar as ferramentas desta página?`
        };
        setMessages([idleMessage]);
    }, [isOpen, hasTriggeredIdle, pathname, getPageName]);

    useEffect(() => {
        const resetIdleTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (!hasTriggeredIdle) {
                idleTimerRef.current = setTimeout(triggerIdleHelp, 10 * 60 * 1000); // 10 minutos
            }
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, resetIdleTimer));
        
        resetIdleTimer();

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
        };
    }, [triggerIdleHelp, hasTriggeredIdle]);

    useEffect(() => {
        const handleOpenChatEvent = () => {
            setIsOpen(true);
            setIsMinimized(false);
            setShowBadge(false);
        };

        window.addEventListener('open-support-chat', handleOpenChatEvent);
        
        const handleFeedbackChatEvent = () => {
            setIsOpen(true);
            setIsMinimized(false);
            setShowBadge(false);
            setIsFeedbackFlow(true);
            setMessages([{
                role: "assistant",
                text: "Olá! Como podemos melhorar o RASTRO? Que feedback você gostaria de enviar?"
            }]);
        };
        window.addEventListener('open-feedback-chat', handleFeedbackChatEvent);

        // Sorteando os itens do pool (exibindo todos os 30+ itens no carrossel)
        const shuffled = [...suggestionPool].sort(() => 0.5 - Math.random());
        setRandomSuggestions(shuffled);

        return () => {
            window.removeEventListener('open-support-chat', handleOpenChatEvent);
            window.removeEventListener('open-feedback-chat', handleFeedbackChatEvent);
        };
    }, []);
    const chatRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (!carouselRef.current) return;
        const scrollAmount = 200; // Aproximadamente a largura de um card + gap
        carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

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

        // --- FLUXO DE FEEDBACK DIRETO (SEM IA) ---
        if (isFeedbackFlow) {
            try {
                // 1. Enviar para a Inbox do Admin
                await fetch('/api/support/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user?.email || "usuario@anonimo.com",
                        subject: "Feedback do Usuário (Rodapé)",
                        message: text
                    })
                });

                // 2. Resposta de agradecimento imediata
                setTimeout(() => {
                    setMessages(prev => [...prev, { 
                        role: "assistant", 
                        text: "Muito obrigado! Registramos sua mensagem. Como posso te ajudar mais hoje?" 
                    }]);
                    setIsFeedbackFlow(false);
                    setIsLoading(false);
                }, 800);
                return;
            } catch (err) {
                console.error("Erro ao enviar feedback:", err);
            }
        }

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

            // Gatilho para enviar mensagem à inbox admin quando o email é capturado
            if (reply.includes("Registramos sua mensagem e seu contato")) {
                const chatSummary = [...updatedMessages, { role: "assistant", text: reply }]
                    .map(m => `${m.role === 'user' ? 'Usuário' : 'Bot'}: ${m.text}`)
                    .join('\n');

                fetch('/api/support/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user?.email || "usuario@anonimo.com",
                        subject: "Suporte (Chatbot)",
                        message: chatSummary
                    })
                }).catch(err => console.error("Erro ao notificar admin via inbox:", err));
            }
        } catch {
            setMessages((prev) => [...prev, { role: "assistant", text: "⚠️ Erro de conexão. Tente novamente." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* BOTÃO FLUTUANTE */}
            <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end gap-3 group transition-opacity duration-300 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* JANELA DO CHAT */}
                <div className="w-[90vw] md:w-[500px] max-h-[85vh] bg-zinc-950 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 absolute bottom-full right-0 mb-3">

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
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                title="Minimizar"
                            >
                                <span className="material-symbols-outlined text-xl">remove</span>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                                title="Fechar"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                    </div>

                    {/* MESSAGES AREA */}
                    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ minHeight: "350px", maxHeight: "400px" }}>

                        {/* Mensagem de boas-vindas */}
                        {messages.length === 0 && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex-none flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">S</div>
                                <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 max-w-[85%] border border-zinc-700 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-zinc-700/50">
                                        <div className="bg-primary/10 px-2 py-0.5 rounded text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20">
                                            Fale Conosco
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-200">
                                        ⚡ Olá! Bem-vindo ao suporte do <strong className="text-amber-400">RASTRO</strong>. Como podemos ajudar você hoje?
                                    </p>
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

                    {/* PERGUNTAS RÁPIDAS (MODERNO + CARROSSEL + SETAS) */}
                    {messages.length === 0 && (
                        <div className="px-4 pb-4">
                            <div className="relative group/carousel">
                                {/* Setas de Navegação */}
                                <button
                                    onClick={() => scrollCarousel('left')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-900/90 border border-zinc-700 text-white flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-lg whitespace-nowrap">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => scrollCarousel('right')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-900/90 border border-zinc-700 text-white flex items-center justify-center hover:bg-primary hover:text-black transition-all shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-lg whitespace-nowrap">chevron_right</span>
                                </button>

                                <div
                                    ref={carouselRef}
                                    className="flex overflow-x-auto snap-x snap-mandatory gap-3 mb-4 no-scrollbar pb-2"
                                >
                                    {randomSuggestions.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => sendMessage(item.text)}
                                            className="flex-none w-[180px] snap-start flex flex-col text-left p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-primary/50 hover:bg-neutral-800 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined !text-[16px] text-primary">{item.icon}</span>
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{item.cat}</span>
                                            </div>
                                            <p className="text-xs text-neutral-300 group-hover:text-white font-medium line-clamp-2">"{item.text}"</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-[0.3em]">
                                    Clique em uma sugestão para perguntar ao suporte
                                </p>
                            </div>
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

                {/* BOTÃO DE FECHAR (FLUTUANTE) - Só aparece se NÃO estiver minimizado */}
                {!isMinimized && (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-red-500/20 hover:to-red-500/40 text-zinc-400 hover:text-red-500 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border border-zinc-700/50"
                        title="Fechar Chat"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                )}
            </div>

            {/* ABA MINIMIZADA (FORA DO CONTAINER PRINCIPAL PARA POSICIONAMENTO FIXO) */}
            {isMinimized && (
                <button
                    onClick={() => setIsMinimized(false)}
                    className="fixed bottom-6 right-6 z-[9999] px-4 py-3 bg-zinc-900 border border-primary/50 rounded-xl shadow-2xl flex items-center gap-3 hover:bg-zinc-800 transition-all animate-in slide-in-from-right-10 duration-500 group/minimized"
                >
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-black text-sm font-bold">support_agent</span>
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-white group-hover/minimized:text-primary transition-colors">Chat de Suporte</p>
                        <p className="text-[10px] text-zinc-400 font-medium italic">Assistente ativo...</p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-500 ml-1 group-hover/minimized:translate-y-[-2px] transition-transform">keyboard_double_arrow_up</span>
                </button>
            )}
        </>
    );
}
