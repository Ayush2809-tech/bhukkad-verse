"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { BRAND_TOKENS } from "@/lib/tokens";
import { Sparkles, ArrowRight, X } from "lucide-react";

interface CinematicIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const STORAGE_KEY = "bhukkadverse_intro_completed";

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [doorsOpening, setDoorsOpening] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const handleFinish = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore sessionStorage exceptions
    }
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 450);
  }, [onComplete]);

  useEffect(() => {
    // 1. Check for reduced motion preference
    if (typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion && !forceShow) {
        if (onComplete) onComplete();
        return;
      }

      // 2. Check if already seen in current session
      const alreadySeen = sessionStorage.getItem(STORAGE_KEY);
      if (alreadySeen && !forceShow) {
        if (onComplete) onComplete();
        return;
      }

      // 3. Mount intro
      queueMicrotask(() => {
        setVisible(true);
      });

      // Sequence: Doors begin opening after 1.8s
      const timerOpen = setTimeout(() => {
        setDoorsOpening(true);
      }, 1600);

      // Sequence: Auto-finish and transition to homepage after 2.6s
      const timerClose = setTimeout(() => {
        handleFinish();
      }, 2600);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleFinish();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timerOpen);
        clearTimeout(timerClose);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [forceShow, handleFinish, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="BHUKKAD VERSE Grand Entrance"
      className={`fixed inset-0 z-50 overflow-hidden flex items-center justify-center transition-opacity duration-500 select-none ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Skip Intro Control */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-6 right-6 z-50 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wide border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-lg"
        aria-label="Skip introduction"
      >
        <span>Skip Intro</span>
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Grand Archway Doors — Left Half */}
      <div
        className={`absolute top-0 left-0 w-1/2 h-full bg-[#121212] border-r border-[#FF5722]/30 shadow-2xl transition-transform duration-1000 ease-in-out flex items-center justify-end pr-8 ${
          doorsOpening ? "-translate-x-full" : "translate-x-0"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 50%, rgba(255, 87, 34, 0.12) 0%, rgba(18, 18, 18, 0.98) 70%)",
        }}
      >
        <div className="w-1 h-32 rounded-full bg-linear-to-b from-transparent via-[#FFB703]/40 to-transparent" />
      </div>

      {/* Grand Archway Doors — Right Half */}
      <div
        className={`absolute top-0 right-0 w-1/2 h-full bg-[#121212] border-l border-[#FF5722]/30 shadow-2xl transition-transform duration-1000 ease-in-out flex items-center justify-start pl-8 ${
          doorsOpening ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 50%, rgba(255, 87, 34, 0.12) 0%, rgba(18, 18, 18, 0.98) 70%)",
        }}
      >
        <div className="w-1 h-32 rounded-full bg-linear-to-b from-transparent via-[#FFB703]/40 to-transparent" />
      </div>

      {/* Center Stage Portal Brand Crest */}
      <div
        className={`relative z-40 flex flex-col items-center text-center px-6 transition-all duration-700 ease-out ${
          doorsOpening ? "scale-110 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Glowing Crest Halo */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-linear-to-tr from-brand-orange via-brand-amber to-brand-tomato opacity-30 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-linear-to-br from-brand-amber via-brand-orange to-brand-tomato shadow-2xl overflow-hidden border border-white/20">
            <div className="w-full h-full bg-[#1A1A1A] rounded-2xl flex items-center justify-center p-3 relative overflow-hidden">
              <Image
                src={BRAND_TOKENS.assets.logoMark}
                alt="BHUKKAD VERSE Crest"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </div>
        </div>

        {/* Brand Reveal Typography */}
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/20 border border-brand-orange/30 text-[11px] font-black uppercase tracking-widest text-brand-amber">
            <Sparkles className="w-3 h-3 text-brand-amber fill-brand-amber" />
            <span>Welcome To The Food Universe</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            BHUKKAD{" "}
            <span className="bg-linear-to-r from-brand-amber via-brand-orange to-brand-tomato bg-clip-text text-transparent">
              VERSE
            </span>
          </h1>

          <p className="text-xs sm:text-sm tracking-[0.25em] font-extrabold uppercase text-[#FDFBF7]/80 pt-1">
            YOUR CRAVINGS. YOUR UNIVERSE.
          </p>
        </div>

        {/* Enter CTA button */}
        <button
          type="button"
          onClick={handleFinish}
          className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-brand-orange to-brand-tomato text-white text-xs font-black tracking-wider uppercase shadow-xl hover:shadow-brand-orange/40 transition-all hover:scale-105 active:scale-95"
        >
          <span>Step Inside</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

