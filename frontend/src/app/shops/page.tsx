"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useLocation } from "@/context/LocationContext";
import { SearchDishItem, SearchShopItem } from "@/types/search";
import { DishCard } from "@/components/search/DishCard";
import {
  Store,
  MapPin,
  Clock,
  Search,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
  Flame,
} from "lucide-react";

type SearchMode = "dish" | "shop";
type DietaryFilter = "ALL" | "VEG" | "NON_VEG";
type TierFilter = "ALL" | "STREET_FOOD" | "LUXURY_DINING" | "FRESH_KITCHEN";

function ShopsDiscoveryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialType = (searchParams.get("type") as SearchMode) || "dish";
  const initialTier = (searchParams.get("tier") as TierFilter) || "ALL";

  const { coordinates, addressLabel, activeLocation, openLocationModal } = useLocation();

  const [searchMode, setSearchMode] = useState<SearchMode>(initialType);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("ALL");
  const [tierFilter, setTierFilter] = useState<TierFilter>(initialTier);
  const [deliverableOnly, setDeliverableOnly] = useState(false);

  const [dishes, setDishes] = useState<SearchDishItem[]>([]);
  const [shops, setShops] = useState<SearchShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state with URL parameter changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const t = (searchParams.get("type") as SearchMode) || "dish";
    setSearchQuery(q);
    setSearchMode(t === "shop" ? "shop" : "dish");
  }, [searchParams]);

  // Primary data fetcher: fetches both dishes and shops concurrently
  const performSearch = useCallback(
    async (queryText: string, onlyDeliverable: boolean, diet: DietaryFilter, tier: TierFilter) => {
      try {
        setLoading(true);
        setError(null);

        const lat = coordinates?.lat?.toString();
        const lng = coordinates?.lng?.toString();

        // 1. Prepare Product/Dish Search URL
        const dishUrl = new URL(`${API_BASE_URL}/v1/products/search/`);
        if (queryText.trim()) {
          dishUrl.searchParams.set("q", queryText.trim());
        }
        if (diet !== "ALL") {
          dishUrl.searchParams.set("dietary_type", diet);
        }
        if (lat && lng) {
          dishUrl.searchParams.set("lat", lat);
          dishUrl.searchParams.set("lng", lng);
          if (onlyDeliverable) {
            dishUrl.searchParams.set("deliverable_only", "true");
          }
        }

        // 2. Prepare Shop Search URL
        const shopUrl = new URL(`${API_BASE_URL}/v1/shops/`);
        if (queryText.trim()) {
          shopUrl.searchParams.set("q", queryText.trim());
        }
        if (tier !== "ALL") {
          shopUrl.searchParams.set("tier", tier);
        }
        if (lat && lng) {
          shopUrl.searchParams.set("lat", lat);
          shopUrl.searchParams.set("lng", lng);
          if (onlyDeliverable) {
            shopUrl.searchParams.set("deliverable_only", "true");
          }
        }

        const [dishRes, shopRes] = await Promise.all([
          fetch(dishUrl.toString()),
          fetch(shopUrl.toString()),
        ]);

        if (dishRes.ok) {
          const dishData: SearchDishItem[] = await dishRes.json();
          setDishes(dishData);
        } else {
          setDishes([]);
        }

        if (shopRes.ok) {
          const shopData: SearchShopItem[] = await shopRes.json();
          setShops(shopData);
        } else {
          setShops([]);
        }

        if (!dishRes.ok && !shopRes.ok) {
          setError("Failed to fetch marketplace results. Please try again.");
        }
      } catch {
        setError("Network error connecting to marketplace services.");
        setDishes([]);
        setShops([]);
      } finally {
        setLoading(false);
      }
    },
    [coordinates]
  );

  useEffect(() => {
    performSearch(searchQuery, deliverableOnly, dietaryFilter, tierFilter);
  }, [performSearch, searchQuery, deliverableOnly, dietaryFilter, tierFilter]);

  const updateUrlParams = (newQuery: string, newMode: SearchMode) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set("q", newQuery.trim());
    if (newMode) params.set("type", newMode);
    router.replace(`/shops?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams(searchQuery, searchMode);
    performSearch(searchQuery, deliverableOnly, dietaryFilter, tierFilter);
  };

  const handleModeSwitch = (mode: SearchMode) => {
    setSearchMode(mode);
    updateUrlParams(searchQuery, mode);
  };

  const displayLocation =
    activeLocation.shortAddress || addressLabel || "No location chosen";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-brand-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-[11px] font-black text-brand-orange uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-amber fill-brand-amber" />
            <span>Marketplace Food Discovery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
            {searchMode === "dish" ? "Find Your Craving" : "Discover Food Kitchens"}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            {searchMode === "dish"
              ? "Browse authentic dishes freshly prepared across verified local cloud kitchens."
              : "Order directly from authentic, independent restaurants and local food artisans."}
          </p>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96">
          <div className="relative">
            <input
              type="text"
              placeholder={
                searchMode === "dish"
                  ? "Search dishes, e.g. Burger, Paneer Pizza, Pasta..."
                  : "Search kitchens, e.g. Live Tandoor & Grill..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-xs sm:text-sm text-brand-charcoal shadow-xs"
            />
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  updateUrlParams("", searchMode);
                }}
                className="absolute right-3 top-2.5 p-0.5 text-xs text-brand-muted hover:text-brand-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Customer Location Context Banner */}
      <div className="p-4 rounded-3xl bg-white border border-brand-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-tomato shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted">
                Delivery Location
              </span>
              {coordinates && activeLocation.source === "gps" && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                  GPS Active
                </span>
              )}
              {coordinates && activeLocation.source === "saved" && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black uppercase">
                  Saved Address
                </span>
              )}
              {coordinates && activeLocation.source === "manual" && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                  Manual Pin
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-black text-brand-charcoal truncate max-w-md">
              {displayLocation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Deliverable Only Toggle if coordinates exist */}
          {coordinates && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-charcoal bg-brand-surface px-3 py-1.5 rounded-full border border-brand-border select-none">
              <input
                type="checkbox"
                checked={deliverableOnly}
                onChange={(e) => setDeliverableOnly(e.target.checked)}
                className="rounded text-brand-orange focus:ring-brand-orange"
              />
              <span className="text-[11px]">Deliverable to Me</span>
            </label>
          )}

          <button
            type="button"
            onClick={openLocationModal}
            className="px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{coordinates ? "Change Location" : "Set Location"}</span>
          </button>
        </div>
      </div>

      {/* Dual Search Mode Tabs & Dietary Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-brand-surface rounded-2xl border border-brand-border max-w-md">
          <button
            type="button"
            onClick={() => handleModeSwitch("dish")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              searchMode === "dish"
                ? "bg-brand-charcoal text-white shadow-xs"
                : "text-brand-charcoal hover:text-brand-orange"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dishes</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                searchMode === "dish"
                  ? "bg-brand-orange text-white"
                  : "bg-white text-brand-charcoal border border-brand-border"
              }`}
            >
              {loading ? "..." : dishes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("shop")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              searchMode === "shop"
                ? "bg-brand-charcoal text-white shadow-xs"
                : "text-brand-charcoal hover:text-brand-orange"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Kitchens</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                searchMode === "shop"
                  ? "bg-brand-orange text-white"
                  : "bg-white text-brand-charcoal border border-brand-border"
              }`}
            >
              {loading ? "..." : shops.length}
            </span>
          </button>
        </div>

        {/* Veg / Non-Veg filters if in Dish mode */}
        {searchMode === "dish" && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-zinc-500 mr-1 hidden md:inline">
              Diet:
            </span>
            {(["ALL", "VEG", "NON_VEG"] as DietaryFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDietaryFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  dietaryFilter === filter
                    ? "bg-brand-charcoal text-white shadow-2xs"
                    : "bg-white border border-brand-border text-brand-charcoal hover:border-brand-orange hover:bg-brand-surface"
                }`}
              >
                {filter === "ALL" && "All Food"}
                {filter === "VEG" && "🌱 Pure Veg"}
                {filter === "NON_VEG" && "🍗 Non-Veg"}
              </button>
            ))}
          </div>
        )}

        {/* Tier filters if in Shop mode */}
        {searchMode === "shop" && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-zinc-500 mr-1 hidden md:inline">
              Universe:
            </span>
            {(
              [
                { id: "ALL", label: "🌟 All Hubs" },
                { id: "STREET_FOOD", label: "🌶️ Street Food (₹ Budget)" },
                { id: "LUXURY_DINING", label: "👑 Luxury Fine Dining (5★)" },
                { id: "FRESH_KITCHEN", label: "🍲 Fresh Kitchens" },
              ] as { id: TierFilter; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierFilter(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  tierFilter === t.id
                    ? t.id === "STREET_FOOD"
                      ? "bg-red-600 text-white shadow-2xs"
                      : t.id === "LUXURY_DINING"
                      ? "bg-amber-500 text-black shadow-2xs font-black"
                      : t.id === "FRESH_KITCHEN"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-brand-charcoal text-white shadow-2xs"
                    : "bg-white border border-brand-border text-brand-charcoal hover:border-brand-orange hover:bg-brand-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content States */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 bg-white/50 rounded-3xl border border-brand-border p-12">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-xs font-bold text-brand-muted">
            {searchMode === "dish"
              ? "Searching freshly prepared dishes and calculating distances..."
              : "Fetching approved food kitchens..."}
          </p>
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-red-200 p-8">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-brand-charcoal">{error}</h2>
          <p className="text-xs text-brand-muted max-w-sm mx-auto">
            We could not connect to the food discovery service. Please check your connection.
          </p>
          <button
            type="button"
            onClick={() => performSearch(searchQuery, deliverableOnly, dietaryFilter, tierFilter)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Search</span>
          </button>
        </div>
      ) : searchMode === "dish" ? (
        /* DISH RESULTS MODE (SEARCH A) */
        dishes.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-brand-border p-8">
            <div className="w-16 h-16 rounded-full bg-brand-surface text-brand-orange mx-auto flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-brand-charcoal">
              {searchQuery
                ? `No dishes matching "${searchQuery}"`
                : "No dishes currently available in this category"}
            </h2>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
              {searchQuery
                ? `We couldn't find any dishes named "${searchQuery}". Check the spelling, try another craving, or switch to kitchen search.`
                : "Our partner kitchens are continuously updating their daily specialty menus. Check back shortly!"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-5 py-2.5 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal text-xs font-bold hover:bg-brand-border transition-colors cursor-pointer"
                >
                  Clear Dish Search
                </button>
              )}
              {shops.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch("shop")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Search in Kitchens ({shops.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )
      ) : (
        /* KITCHEN RESULTS MODE (SEARCH B) */
        shops.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-brand-border p-8">
            <div className="w-16 h-16 rounded-full bg-brand-surface text-brand-orange mx-auto flex items-center justify-center">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-brand-charcoal">
              {deliverableOnly
                ? "No Kitchens Currently Deliver to This Location"
                : searchQuery
                ? `No kitchens matching "${searchQuery}"`
                : "No Approved Kitchens Found"}
            </h2>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
              {deliverableOnly
                ? "None of the currently open kitchens have a delivery radius covering your coordinates. Try unchecking 'Deliverable to Me' to explore kitchens in adjacent zones, or choose another address."
                : searchQuery
                ? `No kitchens match "${searchQuery}". Looking for a specific dish? Try switching to dish search.`
                : "We are actively onboarding new food partners in your area. Are you an independent food shopkeeper? Join our kitchen partner network!"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {searchQuery && dishes.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch("dish")}
                  className="px-5 py-2.5 rounded-full bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange/90 transition-colors cursor-pointer"
                >
                  View Matching Dishes ({dishes.length})
                </button>
              )}
              {deliverableOnly && (
                <button
                  type="button"
                  onClick={() => setDeliverableOnly(false)}
                  className="px-5 py-2.5 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal text-xs font-bold hover:bg-brand-border transition-colors cursor-pointer"
                >
                  View All Kitchens
                </button>
              )}
              <Link
                href="/vendor/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-bold transition-colors"
              >
                <span>Register Your Kitchen</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => {
              const hasDistance =
                shop.distance_km !== undefined &&
                shop.distance_km !== null &&
                !isNaN(Number(shop.distance_km));

              const isDeliverable = shop.is_deliverable;

              return (
                <div
                  key={shop.id}
                  className="bg-white rounded-3xl border border-brand-border overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-orange shrink-0">
                        <Store className="w-6 h-6" />
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Open / Closed status */}
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            shop.is_accepting_orders
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {shop.is_accepting_orders ? "Open Now" : "Currently Closed"}
                        </span>

                        {/* Deliverability Badge if location selected */}
                        {isDeliverable === true && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Delivers to you</span>
                          </span>
                        )}
                        {isDeliverable === false && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <span>Outside delivery zone</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            (shop as any).tier === "STREET_FOOD"
                              ? "bg-red-100 text-red-700"
                              : (shop as any).tier === "LUXURY_DINING"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {(shop as any).tier_display || "Fresh Kitchen"}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-brand-charcoal group-hover:text-brand-orange transition-colors">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-brand-muted line-clamp-2 mt-1">
                        {shop.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-brand-border/60 text-xs text-brand-muted">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <MapPin className="w-3.5 h-3.5 text-brand-tomato shrink-0" />
                          <span className="truncate">
                            {shop.address_line}, {shop.city}
                          </span>
                        </div>
                        {hasDistance && (
                          <span className="text-[11px] font-black text-brand-charcoal shrink-0 bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border">
                            📍 {shop.distance_km} km
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                          <span>
                            {shop.opening_time} - {shop.closing_time}
                          </span>
                        </div>
                        <span className="text-brand-muted font-semibold">
                          Radius: {shop.delivery_radius_km} km
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-brand-surface/40 border-t border-brand-border/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-bold block">
                        Min Order
                      </span>
                      <span className="text-sm font-black text-brand-charcoal">
                        ₹{shop.minimum_order_value}
                      </span>
                    </div>

                    <Link
                      href={`/shops/${shop.slug}`}
                      className="px-5 py-2 rounded-full bg-brand-charcoal text-white text-xs font-black hover:bg-brand-orange transition-colors shadow-xs"
                    >
                      View Menu
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default function ShopsDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      }
    >
      <ShopsDiscoveryContent />
    </Suspense>
  );
}
