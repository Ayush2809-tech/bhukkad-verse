"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface CravingItem {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  query: string;
  bgGradient: string;
  badgeColor: string;
}

const CRAVING_ITEMS: CravingItem[] = [
  {
    id: "biryani",
    name: "Dum Biryani",
    emoji: "🍲",
    tagline: "Slow-cooked dum, rich spices & saffron aroma",
    query: "biryani",
    bgGradient: "from-amber-50 to-orange-100/70 hover:from-amber-100 hover:to-orange-100",
    badgeColor: "bg-amber-600 text-white",
  },
  {
    id: "pizza",
    name: "Cheesy Pizzas",
    emoji: "🍕",
    tagline: "Hand-tossed crusts with mozzarella & herbs",
    query: "pizza",
    bgGradient: "from-orange-50 to-red-100/70 hover:from-orange-100 hover:to-red-100",
    badgeColor: "bg-brand-tomato text-white",
  },
  {
    id: "burger",
    name: "Crispy Burgers",
    emoji: "🍔",
    tagline: "Juicy patties, grilled brioche & peri-peri fries",
    query: "burger",
    bgGradient: "from-yellow-50 to-amber-100/70 hover:from-yellow-100 hover:to-amber-100",
    badgeColor: "bg-amber-700 text-white",
  },
  {
    id: "roll",
    name: "Kathi Rolls",
    emoji: "🌯",
    tagline: "Flaky parathas packed with smoky tandoori fillings",
    query: "roll",
    bgGradient: "from-emerald-50 to-teal-100/70 hover:from-emerald-100 hover:to-teal-100",
    badgeColor: "bg-emerald-700 text-white",
  },
  {
    id: "pasta",
    name: "Pastas & Noodles",
    emoji: "🍝",
    tagline: "Creamy white Alfredo, spicy red sauce & wok tossed",
    query: "pasta",
    bgGradient: "from-orange-50 to-yellow-100/70 hover:from-orange-100 hover:to-yellow-100",
    badgeColor: "bg-orange-600 text-white",
  },
  {
    id: "shake",
    name: "Thick Shakes",
    emoji: "🥤",
    tagline: "Rich Belgian chocolate & chilled thick blends",
    query: "shake",
    bgGradient: "from-purple-50 to-pink-100/70 hover:from-purple-100 hover:to-pink-100",
    badgeColor: "bg-purple-700 text-white",
  },
  {
    id: "momo",
    name: "Steamed Momos",
    emoji: "🥟",
    tagline: "Hot dumplings with spicy street red chutney",
    query: "momo",
    bgGradient: "from-rose-50 to-red-100/70 hover:from-rose-100 hover:to-red-100",
    badgeColor: "bg-rose-600 text-white",
  },
  {
    id: "dessert",
    name: "Sweet Cravings",
    emoji: "🍰",
    tagline: "Decadent brownies, hot fudge & sweet treats",
    query: "dessert",
    bgGradient: "from-pink-50 to-amber-100/70 hover:from-pink-100 hover:to-amber-100",
    badgeColor: "bg-pink-700 text-white",
  },
];

interface CravingsShelfSectionProps {
  activeQuery?: string;
  onSelectCraving: (query: string) => void;
  onResetCraving?: () => void;
}

export const CravingsShelfSection: React.FC<CravingsShelfSectionProps> = ({
  activeQuery = "",
  onSelectCraving,
  onResetCraving,
}) => {
  return (
    <section className="py-10 sm:py-14 bg-[#FDFBF7] border-b border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-border text-[11px] font-black text-brand-orange uppercase mb-1 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-amber fill-brand-amber" />
              <span>Explore by Craving</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-charcoal tracking-tight">
              What Are You Craving Today?
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              Tap any craving to instantly filter authentic partner menus and find your comfort food.
            </p>
          </div>

          {activeQuery && onResetCraving && (
            <button
              type="button"
              onClick={onResetCraving}
              className="text-xs font-black text-brand-tomato hover:underline self-start sm:self-auto cursor-pointer"
            >
              Clear filter ({activeQuery}) ✕
            </button>
          )}
        </div>

        {/* Visual Craving Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {CRAVING_ITEMS.map((item) => {
            const isSelected = activeQuery.toLowerCase() === item.query.toLowerCase();

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCraving(item.query)}
                className={`group p-3 sm:p-4 rounded-3xl border transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden bg-linear-to-b ${
                  item.bgGradient
                } ${
                  isSelected
                    ? "border-brand-orange ring-2 ring-brand-orange shadow-md scale-102"
                    : "border-brand-border hover:border-brand-orange/60 hover:shadow-md hover:-translate-y-0.5"
                }`}
                title={`Filter ${item.name}`}
              >
                {/* Big Emoji / Dish Icon */}
                <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-xs border border-white flex items-center justify-center text-2xl shadow-2xs group-hover:scale-110 transition-transform">
                  {item.emoji}
                </div>

                {/* Craving Label */}
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-brand-muted line-clamp-1 mt-0.5 font-medium hidden sm:block">
                    {item.tagline}
                  </p>
                </div>

                {/* Subtle Indicator */}
                <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] font-bold text-brand-charcoal/70">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Trust & Quality Bar */}
        <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-2xs flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-brand-charcoal">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-bold">
              🍳
            </span>
            <span>100% Fresh Cooked On Order</span>
          </div>

          <div className="text-zinc-300 hidden md:block">•</div>

          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-100 text-brand-amber flex items-center justify-center font-bold">
              👨‍🍳
            </span>
            <span>Independent Local Food Artisans</span>
          </div>

          <div className="text-zinc-300 hidden md:block">•</div>

          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              🛡️
            </span>
            <span>Transparent Menus &amp; Direct Pricing</span>
          </div>
        </div>
      </div>
    </section>
  );
};
