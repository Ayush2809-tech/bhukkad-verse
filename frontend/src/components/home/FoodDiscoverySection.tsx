"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useLocation } from "@/context/LocationContext";
import { API_BASE_URL } from "@/lib/api";
import { SearchDishItem, SearchShopItem } from "@/types/search";
import { DishCard } from "@/components/search/DishCard";
import {
  Store,
  MapPin,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Navigation,
  Search,
  UtensilsCrossed,
} from "lucide-react";

export type PublicShop = SearchShopItem;

interface FoodDiscoverySectionProps {
  initialSearchQuery?: string;
  initialMode?: "dish" | "shop";
  onClearSearch?: () => void;
}

type StatusFilter = "ALL" | "OPEN_ONLY" | "DELIVERABLE_ONLY";
type DietaryFilter = "ALL" | "VEG" | "NON_VEG";

export const FoodDiscoverySection: React.FC<FoodDiscoverySectionProps> = ({
  initialSearchQuery = "",
  initialMode = "dish",
  onClearSearch,
}) => {
  const { coordinates, activeLocation, openLocationModal } = useLocation();

  const [searchMode, setSearchMode] = useState<"dish" | "shop">(initialMode);
  const [localSearch, setLocalSearch] = useState(initialSearchQuery);
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<"DEFAULT" | "PROXIMITY" | "MIN_ORDER">("DEFAULT");

  const [dishes, setDishes] = useState<SearchDishItem[]>([]);
  const [shops, setShops] = useState<PublicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync external search query and mode
  useEffect(() => {
    queueMicrotask(() => {
      setLocalSearch(initialSearchQuery);
      if (initialSearchQuery.trim()) {
        setSearchMode(initialMode || "dish");
      }
    });
  }, [initialSearchQuery, initialMode]);

  // Fetch both products and shops from backend API concurrently
  const fetchData = useCallback(async (queryText: string) => {
    try {
      setLoading(true);
      setError(null);

      const lat = coordinates?.lat?.toString();
      const lng = coordinates?.lng?.toString();

      // 1. Dish search endpoint
      const dishUrl = new URL(`${API_BASE_URL}/v1/products/search/`);
      if (queryText.trim()) {
        dishUrl.searchParams.set("q", queryText.trim());
      }
      if (lat && lng) {
        dishUrl.searchParams.set("lat", lat);
        dishUrl.searchParams.set("lng", lng);
      }

      // 2. Kitchen search endpoint
      const shopUrl = new URL(`${API_BASE_URL}/v1/shops/`);
      if (queryText.trim()) {
        shopUrl.searchParams.set("q", queryText.trim());
      }
      if (lat && lng) {
        shopUrl.searchParams.set("lat", lat);
        shopUrl.searchParams.set("lng", lng);
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
        const shopData: PublicShop[] = await shopRes.json();
        setShops(shopData);
      } else {
        setShops([]);
      }

      if (!dishRes.ok && !shopRes.ok) {
        setError("Unable to connect to platform food marketplace.");
      }
    } catch {
      setError("Network error connecting to food marketplace service.");
    } finally {
      setLoading(false);
    }
  }, [coordinates]);

  useEffect(() => {
    fetchData(localSearch);
  }, [fetchData, localSearch]);

  // Client-side filtering & sorting for dishes
  const filteredDishes = useMemo(() => {
    let result = [...dishes];

    // Dietary filter
    if (dietaryFilter === "VEG") {
      result = result.filter(
        (d) => d.dietary_type === "VEG" || d.dietary_type === "VEGAN"
      );
    } else if (dietaryFilter === "NON_VEG") {
      result = result.filter((d) => d.dietary_type === "NON_VEG");
    }

    // Deliverable only filter
    if (activeFilter === "DELIVERABLE_ONLY") {
      result = result.filter((d) => d.is_deliverable === true);
    }

    return result;
  }, [dishes, dietaryFilter, activeFilter]);

  // Client-side filtering & sorting for shops
  const filteredShops = useMemo(() => {
    let result = [...shops];

    // Status filter
    if (activeFilter === "OPEN_ONLY") {
      result = result.filter((s) => s.is_accepting_orders);
    } else if (activeFilter === "DELIVERABLE_ONLY") {
      result = result.filter((s) => s.is_deliverable === true);
    }

    // Sorting
    if (sortBy === "PROXIMITY") {
      result.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
    } else if (sortBy === "MIN_ORDER") {
      result.sort(
        (a, b) =>
          parseFloat(a.minimum_order_value || "0") -
          parseFloat(b.minimum_order_value || "0")
      );
    }

    return result;
  }, [shops, activeFilter, sortBy]);

  const handleResetFilters = () => {
    setActiveFilter("ALL");
    setDietaryFilter("ALL");
    setSortBy("DEFAULT");
    setLocalSearch("");
    if (onClearSearch) onClearSearch();
  };

  return (
    <section id="discovery" className="py-14 sm:py-20 bg-white border-y border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-brand-tomato">
                Curated Cloud Kitchens &amp; Bakeries
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
              <span className="text-xs font-bold text-zinc-400">Live Marketplace</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
              {searchMode === "dish"
                ? localSearch
                  ? `Dishes matching "${localSearch}"`
                  : "Explore Popular Dishes"
                : coordinates
                ? "Kitchens Near You"
                : "All Partner Kitchens"}
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-1.5 max-w-2xl">
              Authentic food crafted by genuine independent chefs. Check live operating hours, customizable portions, and doorstep delivery eligibility.
            </p>
          </div>

          <Link
            href={`/shops?type=${searchMode}`}
            className="inline-flex items-center gap-1.5 text-xs font-black text-brand-charcoal hover:text-brand-orange transition-colors self-start md:self-auto cursor-pointer"
          >
            <span>{searchMode === "dish" ? "All Dishes Directory" : "Full Kitchens Directory"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Location prompt — shown when no delivery location is set */}
        {!coordinates ? (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900">Set your location to see delivery eligibility and distances</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Showing all approved partner kitchens. Set your address to filter those that deliver to you.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openLocationModal}
              className="px-4 py-2.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-black transition-colors flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Set Delivery Location</span>
            </button>
          </div>
        ) : (
          <div className="mb-6 px-4 py-2.5 rounded-2xl bg-white border border-brand-border/80 shadow-2xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              {activeLocation.source === "gps" ? (
                <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              )}
              <span className="font-semibold text-brand-muted truncate">
                Showing food &amp; distances near:{" "}
                <strong className="text-brand-charcoal">{activeLocation.shortAddress || activeLocation.addressLabel}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={openLocationModal}
              className="text-[11px] font-black text-brand-orange hover:underline uppercase shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {/* Dual-Mode Selector Tabs & Filter Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-brand-surface border border-brand-border/80 shadow-2xs mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Primary Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-brand-border">
              <button
                type="button"
                onClick={() => setSearchMode("dish")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  searchMode === "dish"
                    ? "bg-brand-charcoal text-white shadow-xs"
                    : "text-brand-charcoal hover:text-brand-orange"
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-brand-orange" />
                <span>Dishes</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    searchMode === "dish"
                      ? "bg-brand-orange text-white"
                      : "bg-brand-surface text-brand-charcoal border border-brand-border"
                  }`}
                >
                  {loading ? "..." : dishes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode("shop")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  searchMode === "shop"
                    ? "bg-brand-charcoal text-white shadow-xs"
                    : "text-brand-charcoal hover:text-brand-orange"
                }`}
              >
                <Store className="w-3.5 h-3.5 text-brand-orange" />
                <span>Partner Kitchens</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    searchMode === "shop"
                      ? "bg-brand-orange text-white"
                      : "bg-brand-surface text-brand-charcoal border border-brand-border"
                  }`}
                >
                  {loading ? "..." : shops.length}
                </span>
              </button>
            </div>

            {/* Quick in-place search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={
                  searchMode === "dish"
                    ? "Filter dishes, e.g. Burger, Pizza..."
                    : "Filter kitchens in place..."
                }
                className="w-full text-xs pl-8 pr-7 py-2 bg-white border border-brand-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-brand-charcoal"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch("");
                    if (onClearSearch) onClearSearch();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-brand-border/60">
            {searchMode === "dish" ? (
              /* Dietary Filter for Dishes */
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] font-bold text-zinc-500 mr-1 hidden sm:inline">
                  Diet:
                </span>
                {(["ALL", "VEG", "NON_VEG"] as DietaryFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDietaryFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      dietaryFilter === f
                        ? "bg-brand-charcoal text-white shadow-2xs"
                        : "bg-white border border-brand-border text-brand-charcoal hover:border-brand-orange"
                    }`}
                  >
                    {f === "ALL" && "All Dishes"}
                    {f === "VEG" && "🌱 Pure Veg"}
                    {f === "NON_VEG" && "🍗 Non-Veg"}
                  </button>
                ))}

                {coordinates && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFilter((prev) =>
                        prev === "DELIVERABLE_ONLY" ? "ALL" : "DELIVERABLE_ONLY"
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-1 ${
                      activeFilter === "DELIVERABLE_ONLY"
                        ? "bg-brand-orange text-white shadow-2xs"
                        : "bg-white border border-brand-border text-brand-charcoal hover:border-brand-orange"
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-brand-tomato" />
                    <span>Delivers To Me</span>
                  </button>
                )}
              </div>
            ) : (
              /* Status Filter for Kitchens */
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter("ALL")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === "ALL"
                      ? "bg-brand-charcoal text-white shadow-xs"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-brand-border"
                  }`}
                >
                  All Kitchens ({shops.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("OPEN_ONLY")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeFilter === "OPEN_ONLY"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-brand-border"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Open For Orders</span>
                </button>

                {coordinates && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("DELIVERABLE_ONLY")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeFilter === "DELIVERABLE_ONLY"
                        ? "bg-brand-orange text-white shadow-xs"
                        : "bg-white text-zinc-700 hover:bg-zinc-100 border border-brand-border"
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-brand-tomato" />
                    <span>Delivers To Me</span>
                  </button>
                )}
              </div>
            )}

            {/* Sort Dropdown */}
            {searchMode === "shop" && (
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "DEFAULT" | "PROXIMITY" | "MIN_ORDER")
                }
                className="text-xs font-bold py-1.5 px-3 bg-white border border-brand-border rounded-full focus:outline-none text-brand-charcoal cursor-pointer"
                aria-label="Sort kitchens"
              >
                <option value="DEFAULT">Recommended</option>
                {coordinates && <option value="PROXIMITY">Nearest Distance</option>}
                <option value="MIN_ORDER">Min Order Value</option>
              </select>
            )}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-brand-surface rounded-3xl p-6 border border-brand-border space-y-4 animate-pulse"
              >
                <div className="h-4 bg-zinc-200 rounded-full w-24" />
                <div className="h-6 bg-zinc-200 rounded-md w-3/4" />
                <div className="h-3 bg-zinc-200 rounded-md w-full" />
                <div className="h-3 bg-zinc-200 rounded-md w-1/2" />
                <div className="h-10 bg-zinc-200 rounded-2xl w-full pt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-brand-surface border border-red-200 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-brand-tomato mx-auto" />
            <h3 className="text-sm font-black text-brand-charcoal">Connection Error</h3>
            <p className="text-xs text-brand-muted">{error}</p>
            <button
              type="button"
              onClick={() => fetchData(localSearch)}
              className="px-4 py-2 bg-brand-charcoal text-white rounded-full text-xs font-bold hover:bg-brand-orange transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Content: Dish Mode or Shop Mode */}
        {!loading && !error && searchMode === "dish" && (
          filteredDishes.length === 0 ? (
            <div className="py-16 px-6 rounded-3xl bg-brand-surface border border-brand-border text-center max-w-xl mx-auto space-y-4">
              <UtensilsCrossed className="w-12 h-12 text-brand-orange mx-auto" />
              <h3 className="text-lg font-black text-brand-charcoal">
                {localSearch
                  ? `No dishes matching "${localSearch}"`
                  : "No dishes found"}
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                {localSearch
                  ? `We couldn't find any dishes named "${localSearch}". Try searching for another craving, or switch to kitchen search.`
                  : "No dishes currently match the active filters. Try resetting your filter selection."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-surface border border-brand-border hover:bg-brand-border text-brand-charcoal text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
                {shops.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchMode("shop")}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors cursor-pointer"
                  >
                    <span>View Partner Kitchens ({shops.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          )
        )}

        {!loading && !error && searchMode === "shop" && (
          filteredShops.length === 0 ? (
            <div className="py-16 px-6 rounded-3xl bg-brand-surface border border-brand-border text-center max-w-xl mx-auto space-y-4">
              <Store className="w-12 h-12 text-brand-orange mx-auto" />
              <h3 className="text-lg font-black text-brand-charcoal">
                {shops.length === 0 ? "No Kitchens Onboarded Yet" : "No Matching Kitchens Found"}
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                {shops.length === 0
                  ? "Our food artisans and partner cloud kitchens are undergoing food safety onboarding. Check back shortly."
                  : `No kitchens match the active filter criteria "${localSearch || activeFilter}". Try resetting your filters.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
                {dishes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchMode("dish")}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-orange text-white text-xs font-black hover:bg-brand-orange/90 transition-colors cursor-pointer"
                  >
                    <span>View Matching Dishes ({dishes.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white rounded-3xl border border-brand-border/90 overflow-hidden hover:shadow-xl hover:border-brand-orange/40 transition-all flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4">
                    {/* Card Header: Verification & Live Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Partner</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                          shop.is_accepting_orders
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            shop.is_accepting_orders
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>{shop.is_accepting_orders ? "Open For Orders" : "Kitchen Paused"}</span>
                      </span>
                    </div>

                    {/* Kitchen Title & Story */}
                    <div>
                      <Link href={`/shops/${shop.slug}`} className="block">
                        <h3 className="text-xl font-black text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-1">
                          {shop.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-brand-muted line-clamp-2 mt-1 leading-relaxed">
                        {shop.description ||
                          "Authentic recipes prepared fresh to order with choice of portions and add-ons."}
                      </p>
                    </div>

                    {/* Location & Proximity Row */}
                    <div className="space-y-2 pt-2 border-t border-brand-border/60 text-xs text-brand-muted">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-brand-tomato shrink-0" />
                          <span className="truncate">
                            {shop.address_line}, {shop.city}
                          </span>
                        </div>
                        {shop.distance_km !== undefined && shop.distance_km !== null && (
                          <span className="text-[11px] font-black text-brand-charcoal shrink-0 bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border">
                            📍 {shop.distance_km} km
                          </span>
                        )}
                      </div>

                      {/* Operational Details */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                          <span>
                            {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                          </span>
                        </div>

                        {/* Delivery Status */}
                        {shop.is_deliverable !== undefined && shop.is_deliverable !== null ? (
                          shop.is_deliverable ? (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Delivers to You
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                              Outside Radius
                            </span>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={openLocationModal}
                            className="text-[10px] font-bold text-brand-orange hover:underline cursor-pointer"
                          >
                            Check Delivery
                          </button>
                        )}
                      </div>

                      {/* Minimum Order Value */}
                      <div className="text-[11px] font-bold text-brand-charcoal pt-0.5 flex items-center justify-between">
                        <span>Min. Order: ₹{shop.minimum_order_value}</span>
                        <span className="text-zinc-400 font-normal">Service Radius: {shop.delivery_radius_km} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-6 py-4 bg-brand-surface/50 border-t border-brand-border/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-charcoal flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-brand-orange" />
                      <span>Sizes &amp; Add-ons</span>
                    </span>

                    <Link
                      href={`/shops/${shop.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors"
                    >
                      <span>View Menu</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
};
