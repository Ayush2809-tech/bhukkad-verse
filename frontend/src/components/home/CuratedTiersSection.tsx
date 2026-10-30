"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { API_BASE_URL } from "@/lib/api";
import {
  Flame,
  Crown,
  ChefHat,
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  MapPin,
  Plus,
  Check,
} from "lucide-react";

interface DishItem {
  id: string;
  name: string;
  base_price: string;
  compare_at_price?: string;
  image_url?: string;
  image?: string;
  dietary_type: string;
  shop_name?: string;
  shop_slug?: string;
  preparation_time_minutes?: number;
  description?: string;
}

interface ShopItem {
  id: string;
  name: string;
  slug: string;
  tier: "STREET_FOOD" | "LUXURY_DINING" | "FRESH_KITCHEN";
  tier_display: string;
  description: string;
  logo?: string;
  banner?: string;
  city: string;
  delivery_radius_km: string;
  minimum_order_value: string;
  is_accepting_orders: boolean;
  distance_km?: number | null;
}

export const CuratedTiersSection: React.FC = () => {
  const [activeTier, setActiveTier] = useState<"STREET_FOOD" | "LUXURY_DINING" | "FRESH_KITCHEN">("STREET_FOOD");
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedDishId, setAddedDishId] = useState<string | null>(null);

  const { addItem } = useCart();

  useEffect(() => {
    const fetchTierData = async () => {
      setLoading(true);
      try {
        const [shopsRes, dishesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/v1/shops/?tier=${activeTier}`),
          fetch(`${API_BASE_URL}/v1/products/`),
        ]);

        if (shopsRes.ok) {
          const shopData = await shopsRes.json();
          setShops(shopData.results || shopData);
        }

        if (dishesRes.ok) {
          const dishData = await dishesRes.json();
          const allDishes: DishItem[] = dishData.results || dishData;
          // Filter dishes matching shops of active tier if shop info available
          setDishes(allDishes.slice(0, 6));
        }
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    };

    fetchTierData();
  }, [activeTier]);

  const handleAddToCart = (e: React.MouseEvent, dish: DishItem) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      dishId: dish.id,
      name: dish.name,
      price: parseFloat(dish.base_price),
      dietaryType: dish.dietary_type === "NON_VEG" ? "NON_VEG" : "VEG",
      shopId: (dish as any).shop || "f9728c50-6156-4d3f-a454-49d45bbda896",
      shopName: dish.shop_name || "Bhukkad Kitchen",
      shopSlug: dish.shop_slug || "royal-dhaba",
      imageUrl: dish.image_url || dish.image,
    });

    setAddedDishId(dish.id);
    setTimeout(() => setAddedDishId(null), 1200);
  };

  return (
    <section className="py-16 bg-white border-b border-brand-border/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/25 text-xs font-black text-brand-orange uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Three Flavor Galaxies</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
            Curated Foodie Universes
          </h2>
          <p className="text-sm text-brand-muted font-medium">
            Choose your craving mood: authentic budget street bites, 5-star royal luxury feasts, or fresh neighborhood homestyle cooking.
          </p>
        </div>

        {/* 3 Tier Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto mb-12">
          {/* Street Food Tab */}
          <button
            type="button"
            onClick={() => setActiveTier("STREET_FOOD")}
            className={`p-4 rounded-3xl border-2 text-left transition-all duration-300 flex items-center gap-4 cursor-pointer ${
              activeTier === "STREET_FOOD"
                ? "border-brand-tomato bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/10 shadow-lg scale-[1.02]"
                : "border-brand-border bg-brand-surface/40 hover:border-brand-tomato/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTier === "STREET_FOOD"
                  ? "bg-brand-tomato text-white shadow-md shadow-brand-tomato/30"
                  : "bg-white text-brand-tomato border border-brand-border"
              }`}
            >
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-brand-charcoal">Street Food & Carts</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  ₹ Budget
                </span>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">Samosas, chaat, spicy rolls & quick bites</p>
            </div>
          </button>

          {/* Luxury Fine Dining Tab */}
          <button
            type="button"
            onClick={() => setActiveTier("LUXURY_DINING")}
            className={`p-4 rounded-3xl border-2 text-left transition-all duration-300 flex items-center gap-4 cursor-pointer ${
              activeTier === "LUXURY_DINING"
                ? "border-amber-500 bg-gradient-to-br from-[#1C160C] via-[#2A1E0E] to-[#150F08] text-white shadow-lg scale-[1.02]"
                : "border-brand-border bg-brand-surface/40 hover:border-amber-400/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTier === "LUXURY_DINING"
                  ? "bg-gradient-to-tr from-amber-400 to-amber-600 text-white shadow-md"
                  : "bg-white text-amber-600 border border-brand-border"
              }`}
            >
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-black ${activeTier === "LUXURY_DINING" ? "text-white" : "text-brand-charcoal"}`}>
                  Luxury Fine Dining
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500">
                  5★ Royal
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${activeTier === "LUXURY_DINING" ? "text-amber-200/70" : "text-brand-muted"}`}>
                Gourmet Awadhi dum, saffron & artisanal chefs
              </p>
            </div>
          </button>

          {/* Fresh Neighborhood Kitchens Tab */}
          <button
            type="button"
            onClick={() => setActiveTier("FRESH_KITCHEN")}
            className={`p-4 rounded-3xl border-2 text-left transition-all duration-300 flex items-center gap-4 cursor-pointer ${
              activeTier === "FRESH_KITCHEN"
                ? "border-emerald-600 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 shadow-lg scale-[1.02]"
                : "border-brand-border bg-brand-surface/40 hover:border-emerald-500/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTier === "FRESH_KITCHEN"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-emerald-600 border border-brand-border"
              }`}
            >
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-brand-charcoal">Fresh Kitchens</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Daily Fresh
                </span>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">Homestyle curries, tandoor & cloud kitchens</p>
            </div>
          </button>
        </div>

        {/* Dynamic Vibe Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl mb-10 transition-all duration-500 border ${
            activeTier === "STREET_FOOD"
              ? "bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white border-red-400 shadow-xl"
              : activeTier === "LUXURY_DINING"
              ? "bg-gradient-to-r from-[#140F08] via-[#241A0E] to-[#120E08] text-white border-amber-500/40 shadow-2xl"
              : "bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 text-white border-emerald-500 shadow-xl"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md inline-block">
                {activeTier === "STREET_FOOD"
                  ? "🌶️ Chandni Chowk & Desi Nukkad Vibe"
                  : activeTier === "LUXURY_DINING"
                  ? "👑 Grand Heritage Palace Culinary Craft"
                  : "🍲 Fresh Daily Homestyle Cooking"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                {activeTier === "STREET_FOOD"
                  ? "Chatpata, Sasta & Hot Street Food Craving"
                  : activeTier === "LUXURY_DINING"
                  ? "Aristocratic Fine Dining Cooked by Master Chefs"
                  : "Pure Homestyle Taste Cooked Fresh Everyday"}
              </h3>
              <p className="text-xs sm:text-sm text-white/80">
                {activeTier === "STREET_FOOD"
                  ? "Original roadside stalls & beloved food carts serving piping hot samosas, buttery pav bhaji, momos and chaat at student-friendly pocket prices."
                  : activeTier === "LUXURY_DINING"
                  ? "Exquisite dum pukht biryanis simmered with royal Kashmiri saffron, hand-ground spices and velvety gravies packaged in authentic earthen handis."
                  : "Sanitized neighborhood cloud kitchens preparing wholesome meals, buttery rotis, and comfort food with zero artificial preservatives."}
              </p>
            </div>

            <Link
              href={`/shops?tier=${activeTier}`}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shrink-0 transition-transform hover:scale-105 ${
                activeTier === "LUXURY_DINING"
                  ? "bg-amber-400 text-black hover:bg-amber-300"
                  : "bg-white text-brand-charcoal hover:bg-amber-50"
              }`}
            >
              <span>Explore All {activeTier === "STREET_FOOD" ? "Street Carts" : activeTier === "LUXURY_DINING" ? "Luxury Hotels" : "Fresh Kitchens"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kitchen Cards in Selected Tier */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Verified Kitchens in this Universe</span>
            </h4>
            <span className="text-xs font-bold text-brand-muted">
              {shops.length} {shops.length === 1 ? "kitchen" : "kitchens"} active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shops/${shop.slug}`}
                className="bg-brand-surface rounded-3xl border border-brand-border p-5 hover:border-brand-orange hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        shop.tier === "STREET_FOOD"
                          ? "bg-red-100 text-red-700"
                          : shop.tier === "LUXURY_DINING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {shop.tier_display}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Open Now
                    </span>
                  </div>

                  <h5 className="text-base font-black text-brand-charcoal group-hover:text-brand-orange transition-colors">
                    {shop.name}
                  </h5>
                  <p className="text-xs text-brand-muted line-clamp-2">{shop.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                  <div className="flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                    <span>{shop.city}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-brand-charcoal">
                    <span>Min ₹{shop.minimum_order_value}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

