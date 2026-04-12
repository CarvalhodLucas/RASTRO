"use client";

import React from "react";
import Link from "next/link";
import { YouTube, Instagram, Music2 } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const XIcon = ({ size = 20 }: { size?: number }) => (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="currentColor"
        >
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.486 3.24H4.298l13.31 17.41z" />
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
            icon: YouTube,
            hoverColor: "hover:text-[#FF0000]",
        },
        {
            name: "Instagram",
            href: "https://www.instagram.com/rastroia",
            icon: Instagram,
            hoverColor: "hover:text-[#E4405F]",
        },
        {
            name: "TikTok",
            href: "https://www.tiktok.com/@rastroia",
            icon: Music2,
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
                            <social.icon size={20} strokeWidth={2} />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
