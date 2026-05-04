import type { Metadata } from "next";
import "./globals.css";
import SupportChat from "@/components/SupportChat";
import AuthModal from "@/components/AuthModal";
import Providers from "@/components/Providers";
import LogoutModal from "@/components/LogoutModal";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import Analytics from "@/components/Analytics";


export const metadata: Metadata = {
    title: "RASTRO | Inteligência de Mercado e Análise de Ativos com IA",
    description: "Acompanhe B3, S&P 500 e Cripto em tempo real. Insights profundos com IA, mapas de calor e análise de sentimento. O pulso do mercado na sua mão.",
    keywords: ["investimentos", "análise de ativos", "inteligência artificial", "B3", "S&P 500", "criptomoedas", "market intelligence", "rastro ia"],
    authors: [{ name: "RASTRO Team" }],
    metadataBase: new URL("https://www.rastroia.com"),
    openGraph: {
        title: "RASTRO | Inteligência de Mercado e Análise de Ativos com IA",
        description: "Acompanhe o pulso do mercado em tempo real com análises profundas de IA.",
        url: "https://www.rastroia.com",
        siteName: "RASTRO",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "RASTRO - Inteligência de Mercado",
            },
        ],
        locale: "pt_BR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "RASTRO | Inteligência de Mercado com IA",
        description: "Monitoramento de B3, S&P 500 e Cripto com insights de IA.",
        images: ["/og-image.png"],
    },
    icons: {
        icon: "/icon.svg",
        apple: "/og-image.png", // Usando a mesma imagem como ícone Apple por enquanto
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-br" className="dark">
            <head>
                <meta charSet="utf-8" />
                {/* Fontes usadas pelo Tailwind Theme */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

                {/* Link para os ícones funcionarem */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
                />
            </head>
            <body suppressHydrationWarning className="antialiased min-h-screen flex flex-col">
                <Providers>
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                    <SupportChat />
                    <AuthModal />
                    <LogoutModal />
                    <CookieBanner />
                    <Analytics />
                </Providers>
            </body>
        </html>
    );
}