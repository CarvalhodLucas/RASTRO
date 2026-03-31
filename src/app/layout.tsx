import type { Metadata } from "next";
import "./globals.css";
import SupportChat from "@/components/SupportChat";
import AuthModal from "@/components/AuthModal";
import Providers from "@/components/Providers";
import LogoutModal from "@/components/LogoutModal";

export const metadata: Metadata = {
    title: "Rastro - Análise de Ativos",
    description: "Plataforma de análise com IA",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-br" className="dark">
            <head>
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
            <body suppressHydrationWarning className="antialiased">
                <Providers>
                    {children}
                    <SupportChat />
                    <AuthModal />
                    <LogoutModal />
                </Providers>
            </body>
        </html>
    );
}