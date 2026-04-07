import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const target = searchParams.get("target");

        if (!target) {
            return NextResponse.json({ error: "Parâmetro 'target' não especificado. Use 'news' ou 'price'." }, { status: 400 });
        }

        // --- LÓGICA DE NOTÍCIAS (GNEWS) ---
        if (target === "news") {
            const query = searchParams.get("q");
            if (!query) {
                return NextResponse.json({ error: "Parâmetro de busca 'q' não especificado para notícias." }, { status: 400 });
            }

            const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
            if (!apiKey) {
                return NextResponse.json({ error: "Chave da API de Notícias não configurada." }, { status: 500 });
            }

            const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=pt&country=br&max=10&apikey=${apiKey}`;
            
            console.log("🌐 Proxying News Request for:", query);
            const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache de 1 hora no servidor Next.js
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return NextResponse.json({ error: "Erro na API de Notícias", details: errorData }, { status: response.status });
            }

            const data = await response.json();
            return NextResponse.json(data);
        }

        // --- LÓGICA DE PREÇOS (COINGECKO) ---
        if (target === "price") {
            const endpoint = searchParams.get("endpoint") || "simple/price";
            const cgParams = new URLSearchParams(searchParams);
            cgParams.delete("target");
            cgParams.delete("endpoint");

            const apiKey = process.env.NEXT_PUBLIC_COINGECKO_KEY;
            const baseUrl = `https://api.coingecko.com/api/v3/${endpoint}`;
            const url = `${baseUrl}?${cgParams.toString()}`;

            console.log("🪙 Proxying CoinGecko Request:", url);
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                    ...(apiKey ? { "x-cg-demo-api-key": apiKey } : {})
                },
                next: { revalidate: endpoint.includes("global") ? 3600 : 60 } // Cache mais longo (1h) para dados globais
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return NextResponse.json({ error: "Erro na API do CoinGecko", details: errorData }, { status: response.status });
            }

            const data = await response.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: `Target '${target}' não suportado.` }, { status: 400 });

    } catch (error: any) {
        console.error("❌ Erro no Proxy Route Handler:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
