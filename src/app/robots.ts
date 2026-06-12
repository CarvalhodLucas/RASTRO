import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/perfil/"],
        },
        sitemap: "https://rastro.alterminal.com.br/sitemap.xml",
    };
}
