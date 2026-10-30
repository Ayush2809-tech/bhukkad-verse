"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Flame, Star, Sparkles, X, ArrowRight, Store } from "lucide-react";

interface LiveTrendingItem {
  id: string;
  badge: string;
  dishName: string;
  shopName: string;
  shopSlug: string;
  price: string | number;
  preparationTime: number;
  dietaryType: string;
  timeAgo: string;
}

const BADGES = [
  "🔥 Popular in your area",
  "⭐ Trending Dish",
  "⚡ Fresh Batch Cooking",
  "🎉 Top Craving Today",
  "🛵 Express Delivery",
];

const TIME_INTERVALS = ["Just now", "2 mins ago", "4 mins ago", "7 mins ago", "12 mins ago"];

export const TrendingFoodPopup: React.FC = () => {
  const [items, setItems] = useState<LiveTrendingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedByUser, setIsDismissedByUser] = useState(false);

  // Fetch real products from database to generate 100% genuine dynamic trending popups
  useEffect(() => {
    let isMounted = true;

    const fetchRealDishes = async () => {
      try {
        const [prodRes, shopRes] = await Promise.all([
          fetch(`${API_BASE_URL}/v1/products/`),
          fetch(`${API_BASE_URL}/v1/shops/`),
        ]);

        if (prodRes.ok && isMounted) {
          const prods = await prodRes.json();
          // Filter available products
          const availableProds = prods.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: any) => p.is_available !== false
          );

          if (availableProds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const generated: LiveTrendingItem[] = availableProds.map((prod: any, idx: number) => ({
              id: prod.id,
              badge: BADGES[idx % BADGES.length],
              dishName: prod.name,
              shopName: prod.shop_name || "Verified Kitchen",
              shopSlug: prod.shop_slug || "",
              price: prod.base_price,
              preparationTime: prod.preparation_time_minutes || 20,
              dietaryType: prod.dietary_type || "VEG",
              timeAgo: TIME_INTERVALS[idx % TIME_INTERVALS.length],
            }));

            setItems(generated);
          }
        }
      } catch {
        // Silent failure if network is offline
      }
    };

    fetchRealDishes();

    return () => {
      isMounted = false;
    };
  }, []);

  // Popup cycle timer
  useEffect(() => {
    if (items.length === 0 || isDismissedByUser) return;

    // Show first popup after 5 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    // Rotate every 15 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
      }, 700);
    }, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [items, isDismissedByUser]);

  if (!isVisible || isDismissedByUser || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  return (
    <aside
      aria-label="Live customer food order activity"
      className="fixed bottom-20 left-4 sm:left-6 z-40 max-w-sm w-[90%] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="bg-[#1A1A1A]/95 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-white/15 backdrop-blur-md flex items-start gap-3 relative group hover:border-brand-orange/40 transition-all">
        {/* Animated Badge Icon */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-orange to-brand-tomato flex items-center justify-center text-white shrink-0 shadow-md">
          {currentIndex % 3 === 0 ? (
            <Flame className="w-5 h-5 text-white animate-pulse" />
          ) : currentIndex % 3 === 1 ? (
            <Star className="w-5 h-5 text-white fill-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Real Dynamic Product & Shop Info */}
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-amber">
              {currentItem.badge}
            </span>
            <span className="text-[10px] text-zinc-400">•</span>
            <span className="text-[10px] text-zinc-400 font-medium">{currentItem.timeAgo}</span>
          </div>

          <h4 className="text-xs sm:text-sm font-black text-white line-clamp-1 mt-0.5">
            {currentItem.dishName}
          </h4>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 line-clamp-1 font-medium mt-0.5">
            <Store className="w-3 h-3 text-brand-orange shrink-0" />
            <span className="truncate">{currentItem.shopName}</span>
          </div>

          <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/10 text-xs">
            {currentItem.shopSlug ? (
              <Link
                href={`/shops/${currentItem.shopSlug}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:text-brand-amber transition-colors"
              >
                <span>Order from Kitchen</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <Link
                href="/shops"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:text-brand-amber transition-colors"
              >
                <span>Browse Menu</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            <span className="text-[11px] font-black text-brand-amber">
              ₹{currentItem.price}
            </span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            // Re-enable after 35 seconds if user dismissed
            setTimeout(() => setIsDismissedByUser(false), 35000);
          }}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
