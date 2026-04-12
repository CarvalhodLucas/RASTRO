"use client";
// Force Vercel build trigger - lucide-react removed

import React from "react";
import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    // Custom SVGs for social icons to ensure build stability and consistent styling
    const XIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.486 3.24H4.298l13.31 17.41z" />
        </svg>
    );

    const YoutubeIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );

    const InstagramIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );

    const TiktokIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.13 8.13 0 0 1-1.89-1.46v9.52c.04 4.03-2.12 7.15-5.91 8.01-4.14 1.08-8.52-1.12-9.72-5.11a7.64 7.64 0 0 1 2.39-8.41c1.87-1.42 4.34-1.82 6.59-1.33v4.01c-1.28-.42-2.74-.23-3.84.55-1.19.82-1.78 2.29-1.55 3.69.19 1.48 1.25 2.8 2.72 3.19 1.55.45 3.32-.23 4.16-1.59.39-.7.54-1.51.52-2.31V.02z" />
        </svg>
    );

    const socialLinks = [
        {
            name: "X (Twitter)",
            href: "https://x.com/rastroia",
            icon: XIcon,
            hoverColor: "hover:text-white",
        },
        {
            name: "YouTube",
            href: "https://www.youtube.com/@RastroIA",
            icon: YoutubeIcon,
            hoverColor: "hover:text-[#FF0000]",
        },
        {
            name: "Instagram",
            href: "https://www.instagram.com/rastroia",
            icon: InstagramIcon,
            hoverColor: "hover:text-[#E4405F]",
        },
        {
            name: "TikTok",
            href: "https://www.tiktok.com/@rastroia",
            icon: TiktokIcon,
            hoverColor: "hover:text-[#00f2ea]",
        },
    ];

    return (
        <footer className="w-full bg-zinc-950 border-t border-zinc-800/50 py-12 pb-24 md:pb-12">
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left Side: Logo & Copyright */}
                <div className="flex flex-col items-center md:items-start gap-3">
                    <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                        <div className="size-6 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined !text-[24px]">candlestick_chart</span>
                        </div>
                        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">RASTRO</h2>
                    </Link>
                    <p className="text-zinc-500 text-sm font-medium">
                        © {currentYear} Rastro. Todos os direitos reservados.
                    </p>
                </div>

                {/* Right Side: Social Media */}
                <div className="flex items-center gap-6">
                    {socialLinks.map((social) => (
                        <a
                            key={social.name}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-zinc-500 transition-all duration-300 transform hover:scale-110 ${social.hoverColor}`}
                            aria-label={social.name}
                        >
                            <social.icon size={20} />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
