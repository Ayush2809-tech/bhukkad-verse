"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import {
  Flame,
  Clock,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Store,
} from "lucide-react";

interface DishItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  compare_at_price: string | null;
  image?: string | null;
  image_url?: string;
  dietary_type: "VEG" | "NON_VEG" | "EGG" | "VEGAN";
  preparation_time_minutes: number;
  is_available: boolean;
  shop_id?: string;
  shop_name?: string;
  shop_slug?: string;
}

// Fair Interleaving Helper: Mixes dishes across vendors evenly
function interleaveVendorDishes(items: DishItem[]): DishItem[] {
  if (items.length <= 1) return items;

  const shopBuckets = new Map<string, DishItem[]>();
  items.forEach((item) => {
    const key = item.shop_id || item.shop_name || "unknown";
    if (!shopBuckets.has(key)) {
      shopBuckets.set(key, []);
    }
    shopBuckets.get(key)!.push(item);
  });

  const interleaved: DishItem[] = [];
  const buckets = Array.from(shopBuckets.values());
  let maxLen = 0;
  buckets.forEach((b) => {
    if (b.length > maxLen) maxLen = b.length;
  });

  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      if (i < bucket.length) {
        interleaved.push(bucket[i]);
      }
    }
  }

  return interleaved;
}

const FALLBACK_DISH_IMAGES = [
  "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80",
];

