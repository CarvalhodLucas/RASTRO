"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SEO from "@/components/SEO";

export default function SobrePage() {
    const handleRegisterClick = () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'register' } }));
    };

    const handleLoginClick = () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }));
    };

    const features = [
        {
            icon: "grid_view",
            title: "Mapa de Calor Multi-mercado",
            desc: "Visualização avançada e adaptativa do desempenho de ativos em formato treemap. Filtre instantaneamente entre B3, S&P 500 e Criptomoedas."
        },
        {
            icon: "psychology",
            title: "Inteligência Artificial Nativa",
            desc: "Relatórios de IA e diagnósticos automatizados sob demanda sobre qualquer ticker utilizando modelos mais avançados."
        },
        {
            icon: "forum",
            title: "Square: Fórum de Estrategistas",
            desc: "Compartilhe teses Bullish e Bearish, debata visões de mercado e aprenda com análises de analistas e traders em nossa comunidade."
        },
        {
            icon: "account_balance_wallet",
            title: "Monitoramento de Portfólio",
            desc: "Acompanhe seus papéis favoritos com cotações dinâmicas e políticas estritas de cache local para dados rápidos e confiáveis."
        },
        {
            icon: "rss_feed",
            title: "Feed de Notícias Integrado",
            desc: "Notícias reais em tempo real puxadas dinamicamente via GNews. Chega de ruído: veja o que impacta os seus ativos imediatamente."
        },
        {
            icon: "speed",
            title: "Interface de Alta Performance",
            desc: "Painel estilo Bloomberg em Dark Mode nativo com micro-animações otimizadas para carregamento ultra-rápido de dados."
        }
    ];

    const targetAudience = [
        {
            icon: "person",
            title: "Investidores Individuais",
            desc: "Acompanhe o mercado local (B3) e internacional (S&P 500, Cripto) de forma simplificada com resumos em linguagem natural gerados por IA."
        },
        {
            icon: "trending_up",
            title: "Traders & Analistas",
            desc: "Identifique tendências rapidamente por meio do mapa de calor de variações e publique suas teses de investimento no fórum."
        },
        {
            icon: "monitoring",
            title: "Entusiastas de Tecnologia",
            desc: "Explore o cruzamento de dados de mercado tradicionais e criptoativos com inteligência de ponta integrada aos modelos LLM mais modernos."
        }
    ];

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            <SEO
                canonicalPath="/sobre"
                schemaMarkup={{
                    "@context": "https://schema.org",
                    "@type": "AboutPage",
                    "name": "Sobre o RASTRO",
                    "description": "Saiba o que é o RASTRO, a plataforma de inteligência de mercado alimentada por inteligência artificial para monitoramento de ativos e análises preditivas.",
                    "url": "https://www.rastroia.com/sobre"
                }}
            />
            <Header currentPath="/sobre" />

            <main className="flex-1 w-full bg-black">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-16 md:py-32 border-b border-zinc-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                    <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative z-10 text-center space-y-8">
                        {/* Tagline */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-pulse">
                            <span className="material-symbols-outlined !text-[14px]">auto_awesome</span>
                            O Futuro da Análise Financeira
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                            O pulso do mercado financeiro, <br />
                            <span className="bg-gradient-to-r from-primary via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
                                decodificado por Inteligência Artificial.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            O RASTRO é um terminal financeiro moderno projetado para unificar cotações em tempo real, análises de sentimento e relatórios de inteligência artificial de ativos da B3, S&P 500 e Criptomoedas.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                            <button
                                onClick={handleRegisterClick}
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-extrabold rounded-xl hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(251,191,36,0.15)] flex items-center justify-center gap-2 cursor-pointer text-base"
                            >
                                <span className="material-symbols-outlined font-bold">rocket_launch</span>
                                Começar Grátis
                            </button>
                            <Link
                                href="/"
                                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-800 hover:text-primary transition-all flex items-center justify-center gap-2 text-base"
                            >
                                <span className="material-symbols-outlined">explore</span>
                                Explorar Painel
                            </Link>
                        </div>
                    </div>
                </section>

                {/* What is Rastro */}
                <section className="py-20 border-b border-zinc-900 bg-black">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-white text-3xl md:text-4xl font-extrabold tracking-tight">
                                    O que é o <span className="text-primary">RASTRO</span>?
                                </h2>
                                <p className="text-slate-400 leading-relaxed text-base">
                                    Diferente de portais de notícias convencionais ou planilhas estáticas, o RASTRO é um ecossistema analítico. Nós coletamos preços atualizados de ações e cripto, filtramos o ruído e aplicamos modelos generativos de IA para extrair valor e contexto das cotações.
                                </p>
                                <p className="text-slate-400 leading-relaxed text-base">
                                    Com nossa plataforma, você ganha acesso a relatórios dinâmicos gerados em segundos sobre a situação macro e microeconômica de empresas e criptoativos, além de ver de forma macro o mapa de calor de variações diárias do mercado nacional e internacional.
                                </p>
                                <div className="pt-2 flex flex-wrap gap-6 text-sm text-slate-300 font-semibold">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                        B3 Integrada
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                        S&P 500
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                        Criptomoedas
                                    </div>
                                </div>
                            </div>

                            {/* Visual Terminal Block */}
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                                
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                                        <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                                        <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                                    </div>
                                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">RASTRO Core Engine</span>
                                </div>

                                <div className="font-mono text-xs text-slate-400 space-y-3">
                                    <p className="text-zinc-600">// Processando Ticker: PETR4.SA</p>
                                    <p className="text-green-500"><span className="text-slate-500">&gt;</span> Cotação Atualizada: R$ 38,40 (+1.8%)</p>
                                    <p className="text-[#fbbf24]"><span className="text-slate-500">&gt;</span> Executando varredura IA...</p>
                                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-slate-300 space-y-2 mt-2 leading-relaxed">
                                        <p className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                                            <span className="material-symbols-outlined text-primary !text-[14px]">psychology</span>
                                            DIAGNÓSTICO SINTÉTICO:
                                        </p>
                                        <p className="text-[11px]">
                                            Ativo operando em forte canal de alta, sustentado por elevação no preço do barril tipo Brent. Sentimento geral do mercado é predominantemente BULLISH.
                                        </p>
                                    </div>
                                    <p className="text-zinc-600">// Pronto. Taxa de cache 99.8% válida por 6h.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Features */}
                <section className="py-20 border-b border-zinc-900 bg-zinc-950/20">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-2xl mx-auto">
                            <h2 className="text-white text-3xl md:text-4xl font-extrabold tracking-tight">
                                Recursos para <span className="text-primary">Superar o Mercado</span>
                            </h2>
                            <p className="text-slate-400 text-base">
                                Desenvolvido para entregar o máximo de informação com clareza visual impecável e processamento de dados extremamente rápido.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    className="bg-zinc-950 border border-zinc-850 hover:border-primary/50 transition-all duration-350 p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] group shadow-lg"
                                >
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                                            <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                                        </div>
                                        <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">{f.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Target Audience */}
                <section className="py-20 border-b border-zinc-900 bg-black">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-2xl mx-auto">
                            <h2 className="text-white text-3xl md:text-4xl font-extrabold tracking-tight">
                                Quem pode usar o <span className="text-primary">RASTRO</span>?
                            </h2>
                            <p className="text-slate-400 text-base">
                                A nossa plataforma é flexível e adapta-se a diferentes perfis de investidores e analistas do mercado financeiro.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {targetAudience.map((t, i) => (
                                <div
                                    key={i}
                                    className="bg-[#121212]/50 border border-zinc-800 rounded-2xl p-8 space-y-4 flex flex-col items-center text-center hover:border-zinc-700 transition-colors"
                                >
                                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined !text-[32px]">{t.icon}</span>
                                    </div>
                                    <h3 className="text-white font-extrabold text-lg">{t.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{t.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Register */}
                <section className="py-20 border-b border-zinc-900 bg-zinc-950/20">
                    <div className="max-w-[1000px] mx-auto px-4 md:px-8">
                        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
                            <div className="absolute -left-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                            
                            <div className="lg:col-span-8 space-y-6 relative z-10">
                                <h2 className="text-white text-3xl font-extrabold tracking-tight">
                                    Por que se cadastrar na plataforma?
                                </h2>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    A maior parte dos recursos analíticos básicos é livre para consulta. Contudo, ao criar sua conta gratuita, você desbloqueia:
                                </p>
                                <ul className="space-y-3 text-slate-300 text-sm font-medium">
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary !text-[18px]">verified</span>
                                        Criação de portfólios customizados com cache local e persistência em nuvem.
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary !text-[18px]">verified</span>
                                        Acesso ao Square Fórum para registrar suas próprias teses de investimento Bull/Bear.
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary !text-[18px]">verified</span>
                                        Histórico estendido de cotações e relatórios detalhados com IA ilimitados.
                                    </li>
                                </ul>
                            </div>

                            <div className="lg:col-span-4 flex justify-center lg:justify-end relative z-10">
                                <button
                                    onClick={handleRegisterClick}
                                    className="px-6 py-4 bg-primary text-black font-extrabold rounded-xl hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 w-full sm:w-auto text-center cursor-pointer uppercase tracking-widest text-xs"
                                >
                                    Criar Conta Grátis
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 md:py-32 bg-black text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-black to-black"></div>
                    <div className="max-w-[800px] mx-auto px-4 relative z-10 space-y-8">
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                            Comece a rastrear o mercado de forma inteligente hoje.
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                            Crie sua conta em menos de 1 minuto e junte-se aos primeiros testadores beta do RASTRO.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={handleRegisterClick}
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-extrabold rounded-xl hover:bg-primary-hover transition-all cursor-pointer text-sm"
                            >
                                Registrar-se Agora
                            </button>
                            <button
                                onClick={handleLoginClick}
                                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-800 text-slate-300 font-bold rounded-xl hover:bg-zinc-900 transition-all cursor-pointer text-sm"
                            >
                                Já tenho conta
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
