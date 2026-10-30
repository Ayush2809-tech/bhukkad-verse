"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BRAND_TOKENS } from "@/lib/tokens";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import {
  Search,
  ArrowRight,
  Sparkles,
  Flame,
  Utensils,
  Clock,
  ShieldCheck,
  UtensilsCrossed,
  Store,
} from "lucide-react";

interface HeroSectionProps {
  onSearchSubmit?: (query: string, mode?: "dish" | "shop") => void;
  onCategorySelect?: (query: string) => void;
}

interface HeroCMSData {
  hero_headline_primary: string;
  hero_headline_highlight: string;
  hero_subtitle: string;
  hero_badge_left: string;
  hero_badge_right: string;
  hero_mascot_badge_1: string;
  hero_mascot_badge_2: string;
  hero_mascot_badge_bottom: string;
  effective_hero_mascot_image_url: string;
}

const DEFAULT_HERO_CMS: HeroCMSData = {
  hero_headline_primary: "YOUR CRAVINGS.",
  hero_headline_highlight: "YOUR UNIVERSE.",
  hero_subtitle:
    "Order directly from verified neighborhood cloud kitchens, artisanal eateries, and local culinary masters. Freshly cooked, customized to your taste, delivered hot.",
  hero_badge_left: "Verified Local Kitchens",
  hero_badge_right: "Hot & Fresh Direct Delivery",
  hero_mascot_badge_1: "Artisan Kitchens",
  hero_mascot_badge_2: "Made to Order",
  hero_mascot_badge_bottom: "Crafted Fresh • Artisanal Flavors",
  effective_hero_mascot_image_url: "/brand/mascot-hero.png",
};

