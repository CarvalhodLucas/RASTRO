import { NextResponse } from "next/server";
import yahooFinance from 'yahoo-finance2';

// Isso diz ao Next.js para manter os dados em cache por 24 horas (86.400 segundos)
export const revalidate = 86400;

// Simple in-memory cache for Yahoo Finance API responses
interface CacheEntry {
    data: any;
    timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes of cache for successful requests
const ERROR_CACHE_TTL_MS = 10 * 1000; // 10 seconds of cache for errors to avoid hammering in loop

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tickerParam = searchParams.get("ticker");
        const mode = searchParams.get("mode"); // "compact" or "full"

        if (!tickerParam) throw new Error("Ticker não foi enviado na URL");

        // Inicialização do Yahoo Finance
        const yf = typeof yahooFinance === 'function'
            ? new (yahooFinance as any)()
            : (yahooFinance as any).default || yahooFinance;

        const tickers = tickerParam.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
        const isBatch = tickers.length > 1;

        const formatCap = (rawMarketCap: number) => {
            if (!rawMarketCap) return "--";
            if (rawMarketCap >= 1e12) return `${(rawMarketCap / 1e12).toFixed(1)}T`;
            if (rawMarketCap >= 1e9) return `${(rawMarketCap / 1e9).toFixed(0)}B`;
            if (rawMarketCap >= 1e6) return `${(rawMarketCap / 1e6).toFixed(0)}M`;
            return "--";
        };

        // Função interna para processar um único ticker
        const processTicker = async (symbol: string) => {
            const cacheKey = `${symbol}_${mode || 'full'}`;
            const cached = memoryCache.get(cacheKey);
            const isError = cached?.data && 'error' in cached.data;
            const ttl = isError ? ERROR_CACHE_TTL_MS : CACHE_TTL_MS;
            
            if (cached && Date.now() - cached.timestamp < ttl) {
                return cached.data;
            }

            try {
                // 1. Busca do Preço e Fundamentos Básicos
                const quote: any = await yf.quote(symbol);

                if (mode === 'compact') {
                    const resCompact = {
                        symbol,
                        price: quote?.regularMarketPrice || quote?.price || 0,
                        name: quote?.longName || quote?.shortName || symbol,
                        variation: quote?.regularMarketChangePercent?.toFixed(2) || "0.00",
                        marketCap: quote?.marketCap ? formatCap(quote.marketCap) : "--",
                        currency: quote?.currency || "BRL",
                    };
                    memoryCache.set(cacheKey, { data: resCompact, timestamp: Date.now() });
                    return resCompact;
                }

                // 2. Busca dos Fundamentos Detalhados
                let summary: any = {};
                try {
                    summary = await yf.quoteSummary(symbol, {
                        modules: ["defaultKeyStatistics", "summaryDetail", "financialData"]
                    });
                } catch (summaryError: any) {
                    console.log(`⚠️ Aviso nos fundamentos para ${symbol}:`, summaryError.message);
                }

                const lpa = summary?.defaultKeyStatistics?.trailingEps || quote?.epsTrailingTwelveMonths || quote?.epsCurrentYear || 0;
                let vpa = summary?.defaultKeyStatistics?.bookValue || quote?.bookValue || 0;
                const dyRaw = summary?.summaryDetail?.dividendYield || summary?.summaryDetail?.trailingAnnualDividendYield || quote?.trailingAnnualDividendYield || quote?.dividendYield || 0;
                const dy = dyRaw * 100;
                const p_l = summary?.summaryDetail?.trailingPE || quote?.trailingPE || summary?.summaryDetail?.forwardPE || quote?.forwardPE || 0;
                const priceToBook = summary?.defaultKeyStatistics?.priceToBook || quote?.priceToBook || 0;

                const priceValue = quote?.regularMarketPrice || quote?.price || 0;
                if (vpa === 0 && priceToBook > 0 && priceValue > 0) {
                    vpa = priceValue / priceToBook;
                }

                let roeRaw = summary?.financialData?.returnOnEquity || 0;
                let roe = roeRaw * 100;
                if (roe === 0 && lpa !== 0 && vpa !== 0) roe = (lpa / vpa) * 100;

                const resFull = {
                    price: quote?.regularMarketPrice || quote?.price || 0,
                    name: quote?.longName || quote?.shortName || symbol,
                    currency: quote?.currency || "BRL",
                    variation: quote?.regularMarketChangePercent?.toFixed(2) || "0.00",
                    exchange: quote?.fullExchangeName || "",
                    marketCap: formatCap(quote?.marketCap || 0),
                    lpa, vpa, dy, p_l, roe, priceToBook,
                    avgVolume: summary?.summaryDetail?.averageDailyVolume10Day || quote?.averageDailyVolume10Day || 0,
                    totalAssets: summary?.summaryDetail?.totalAssets || 0,
                    defaultKeyStatistics: summary?.defaultKeyStatistics || {},
                    summaryDetail: summary?.summaryDetail || {},
                    financialData: summary?.financialData || {},
                };
                memoryCache.set(cacheKey, { data: resFull, timestamp: Date.now() });
                return resFull;
            } catch (err: any) {
                console.error(`❌ Erro no ticker ${symbol}:`, err.message);
                const resError = { symbol, error: err.message, price: 0.01 };
                memoryCache.set(cacheKey, { data: resError, timestamp: Date.now() });
                return resError;
            }
        };

        if (isBatch) {
            const results = await Promise.all(tickers.map(processTicker));
            return NextResponse.json(results);
        } else {
            const result = await processTicker(tickers[0]);
            return NextResponse.json(result);
        }

    } catch (error: any) {
        console.error("❌ ERRO NO API QUOTE:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}