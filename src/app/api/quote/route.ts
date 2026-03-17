import { NextResponse } from "next/server";
import yahooFinance from 'yahoo-finance2';

// Isso diz ao Next.js para manter os dados em cache por 24 horas (86.400 segundos)
export const revalidate = 86400;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let ticker = searchParams.get("ticker");

        // Se chegar sem ticker, mostramos na tela
        if (!ticker) throw new Error("Ticker não foi enviado na URL");

        console.log("🔍 Buscando no Yahoo:", ticker);

        // Inicialização que comprovadamente funcionou para si antes
        const yf = typeof yahooFinance === 'function'
            ? new (yahooFinance as any)()
            : (yahooFinance as any).default || yahooFinance;

        // 1. Busca do Preço e Fundamentos Básicos (Isto nunca falha se a ação existir)
        const quote: any = await yf.quote(ticker);

        // 2. Busca dos Fundamentos Detalhados
        let summary: any = {};
        try {
            summary = await yf.quoteSummary(ticker, {
                modules: ["defaultKeyStatistics", "summaryDetail", "financialData"]
            });
        } catch (summaryError: any) {
            console.log("⚠️ Aviso nos fundamentos (A usar fallbacks do quote):", summaryError.message);
        }

        // --- A MÁGICA: FALLBACKS E ENGENHARIA REVERSA ---
        // Se o summary estiver vazio, extraímos do quote que trouxemos no Passo 1!

        const lpa = summary?.defaultKeyStatistics?.trailingEps || quote?.epsTrailingTwelveMonths || quote?.epsCurrentYear || 0;
        const vpa = summary?.defaultKeyStatistics?.bookValue || quote?.bookValue || 0;

        const dyRaw = summary?.summaryDetail?.dividendYield || summary?.summaryDetail?.trailingAnnualDividendYield || quote?.trailingAnnualDividendYield || quote?.dividendYield || 0;
        const dy = dyRaw * 100;

        const p_l = summary?.summaryDetail?.trailingPE || quote?.trailingPE || summary?.summaryDetail?.forwardPE || quote?.forwardPE || 0;

        // Se o ROE não vier do Yahoo, nós mesmos somos o contabilista e calculamos: (LPA / VPA) * 100
        let roeRaw = summary?.financialData?.returnOnEquity || 0;
        let roe = roeRaw * 100;
        if (roe === 0 && lpa !== 0 && vpa !== 0) {
            roe = (lpa / vpa) * 100;
        }

        // --- P/VP (Price-to-Book) DIRETO ---
        // Múltiplas fontes: quote tem priceToBook, summary tem priceToBook dentro de defaultKeyStatistics
        const priceToBook = summary?.defaultKeyStatistics?.priceToBook || quote?.priceToBook || 0;

        // Se der tudo certo, manda os dados normais
        const rawMarketCap = quote?.marketCap || 0;
        let formattedMarketCap = "--";
        if (rawMarketCap >= 1e12) formattedMarketCap = `${(rawMarketCap / 1e12).toFixed(1)}T`;
        else if (rawMarketCap >= 1e9) formattedMarketCap = `${(rawMarketCap / 1e9).toFixed(0)}B`;
        else if (rawMarketCap >= 1e6) formattedMarketCap = `${(rawMarketCap / 1e6).toFixed(0)}M`;

        return NextResponse.json({
            price: quote?.regularMarketPrice || quote?.price || 0,
            name: quote?.longName || quote?.shortName || ticker,
            currency: quote?.currency || "BRL",
            variation: quote?.regularMarketChangePercent?.toFixed(2) || "0.00",
            exchange: quote?.fullExchangeName || "",
            marketCap: formattedMarketCap,

            // Variáveis calculadas à prova de falhas
            lpa: lpa,
            vpa: vpa,
            dy: dy,
            p_l: p_l,
            roe: roe,
            priceToBook: priceToBook,
            avgVolume: summary?.summaryDetail?.averageDailyVolume10Day || quote?.averageDailyVolume10Day || 0,
            totalAssets: summary?.summaryDetail?.totalAssets || 0,

            // Objetos brutos para fallback
            defaultKeyStatistics: summary?.defaultKeyStatistics || {},
            summaryDetail: summary?.summaryDetail || {},
            financialData: summary?.financialData || {},
        });

    } catch (error: any) {
        console.error("❌ ERRO ESCONDIDO DO YAHOO:", error.message);

        return NextResponse.json({
            price: 0.01,
            name: "🚨 ERRO: " + error.message,
            currency: "BRL",
            lpa: 0,
            vpa: 0,
            dy: 0,
            p_l: 0,
            roe: 0,
        });
    }
}