import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  ShieldCheck,
  Heart,
  Sparkles,
  Store,
  UserCheck,
  Utensils,
  Headphones,
  ShoppingBag,
  Flame,
  Code2,
} from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#141414] text-white pt-16 pb-12 border-t border-white/10 selection:bg-brand-orange selection:text-white relative overflow-hidden">
      {/* Subtle ambient gradient flare at footer top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-brand-orange/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Identity & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/5 inline-block p-2.5 rounded-2xl border border-white/10 backdrop-blur-xs">
              <BrandLogo variant="minimal" href="/" />
            </div>
            <p className="text-brand-amber font-black text-sm tracking-wider uppercase">
              YOUR CRAVINGS. YOUR UNIVERSE.
            </p>
            <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
              BHUKKAD VERSE connects hungry food lovers directly with verified independent neighborhood cloud kitchens, artisan bakers, and culinary masters. Cooked fresh to order, customizable portions, and transparent local delivery.
            </p>
            <div className="flex flex-col gap-2 pt-1 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine Partner Guarantee &amp; FSSAI Hygiene Audited</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Zero Stale Food • Hot &amp; Fresh Doorstep Delivery</span>
              </div>
            </div>
          </div>

          {/* Popular Food Cravings */}
          <div>
            <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-4 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-brand-orange" />
              <span>Foodie Universes</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
              <li>
                <Link href="/shops?tier=STREET_FOOD" className="hover:text-brand-orange transition-colors flex items-center gap-1.5 text-red-300">
                  <span>🌶️ Street Food &amp; Carts (₹ Budget)</span>
                </Link>
              </li>
              <li>
                <Link href="/shops?tier=LUXURY_DINING" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-300">
                  <span>👑 Luxury Fine Dining (5★)</span>
                </Link>
              </li>
              <li>
                <Link href="/shops?tier=FRESH_KITCHEN" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-300">
                  <span>🍲 Fresh Daily Kitchens</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-orange transition-colors">
                  About Bhukkad Verse
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-brand-orange transition-colors">
                  Community Foodie Reviews
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-brand-orange transition-colors">
                  Live Order Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer & Support */}
          <div>
            <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-4 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-brand-amber" />
              <span>Help &amp; Policies</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
              <li>
                <Link
                  href="/support"
                  className="hover:text-brand-orange text-brand-orange font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>24x7 Customer Support</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/919528055151"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>💬 WhatsApp Concierge</span>
                </a>
              </li>
              <li>
                <Link href="/cart" className="hover:text-brand-orange transition-colors flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  <span>My Food Cart</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-orange transition-colors">
                  Privacy &amp; Location Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-orange transition-colors">
                  Terms of Service &amp; SLA
                </Link>
              </li>
            </ul>
          </div>

          {/* Kitchen Partner Program */}
          <div>
            <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-4 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-brand-tomato" />
              <span>For Kitchen Partners</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
              <li>
                <Link
                  href="/vendor/register"
                  className="hover:text-brand-orange transition-colors flex items-center gap-1.5 text-brand-orange font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register Your Kitchen</span>
                </Link>
              </li>
              <li>
                <Link href="/vendor/dashboard" className="hover:text-brand-orange transition-colors">
                  Vendor Partner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-orange transition-colors">
                  Vendor Partner Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-brand-orange transition-colors text-purple-300">
                  Platform Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Ayush Saxena Credit */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© 2026 BHUKKAD VERSE. All rights reserved.</p>
            <span className="hidden sm:inline text-white/20">•</span>
            <p className="text-zinc-500">
              India&apos;s First Authentic Food-Tech Universe
            </p>
          </div>

          {/* Prominent Ayush Saxena Developer Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-inner">
            <Code2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span className="text-zinc-400 font-medium">Developed by</span>
            <span className="font-black text-sm tracking-wide bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Ayush Saxena
            </span>
          </div>

          <p className="flex items-center gap-1 text-zinc-400">
            Built with <Heart className="w-3.5 h-3.5 text-brand-tomato fill-brand-tomato" /> for food lovers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};
