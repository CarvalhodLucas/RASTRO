import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { portfolio } = await req.json();
        const userPortfolio = portfolio || "Nenhum ativo selecionado"; 

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: "grok-beta", // ou grok-2
                messages: [
                    {
                        role: "system",
                        content: "Você é um especialista financeiro da plataforma RASTRO. Sua missão é ler os ativos do usuário e definir o perfil dele em no máximo 3 linhas (ex: Conservador, Arrojado, etc), usando um tom profissional mas moderno."
                    },
                    {
                        role: "user",
                        content: `Analise meu portfólio e me diga meu perfil de investidor: ${userPortfolio}`
                    }
                ]
            })
        });

        const data = await response.json();
        const profileText = data.choices?.[0]?.message?.content || "Perfil Arrojado: Focado em crescimento com mix de cripto e ações sólidas.";

        return NextResponse.json({ profile: profileText });
    } catch (error) {
        console.error("Erro no Grok:", error);
        return NextResponse.json({ error: "Falha ao gerar perfil" }, { status: 500 });
    }
}
