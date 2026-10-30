import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_TOKENS } from "@/lib/tokens";

interface BrandLogoProps {
  variant?: "full" | "header" | "mark" | "minimal" | "badge";
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  lightMode?: boolean;
  customLogoSrc?: string | null;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "header",
  className = "",
  href = "/",
  size = "md",
  lightMode = false,
  customLogoSrc = null,
}) => {
  const markSrc = customLogoSrc || BRAND_TOKENS.assets.logoMark;
  const primarySrc = customLogoSrc || BRAND_TOKENS.assets.logoPrimary;

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 1. Mascot Icon Mark */}
      {variant === "mark" && (
        <div
          className={`relative shrink-0 rounded-2xl overflow-hidden shadow-md border border-amber-200/60 bg-[#FCF1E0] transition-transform duration-300 hover:scale-105 ${
            size === "sm"
              ? "w-8 h-8"
              : size === "lg"
              ? "w-14 h-14"
              : size === "xl"
              ? "w-20 h-20"
              : "w-10 h-10"
          }`}
        >
          <img
            src={markSrc}
            alt="BHUKKAD VERSE Chef Mark"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 2. Primary Header Logo (Chef Mascot + 3D Lettering + Tagline) */}
      {variant === "header" && (
        <div className="flex items-center gap-3">
          <div
            className={`relative shrink-0 rounded-2xl overflow-hidden shadow-md border border-amber-200/70 bg-[#FCF1E0] transition-transform duration-300 hover:scale-105 hover:rotate-2 ${
              size === "sm" ? "w-9 h-9" : size === "lg" ? "w-14 h-14" : size === "xl" ? "w-16 h-16" : "w-11 h-11"
            }`}
          >
            <img
              src={markSrc}
              alt="BHUKKAD VERSE Chef Mascot"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none font-black tracking-tight">
              <span
                className={`font-extrabold tracking-wider ${
                  lightMode ? "text-white" : "text-brand-charcoal"
                } ${size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg sm:text-xl"}`}
              >
                BHUKKAD
              </span>
              <span
                className={`font-extrabold tracking-wider bg-gradient-to-r from-brand-amber via-brand-orange to-brand-tomato bg-clip-text text-transparent ${
                  size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg sm:text-xl"
                }`}
              >
                VERSE
              </span>
            </div>
            <span
              className={`tracking-widest font-black uppercase mt-1 ${
                lightMode ? "text-zinc-400" : "text-brand-muted"
              } ${size === "sm" ? "text-[8px]" : size === "lg" ? "text-[10px]" : "text-[9px]"}`}
            >
              YOUR CRAVINGS. YOUR UNIVERSE.
            </span>
          </div>
        </div>
      )}

      {/* 3. Full Complete 3D Official Artwork (Mascot + 3D Text + Swirls) */}
      {variant === "full" && (
        <div
          className={`relative rounded-3xl overflow-hidden shadow-xl border border-amber-200/60 bg-[#FCF1E0] transition-transform duration-300 hover:scale-[1.02] ${
            size === "sm"
              ? "w-28 h-28"
              : size === "lg"
              ? "w-60 h-60"
              : size === "xl"
              ? "w-80 h-80"
              : "w-44 h-44"
          }`}
        >
          <img
            src={primarySrc}
            alt="BHUKKAD VERSE — YOUR CRAVINGS. YOUR UNIVERSE."
            className="w-full h-full object-contain p-1.5"
          />
        </div>
      )}

      {/* 4. Luxury 3D Emblem Badge with Glowing Aura */}
      {variant === "badge" && (
        <div
          className={`relative rounded-3xl p-1 bg-gradient-to-tr from-brand-amber via-brand-orange to-brand-tomato shadow-2xl border border-white/30 overflow-hidden ${
            size === "sm"
              ? "w-24 h-24"
              : size === "lg"
              ? "w-52 h-52"
              : size === "xl"
              ? "w-72 h-72"
              : "w-36 h-36"
          }`}
        >
          <div className="w-full h-full bg-[#FCF1E0] rounded-[22px] flex items-center justify-center relative overflow-hidden shadow-inner">
            <Image
              src={BRAND_TOKENS.assets.logoPrimary}
              alt="BHUKKAD VERSE Master Crest"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
        </div>
      )}

      {/* 5. Minimal Compact Logo */}
      {variant === "minimal" && (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 relative rounded-xl overflow-hidden shadow-xs border border-white/20 bg-[#FCF1E0]">
            <Image
              src={BRAND_TOKENS.assets.logoMark}
              alt="BHUKKAD VERSE"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-extrabold tracking-tight text-white text-base">
            BHUKKAD <span className="text-brand-orange">VERSE</span>
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-2xl"
      >
        {content}
      </Link>
    );
  }

  return content;
};
