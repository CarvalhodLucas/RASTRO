import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const endpoint = searchParams.get("endpoint");
        
        if (!endpoint) {
            return NextResponse.json({ error: "Endpoint não especificado" }, { status: 400 });
        }

        // Remove endpoint do searchParams para passar o resto para a CG
        const cgParams = new URLSearchParams(searchParams);
        cgParams.delete("endpoint");

        const envKey = process.env.NEXT_PUBLIC_COINGECKO_KEY || "";
        const apiKey = envKey.length > 10 ? envKey : "CG-zP8Aj26U7MQeBXvYLryTkaNy";
        const baseUrl = "https://api.coingecko.com/api/v3";
        
        const url = `${baseUrl}/${endpoint}?${cgParams.toString()}`;
        console.log("🌐 Proxying to CoinGecko:", url);

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                ...(apiKey ? { "x-cg-demo-api-key": apiKey } : {})
            },
            next: { revalidate: 60 } // Cache opcional de 1 minuto
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Erro na API do CoinGecko", details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("❌ Erro no Proxy CoinGecko:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
