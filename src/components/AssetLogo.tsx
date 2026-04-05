"use client";

import React, { useState } from "react";
import Image from "next/image";

interface AssetLogoProps {
  src?: string;
  ticker: string;
  name?: string;
  size?: number; // Tailwind class size like 16 (w-16 h-16) or 8
  className?: string;
}

export default function AssetLogo({ src, ticker, name, size = 16, className = "" }: AssetLogoProps) {
  const [imgError, setImgError] = useState(false);

  // Default size classes
  const sizeClass = `w-${size} h-${size}`;
  const fontSizeClass = size > 10 ? "text-xl" : "text-[10px]";

  if (!imgError && src) {
    return (
      <Image
        src={src}
        alt={name || ticker}
        width={size * 4} // rough estimate for pixels if using tailwind units
        height={size * 4}
        className={`rounded-full object-contain bg-white/5 ${className}`}
        style={{ width: "auto", height: "auto" }}
        onError={() => setImgError(true)}
        unoptimized
      />
    );
  }

  return (
    <div 
      className={`${sizeClass} rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 ${className}`}
      title={name || ticker}
    >
      <span className={`text-white font-bold uppercase ${fontSizeClass}`}>
        {ticker.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
}
