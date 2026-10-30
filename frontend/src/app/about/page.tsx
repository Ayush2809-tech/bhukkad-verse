"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { API_BASE_URL } from "@/lib/api";
import {
  Sparkles,
  Flame,
  Crown,
  ChefHat,
  Award,
} from "lucide-react";

interface AboutCMSData {
  about_hero_title: string;
  about_hero_subtitle: string;
  about_street_title: string;
  about_street_desc: string;
  about_luxury_title: string;
  about_luxury_desc: string;
  about_kitchens_title: string;
  about_kitchens_desc: string;
  about_developer_title: string;
  about_developer_desc: string;
}

const DEFAULT_ABOUT_CMS: AboutCMSData = {
  about_hero_title: "One Universe for All Your Cravings",
  about_hero_subtitle:
    "Born from an unbridled passion for authentic flavors. From the narrow historic alleys of Old Delhi serving legendary street chaat to five-star royal Awadhi palaces and beloved local cloud kitchens.",
  about_street_title: "Iconic Street Food & Legendary Carts",
  about_street_desc:
    "Deep-rooted recipes from traditional chaat corners, spicy kathi roll makers, and iconic roadside samosa masters who have perfected their craft across decades.",
  about_luxury_title: "Luxury Fine Dining & Hotels",
  about_luxury_desc:
    "Partnering with royal Mughlai heritage dining rooms and artisanal master chefs to bring earthen handi slow-dum biryanis and truffle delicacies directly to your table with five-star luxury presentation.",
  about_kitchens_title: "Fresh Neighborhood Kitchens",
  about_kitchens_desc:
    "Pure homestyle comfort cooked fresh every single day. Sanitized cloud kitchens preparing wholesome dal makhani, paneer gravies, and hot rotis with authentic whole spices and zero artificial additives.",
  about_developer_title: "Crafted with Passion by Ayush Saxena",
  about_developer_desc:
    "Bhukkad Verse was engineered from ground up as a modern, high-performance food tech universe. Designed with full vendor autonomy, geolocation intelligence, real-time ticket escalation, and theatrical cinematic animations.",
};

export default function AboutUsPage() {
  const [cms, setCms] = useState<AboutCMSData>(DEFAULT_ABOUT_CMS);

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/core/settings/`);
        if (res.ok) {
          const data = await res.json();
          setCms({
            about_hero_title: data.about_hero_title || DEFAULT_ABOUT_CMS.about_hero_title,
            about_hero_subtitle: data.about_hero_subtitle || DEFAULT_ABOUT_CMS.about_hero_subtitle,
            about_street_title: data.about_street_title || DEFAULT_ABOUT_CMS.about_street_title,
            about_street_desc: data.about_street_desc || DEFAULT_ABOUT_CMS.about_street_desc,
            about_luxury_title: data.about_luxury_title || DEFAULT_ABOUT_CMS.about_luxury_title,
            about_luxury_desc: data.about_luxury_desc || DEFAULT_ABOUT_CMS.about_luxury_desc,
            about_kitchens_title: data.about_kitchens_title || DEFAULT_ABOUT_CMS.about_kitchens_title,
            about_kitchens_desc: data.about_kitchens_desc || DEFAULT_ABOUT_CMS.about_kitchens_desc,
            about_developer_title: data.about_developer_title || DEFAULT_ABOUT_CMS.about_developer_title,
            about_developer_desc: data.about_developer_desc || DEFAULT_ABOUT_CMS.about_developer_desc,
          });
        }
      } catch {
        // Fallback to defaults
      }
    };
    fetchCms();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Header (Admin CMS Managed) */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-xs font-black text-brand-orange uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>The Story of Bhukkad Verse</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-charcoal tracking-tight">
            {cms.about_hero_title}
          </h1>
          <p className="text-base text-brand-muted leading-relaxed font-medium">
            {cms.about_hero_subtitle}
          </p>
        </div>

        {/* 3 Pillars Showcase (Admin CMS Managed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-xs space-y-4 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <Flame className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-brand-charcoal">{cms.about_street_title}</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              {cms.about_street_desc}
            </p>
          </div>

          <div className="bg-linear-to-b from-[#1E1B18] to-[#121110] rounded-3xl border border-amber-900/40 p-8 shadow-xl space-y-4 text-white hover:border-amber-500/50 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Crown className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-amber-400">{cms.about_luxury_title}</h3>
            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
              {cms.about_luxury_desc}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-xs space-y-4 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ChefHat className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-brand-charcoal">{cms.about_kitchens_title}</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              {cms.about_kitchens_desc}
            </p>
          </div>
        </div>

        {/* Founder & Developer Spotlight (Admin CMS Managed) */}
        <div className="bg-white rounded-3xl border border-brand-border p-8 sm:p-12 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-black uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Architect & Lead Developer</span>
              </div>
              <h2 className="text-3xl font-black text-brand-charcoal">
                {cms.about_developer_title}
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                {cms.about_developer_desc}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                <Link
                  href="/shops"
                  className="px-6 py-3 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black uppercase tracking-wider shadow-md transition-all"
                >
                  Explore Food Universe
                </Link>
                <Link
                  href="/vendor/register"
                  className="px-6 py-3 rounded-full bg-brand-charcoal hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all"
                >
                  Partner With Us
                </Link>
              </div>
            </div>

            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-3xl bg-[#FCF1E0] border border-amber-200/80 p-3 shadow-xl relative shrink-0 flex items-center justify-center">
              <BrandLogo variant="full" size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
