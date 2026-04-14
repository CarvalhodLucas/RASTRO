"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 font-display flex flex-col pt-20">
            <Header />
            
            <main className="flex-1 max-w-[900px] mx-auto px-6 py-20">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent mb-4 tracking-tight">
                        Termos de Uso
                    </h1>
                    <p className="text-slate-500 text-sm">Última atualização: 13 de Abril de 2026</p>
                </div>

                <div className="space-y-12 prose prose-invert prose-slate max-w-none">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">1. Aceitação dos Termos</h2>
                        <p className="leading-relaxed text-sm">
                            Ao acessar e utilizar a plataforma RASTRO, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. 
                            Se você não concordar com qualquer parte destes termos, você não deve acessar o serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">2. Natureza Informacional (CVM 20/2021)</h2>
                        <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-xl mb-6">
                            <p className="text-amber-500 font-bold mb-2">IMPORTANTE: NÃO CONSTITUI RECOMENDAÇÃO</p>
                            <p className="text-sm leading-relaxed text-amber-500/80">
                                O RASTRO é uma plataforma de inteligência de mercado que fornece dados e análises automatizadas via Inteligência Artificial. 
                                NENHUM CONTEÚDO aqui exibido constitui recomendação direta de compra ou venda de ativos financeiros. 
                                O mercado de capitais envolve riscos e a decisão final de investimento é de responsabilidade exclusiva do usuário.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">3. Propriedade Intelectual</h2>
                        <p className="leading-relaxed text-sm">
                            Todo o conteúdo da plataforma, incluindo logotipos, design, algoritmos e relatórios proprietários, é propriedade do RASTRO 
                            e está protegido pelas leis de direitos autorais e tratados internacionais.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">4. Limitação de Responsabilidade</h2>
                        <p className="leading-relaxed text-sm">
                            O RASTRO não se responsabiliza por perdas financeiras decorrentes do uso das informações fornecidas. 
                            Buscamos a máxima precisão nos dados, mas não garantimos sua infalibilidade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-4 border-l-2 border-primary pl-4">5. Modificações</h2>
                        <p className="leading-relaxed text-sm">
                            Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso continuado da plataforma após as mudanças 
                            implica na aceitação dos novos termos.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
