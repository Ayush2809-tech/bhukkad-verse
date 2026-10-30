"use client";

import React from "react";
import Link from "next/link";
import { Store, ArrowRight, CheckCircle } from "lucide-react";

export const PartnerCalloutBanner: React.FC = () => {
  return (
    <section className="py-14 sm:py-18 bg-brand-cream border-b border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-brand-charcoal text-white p-8 sm:p-12 border border-zinc-800 shadow-xl relative overflow-hidden">
          {/* Subtle warm glow background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-extrabold uppercase text-brand-amber">
              <Store className="w-3.5 h-3.5 text-brand-orange" />
              <span>For Independent Chefs & Kitchen Owners</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Grow Your Kitchen on <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-brand-amber via-brand-orange to-brand-tomato bg-clip-text text-transparent">
                BHUKKAD VERSE
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Take complete control of your restaurant or cloud kitchen. Manage size variants, toppings, weekly operating schedules, live order pausing, and original menu cards—all from your dedicated vendor dashboard.
            </p>

            {/* Merchant Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-zinc-300 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom portion sizing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live order pause controls</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Original menu card upload</span>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/vendor/register"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-linear-to-r from-brand-orange to-brand-tomato hover:from-brand-tomato hover:to-brand-orange text-white text-xs sm:text-sm font-black shadow-lg hover:shadow-brand-orange/40 transition-all hover:scale-105 active:scale-95"
              >
                <span>Register Your Food Kitchen</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

