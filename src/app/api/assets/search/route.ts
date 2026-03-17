import { NextResponse } from "next/server";
import { assetsDatabase } from "@/lib/data";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase();

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    const filteredResults = assetsDatabase
        .filter(asset =>
            asset.ticker.toLowerCase().includes(query) ||
            asset.name.toLowerCase().includes(query)
        )
        .slice(0, 10) // Limit to 10 results for performance
        .map(asset => {
            let type = "Ação/FII";
            if (asset.exchange === "Crypto" || asset.cgId) type = "Cripto";
            else if (asset.exchange === "NASDAQ" || asset.exchange === "NYSE") type = "EUA";

            return {
                ticker: asset.ticker,
                name: asset.name,
                type: type
            };
        });

    return NextResponse.json(filteredResults);
}
