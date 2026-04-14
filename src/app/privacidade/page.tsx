"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-display flex flex-col pt-20">
            <Header />
            
            <main className="flex-1 max-w-[900px] mx-auto px-6 py-20">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent mb-4 tracking-tight">
                        Política de Privacidade
                    </h1>
                    <p className="text-slate-500 text-sm">Última atualização: 13 de Abril de 2026</p>
                </div>

                <div className="space-y-12 prose prose-invert prose-slate max-w-none">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">1. Compromisso com a LGPD</h2>
                        <p className="leading-relaxed text-sm">
                            O RASTRO está comprometido com a segurança e privacidade dos dados de seus usuários, em total conformidade com a 
                            Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">2. Coleta de Dados</h2>
                        <p className="leading-relaxed text-sm mb-4">
                            Coletamos apenas as informações estritamente necessárias para o funcionamento da plataforma:
                        </p>
                        <ul className="text-sm space-y-2 list-disc pl-6 text-slate-400">
                            <li>Dados de Cadastro (E-mail e Nome) via Google Authentication.</li>
                            <li>Dados de Navegação (Cookies) de forma anonimizada, mediante seu consentimento explícito.</li>
                            <li>Informações de uso da conta para sincronização de portfólio.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">3. Uso de Cookies</h2>
                        <p className="leading-relaxed text-sm">
                            Utilizamos cookies para melhorar sua experiência e analisar o tráfego da plataforma. Como usuário, você tem o direito 
                            de recusar o rastreamento via nosso banner de consentimento. Caso opte por não aceitar, o Google Tag Manager (GTM) 
                            não será iniciado, mas as funcionalidades essenciais do site permanecerão ativas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">4. Seus Direitos</h2>
                        <p className="leading-relaxed text-sm mb-4">
                            De acordo com a LGPD, você possui os seguintes direitos:
                        </p>
                        <ul className="text-sm space-y-2 list-disc pl-6 text-slate-400">
                            <li>Acesso aos seus dados.</li>
                            <li>Correção de dados incompletos ou inexatos.</li>
                            <li>Eliminação dos dados pessoais (Exclusão da conta).</li>
                            <li>Revogação do consentimento para cookies a qualquer momento.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">5. Compartilhamento</h2>
                        <p className="leading-relaxed text-sm">
                            NÃO compartilhamos seus dados pessoais com terceiros para fins comerciais. O compartilhamento ocorre apenas com 
                            provedores de serviço essenciais (como autenticação do Google e serviços de infraestrutura) ou por obrigação legal.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
