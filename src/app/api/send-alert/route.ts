import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { ticker, price, email, method } = await req.json();

        console.log(`Simulando envio de ${method} para ${email}: ${ticker} a R$ ${price}`);

        // Aqui você conectaria com um serviço como Resend ou Telegram Bot API
        // Exemplo: resend.emails.send({ from: 'alerta@seusite.com', to: email, ... });

        return NextResponse.json({ success: true, message: `Alerta ${method} enviado com sucesso.` });
    } catch (error) {
        console.error("Erro na rota de alerta:", error);
        return NextResponse.json({ success: false, error: "Falha ao processar alerta" }, { status: 500 });
    }
}
