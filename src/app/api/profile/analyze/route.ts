import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { portfolio } = await req.json();
        const userPortfolio = portfolio || "Nenhum ativo selecionado"; 

        const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || "";
        const isGroq = apiKey.startsWith("gsk_");
        const endpoint = isGroq ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.x.ai/v1/chat/completions";
        const modelName = isGroq ? "llama-3.3-70b-versatile" : "grok-beta";

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
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
