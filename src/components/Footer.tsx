"use client";

import React from "react";
import Link from "next/link";
import { Twitter, Youtube, Instagram, Music2 } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        {
            name: "Twitter",
            href: "https://twitter.com",
            icon: Twitter,
            hoverColor: "hover:text-[#1DA1F2]",
        },
        {
            name: "YouTube",
            href: "https://youtube.com",
            icon: Youtube,
            hoverColor: "hover:text-[#FF0000]",
        },
        {
            name: "Instagram",
            href: "https://instagram.com",
            icon: Instagram,
            hoverColor: "hover:text-[#E4405F]",
        },
        {
            name: "TikTok",
            href: "https://tiktok.com",
            icon: Music2, // Lucide doesn't have a direct TikTok icon in all versions, Music2 is a good fallback or we use a custom SVG
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
