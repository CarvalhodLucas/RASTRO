import { assetsDatabase } from "@/lib/data";
import AssetClientPage from "./AssetClientPage";
import SEO from "@/components/SEO";
import { Metadata } from "next";

// No Next.js 15, params e searchParams são Promises
interface RouteParams {
    params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();
    const cleanTicker = upperTicker.replace('.SA', '');

    // Busca o ativo no banco local para fornecer metadados corretos no SSR
    const asset = assetsDatabase.find(a => 
        a.ticker.toUpperCase().replace('.SA', '') === cleanTicker
    );

    const title = asset 
        ? `${asset.ticker.replace('.SA', '')} - ${asset.name} | Análise de Ativo | RASTRO` 
        : `${upperTicker} | Cotação e Inteligência Artificial | RASTRO`;

    const description = asset
        ? `Análise completa do ativo ${asset.name} (${asset.ticker.replace('.SA', '')}). Veja cotação em tempo real, valuation (Graham, Bazin), sentimento por IA e tese de investimento.`
        : `Terminal financeiro RASTRO: acompanhe gráficos, cotações e inteligência de mercado para o ativo ${upperTicker}.`;

    const canonicalUrl = `https://rastro.alterminal.com.br/asset/${ticker.toLowerCase()}`;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: "website",
        }
    };
}

export default async function Page({ params }: RouteParams) {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();
    const cleanTicker = upperTicker.replace('.SA', '');

    const initialAsset = assetsDatabase.find(a => 
        a.ticker.toUpperCase().replace('.SA', '') === cleanTicker
    ) || null;

    return (
        <>
            {initialAsset && (
                <SEO 
                    canonicalPath={`/asset/${ticker.toLowerCase()}`}
                    schemaMarkup={{
                        "@context": "https://schema.org",
                        "@type": ["FinancialProduct", "InvestmentOrDepositOrService"],
                        "name": initialAsset.name,
                        "tickerSymbol": initialAsset.ticker.replace('.SA', ''),
                        "description": initialAsset.fullReport || `Análise de investimentos e valuation de ${initialAsset.name} (${initialAsset.ticker}).`,
                        "provider": {
                            "@type": "Organization",
                            "name": "RASTRO",
                            "url": "https://rastro.alterminal.com.br"
                        }
                    }}
                />
            )}
            <AssetClientPage ticker={ticker} initialAsset={initialAsset} />
        </>
    );
}