const POPULAR_CRAVINGS = [
  { label: "Dum Biryani", emoji: "🍲", query: "biryani" },
  { label: "Veg Pizzas", emoji: "🍕", query: "pizza" },
  { label: "Burgers", emoji: "🍔", query: "burger" },
  { label: "Kathi Rolls", emoji: "🌯", query: "roll" },
  { label: "Thick Shakes", emoji: "🥤", query: "shake" },
  { label: "Steamed Momos", emoji: "🥟", query: "momo" },
  { label: "Desserts", emoji: "🍰", query: "dessert" },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchSubmit,
  onCategorySelect,
}) => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchMode, setSearchMode] = useState<"dish" | "shop">("dish");
  const [heroCms, setHeroCms] = useState<HeroCMSData>(DEFAULT_HERO_CMS);

  // Fetch dynamic Hero CMS content managed by Admin
  useEffect(() => {
    const fetchHeroCms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/core/settings/`);
        if (res.ok) {
          const data = await res.json();
          setHeroCms({
            hero_headline_primary: data.hero_headline_primary || DEFAULT_HERO_CMS.hero_headline_primary,
            hero_headline_highlight: data.hero_headline_highlight || DEFAULT_HERO_CMS.hero_headline_highlight,
            hero_subtitle: data.hero_subtitle || DEFAULT_HERO_CMS.hero_subtitle,
            hero_badge_left: data.hero_badge_left || DEFAULT_HERO_CMS.hero_badge_left,
            hero_badge_right: data.hero_badge_right || DEFAULT_HERO_CMS.hero_badge_right,
            hero_mascot_badge_1: data.hero_mascot_badge_1 || DEFAULT_HERO_CMS.hero_mascot_badge_1,
            hero_mascot_badge_2: data.hero_mascot_badge_2 || DEFAULT_HERO_CMS.hero_mascot_badge_2,
            hero_mascot_badge_bottom: data.hero_mascot_badge_bottom || DEFAULT_HERO_CMS.hero_mascot_badge_bottom,
            effective_hero_mascot_image_url:
              data.effective_hero_mascot_image_url ||
              data.hero_mascot_image_url ||
              DEFAULT_HERO_CMS.effective_hero_mascot_image_url,
          });
        }
      } catch {
        // Fallback to default branding
      }
    };
    fetchHeroCms();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (onSearchSubmit) {
      onSearchSubmit(query, searchMode);
    } else if (query) {
      router.push(`/shops?q=${encodeURIComponent(query)}&type=${searchMode}`);
    } else {
      router.push(`/shops?type=${searchMode}`);
    }
  };

  const handleCravingClick = (query: string) => {
    setSearchMode("dish");
    setSearchInput(query);
    if (onCategorySelect) {
      onCategorySelect(query);
    } else {
      router.push(`/shops?q=${encodeURIComponent(query)}&type=dish`);
    }
  };

  const resolvedMascotSrc = getMediaUrl(heroCms.effective_hero_mascot_image_url) || BRAND_TOKENS.assets.mascotHero;

  return (
    <section className="relative overflow-hidden pt-6 pb-12 lg:pt-12 lg:pb-16 bg-linear-to-b from-[#F7F3EA] via-[#FDFBF7] to-[#FDFBF7] border-b border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Food Search */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Badge: Verified Kitchens */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-border shadow-2xs text-xs font-bold text-brand-charcoal">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
              <span className="text-brand-tomato font-black">{heroCms.hero_badge_left}</span>
              <span className="text-zinc-300">•</span>
              <span className="text-brand-charcoal font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-brand-orange fill-brand-orange" />
                <span>{heroCms.hero_badge_right}</span>
              </span>
            </div>

            {/* Main Brand Title & Tagline (Admin Configurable) */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-brand-charcoal leading-[1.04]">
                {heroCms.hero_headline_primary} <br />
                <span className="bg-linear-to-r from-brand-amber via-brand-orange to-brand-tomato bg-clip-text text-transparent">
                  {heroCms.hero_headline_highlight}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-brand-muted max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                {heroCms.hero_subtitle}
              </p>
            </div>

            {/* Prominent Food Discovery Search Box */}
            <div className="max-w-xl mx-auto lg:mx-0 pt-1">
              {/* Search Mode Toggle Tabs */}
              <div className="flex items-center gap-2 mb-2.5 justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => setSearchMode("dish")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    searchMode === "dish"
                      ? "bg-brand-charcoal text-white shadow-xs"
                      : "bg-white/80 border border-brand-border text-brand-charcoal hover:border-brand-orange hover:bg-white"
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Search Dishes</span>

                </button>

                <button
                  type="button"
                  onClick={() => setSearchMode("shop")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    searchMode === "shop"
                      ? "bg-brand-charcoal text-white shadow-xs"
                      : "bg-white/80 border border-brand-border text-brand-charcoal hover:border-brand-orange hover:bg-white"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Search Kitchens</span>
                </button>
              </div>

              {/* Direct Search Bar */}
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl sm:rounded-full border border-brand-border shadow-xs focus-within:ring-2 focus-within:ring-brand-orange/30 focus-within:border-brand-orange transition-all"
              >
                <div className="flex items-center gap-3 px-4 py-2.5 flex-1">
                  <Search className="w-5 h-5 text-brand-muted shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={
                      searchMode === "dish"
                        ? "Search dishes, e.g. Burger, Paneer Pizza, Pasta, Momos"
                        : "Search kitchens, e.g. Royal Saffron, Chandu Chaat"
                    }
                    className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-none text-brand-charcoal placeholder:text-brand-muted/70 font-medium"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        if (onSearchSubmit) onSearchSubmit("", searchMode);
                      }}
                      className="text-xs text-brand-muted hover:text-brand-charcoal px-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl sm:rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs sm:text-sm font-black tracking-wide transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
                >
                  <span>{searchMode === "dish" ? "Find Dishes" : "Find Kitchens"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Craving Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-3.5">
                <span className="text-[11px] font-bold text-zinc-500 mr-1 hidden sm:inline">
                  Craving:
                </span>
                {POPULAR_CRAVINGS.map((item) => (
                  <button
                    key={item.query}
                    type="button"
                    onClick={() => handleCravingClick(item.query)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-brand-border text-brand-charcoal hover:border-brand-orange hover:text-brand-orange hover:bg-brand-surface transition-all shadow-2xs cursor-pointer"
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-brand-border/80 max-w-xl mx-auto lg:mx-0 text-left">
              <div>
                <p className="text-xs font-black uppercase text-brand-charcoal flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-brand-tomato shrink-0" />
                  <span className="truncate">Cooked Fresh</span>
                </p>
                <p className="text-[11px] text-brand-muted mt-0.5 hidden sm:block">
                  Prepared immediately upon order.
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-brand-orange flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span className="truncate">Live Kitchen Status</span>
                </p>
                <p className="text-[11px] text-brand-muted mt-0.5 hidden sm:block">
                  Real-time operating schedule.
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Verified Radii</span>
                </p>
                <p className="text-[11px] text-brand-muted mt-0.5 hidden sm:block">
                  Proximity-based hot delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Framing (Admin Configurable Mascot & Badges) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-linear-to-tr from-brand-amber/20 via-white to-brand-tomato/15 group">
              <img
                src={resolvedMascotSrc}
                alt="BHUKKAD VERSE Chef Mascot"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/brand/mascot-hero.jpg";
                }}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              {/* Ambient Badge Top Left: Quality Food */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-sm border border-brand-border flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-amber fill-brand-amber" />
                <span className="text-xs font-black text-brand-charcoal">
                  {heroCms.hero_mascot_badge_1}
                </span>
              </div>

              {/* Ambient Badge Top Right: Fresh Prep */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-brand-border hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-charcoal">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{heroCms.hero_mascot_badge_2}</span>
              </div>

              {/* Sleek Short Floating Culinary Pill (Clean & Uncluttered) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl flex items-center gap-2 text-white whitespace-nowrap">
                <span className="text-xs">🔥</span>
                <span className="text-xs font-black tracking-wide text-brand-amber">
                  {heroCms.hero_mascot_badge_bottom}
                </span>
                <span className="text-xs">🍲</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