export const ContinuousDishesSlider: React.FC = () => {
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [addedDishId, setAddedDishId] = useState<string | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const fetchDishes = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/products/`);
      if (res.ok) {
        const data = await res.json();
        const items: DishItem[] = Array.isArray(data)
          ? data
          : data.results || [];
        const availableItems = items.filter((d: DishItem) => d.is_available !== false);
        const balanced = interleaveVendorDishes(availableItems);
        setDishes(balanced);
      }
    } catch {
      // Keep existing items if refresh fails
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial fetch + Periodic 25s auto-poll for dynamic real-time vendor updates
  useEffect(() => {
    fetchDishes(true);

    const interval = setInterval(() => {
      fetchDishes(false);
    }, 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDishes(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDishes]);

  // Continuous Infinite Spinning Marquee Mechanism
  useEffect(() => {
    if (isPaused || dishes.length === 0) return;

    const interval = setInterval(() => {
      const container = sliderRef.current;
      if (container) {
        container.scrollLeft += 1.5;
        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isPaused, dishes]);

  const handleManualScroll = (direction: "left" | "right") => {
    const container = sliderRef.current;
    if (container) {
      const halfWidth = container.scrollWidth / 2;
      if (direction === "left" && container.scrollLeft <= 50) {
        container.scrollLeft += halfWidth;
      } else if (direction === "right" && container.scrollLeft >= halfWidth - 50) {
        container.scrollLeft -= halfWidth;
      }
      const scrollAmount = direction === "left" ? -320 : 320;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, dish: DishItem) => {
    e.preventDefault();
    e.stopPropagation();

    const validDietary = dish.dietary_type === "NON_VEG" ? "NON_VEG" : "VEG";
    const resolvedImg = dish.image ? getMediaUrl(dish.image) : dish.image_url;

    addItem({
      dishId: dish.id,
      name: dish.name,
      price: parseFloat(dish.base_price),
      dietaryType: validDietary,
      shopId: dish.shop_id || "d3fdc836-e2b5-4b98-83e7-fd714d91c509",
      shopName: dish.shop_name || "Verified Kitchen",
      shopSlug: dish.shop_slug || "verified-kitchen",
      imageUrl: resolvedImg || undefined,
    });

    setAddedDishId(dish.id);
    setTimeout(() => {
      setAddedDishId(null);
    }, 1500);
  };

  if (loading && dishes.length === 0) {
    return (
      <section className="py-8 bg-brand-surface/40 border-y border-brand-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-72 h-80 bg-white rounded-3xl border border-brand-border animate-pulse shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (dishes.length === 0) return null;

  // Quadruple items to ensure wide continuous spinning track
  const displayDishes = [...dishes, ...dishes, ...dishes, ...dishes];

  return (
    <section className="py-12 bg-linear-to-b from-[#FDFBF7] via-[#F7F3EA]/60 to-[#FDFBF7] border-y border-brand-border/80 relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-xs font-black text-brand-orange uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-brand-orange" />
              <span>Trending Delicacies</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-charcoal tracking-tight">
              Popular Cravings
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted font-medium">
              Fresh delicacies handcrafted to order by neighborhood cloud kitchens &amp; artisanal chefs.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleManualScroll("left")}
              className="p-2.5 rounded-full bg-white hover:bg-brand-surface border border-brand-border shadow-xs hover:border-brand-orange text-brand-charcoal cursor-pointer transition-all"
              title="Scroll Left"
              aria-label="Scroll dishes left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleManualScroll("right")}
              className="p-2.5 rounded-full bg-white hover:bg-brand-surface border border-brand-border shadow-xs hover:border-brand-orange text-brand-charcoal cursor-pointer transition-all"
              title="Scroll Right"
              aria-label="Scroll dishes right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Endless Marquee Track */}
        <div
          ref={sliderRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex gap-5 overflow-x-hidden py-3 no-scrollbar cursor-grab active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {displayDishes.map((dish, idx) => {
            const hasDiscount =
              dish.compare_at_price &&
              parseFloat(dish.compare_at_price) > parseFloat(dish.base_price);
            const isVeg = dish.dietary_type === "VEG" || dish.dietary_type === "VEGAN";
            const isAdded = addedDishId === dish.id;
            const dishImage =
              (dish.image ? getMediaUrl(dish.image) : dish.image_url) ||
              FALLBACK_DISH_IMAGES[idx % FALLBACK_DISH_IMAGES.length];

            return (
              <div
                key={`${dish.id}-${idx}`}
                className="w-72 shrink-0 bg-white rounded-3xl border border-brand-border/90 shadow-xs hover:shadow-xl hover:border-brand-orange/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Dish Image Header */}
                <div className="relative aspect-4/3 w-full bg-[#F5F2EB] overflow-hidden">
                  <img
                    src={dishImage}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Dietary Symbol Badge */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-xl shadow-xs border border-brand-border flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isVeg ? "bg-emerald-600" : "bg-red-600"
                      }`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-charcoal">
                      {isVeg ? "VEG" : "NON-VEG"}
                    </span>
                  </div>

                  {/* Kitchen Owner Badge */}
                  {dish.shop_name && (
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-white/20 flex items-center gap-1 text-white text-[10px] font-bold max-w-[130px] truncate">
                      <Store className="w-3 h-3 text-brand-amber shrink-0" />
                      <span className="truncate">{dish.shop_name}</span>
                    </div>
                  )}

                  {/* Prep Time */}
                  <div className="absolute bottom-2.5 left-3 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-amber" />
                    <span>{dish.preparation_time_minutes || 20}m prep</span>
                  </div>

                  {hasDiscount && (
                    <div className="absolute bottom-2.5 right-3 bg-brand-tomato text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                      SAVE ₹
                      {Math.round(
                        parseFloat(dish.compare_at_price!) -
                          parseFloat(dish.base_price)
                      )}
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-brand-charcoal line-clamp-1 group-hover:text-brand-orange transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
                      {dish.description ||
                        "Artisanal specialty hand-prepared fresh with authentic ingredients."}
                    </p>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-brand-charcoal">
                          ₹{parseFloat(dish.base_price).toFixed(0)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-zinc-400 line-through font-semibold">
                            ₹{parseFloat(dish.compare_at_price!).toFixed(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Free delivery on ₹99+
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, dish)}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs ${
                        isAdded
                          ? "bg-emerald-600 text-white scale-95"
                          : "bg-brand-charcoal hover:bg-brand-orange text-white hover:shadow-md"
                      }`}
                      aria-label={`Add ${dish.name} to cart`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
