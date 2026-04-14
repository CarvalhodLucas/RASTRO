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
    title: "Rastro - Análise de Ativos",
    description: "Plataforma de análise com IA",
    icons: {
        icon: "/icon.svg",
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