"use client";

import React from "react";
import { MapPin, SlidersHorizontal, Flame } from "lucide-react";

export const MarketplaceProcessSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      icon: MapPin,
      iconColor: "text-brand-tomato",
      bgColor: "bg-brand-tomato/10",
      title: "Confirm Your Location",
      desc: "Set your delivery point to discover verified neighborhood cloud kitchens and bakeries with accurate proximity calculations.",
    },
    {
      num: "02",
      icon: SlidersHorizontal,
      iconColor: "text-brand-orange",
      bgColor: "bg-brand-orange/10",
      title: "Customize Sizes & Add-ons",
      desc: "Explore honest digital menus with multi-size options (Regular, Medium, Large) and artisan toppings designed by the chef.",
    },
    {
      num: "03",
      icon: Flame,
      iconColor: "text-brand-amber",
      bgColor: "bg-brand-amber/20",
      title: "Cooked Fresh to Order",
      desc: "No factory food. Genuine culinary artisans prepare each order fresh upon receipt and hand it off within the delivery radius.",
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-brand-surface border-b border-brand-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-brand-orange">
            The Honest Food Way
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-brand-charcoal tracking-tight mt-1">
            How BHUKKAD VERSE Works
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted mt-2">
            A real multi-vendor marketplace connecting you directly with passionate food creators, cloud kitchens, and artisan bakeries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="bg-white rounded-3xl p-7 border border-brand-border/80 shadow-xs hover:border-brand-orange/40 transition-all space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${s.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${s.iconColor}`} />
                  </div>
                  <span className="text-2xl font-black text-zinc-300 font-mono">{s.num}</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-brand-charcoal">{s.title}</h3>
                  <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

