import { MetadataRoute } from "next";
import { assetsDatabase } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://rastro.alterminal.com.br";

    // Rotas estáticas centrais
    const staticRoutes = [
        "",
        "/sobre",
        "/mercado",
        "/portfolio",
        "/noticias",
        "/square",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1.0 : 0.8,
    }));

    // Rotas dinâmicas de ativos baseadas no assetsDatabase
    const assetRoutes = assetsDatabase.map((asset) => {
        const tickerLower = asset.ticker.toLowerCase();
        return {
            url: `${baseUrl}/asset/${tickerLower}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.6,
        };
    });

    return [...staticRoutes, ...assetRoutes];
}
