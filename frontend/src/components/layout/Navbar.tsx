"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { useCart } from "@/context/CartContext";
import { API_BASE_URL } from "@/lib/api";
import { SearchDishItem, SearchShopItem } from "@/types/search";
import {
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  MapPin,
  Navigation,
  Menu as MenuIcon,
  X,
  Store,
  UtensilsCrossed,
  ArrowRight,
  Loader2,
} from "lucide-react";

const CRAVINGS_ROTATING_PLACEHOLDERS = [
  "Search 'dum biryani'...",
  "Search 'cheese burst pizza'...",
  "Search 'crispy chicken burger'...",
  "Search 'paneer roll'...",
  "Search 'thick chocolate shake'...",
  "Search 'dal makhani'...",
  "Search 'steamed momos'...",
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"dish" | "shop">("dish");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Autocomplete state
  const [dishSuggestions, setDishSuggestions] = useState<SearchDishItem[]>([]);
  const [shopSuggestions, setShopSuggestions] = useState<SearchShopItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const { coordinates, activeLocation, openLocationModal, isDetectingLocation } = useLocation();
  const { totalItems } = useCart();
  const router = useRouter();

  // Warm up Next.js client router cache for instant, zero-delay taps across all pages
  useEffect(() => {
    router.prefetch('/shops');
    router.prefetch('/cart');
    router.prefetch('/orders');
    router.prefetch('/vendor/dashboard');
    router.prefetch('/admin');
    router.prefetch('/profile');
  }, [router]);

  // Dynamic rotating craving placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % CRAVINGS_ROTATING_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Debounced autocomplete suggestions fetcher
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setDishSuggestions([]);
      setShopSuggestions([]);
      setIsSuggesting(false);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const lat = coordinates?.lat?.toString();
        const lng = coordinates?.lng?.toString();

        if (searchMode === "dish") {
          const url = new URL(`${API_BASE_URL}/v1/products/search/`);
          url.searchParams.set("q", trimmed);
          if (lat && lng) {
            url.searchParams.set("lat", lat);
            url.searchParams.set("lng", lng);
          }
          const res = await fetch(url.toString());
          if (res.ok) {
            const data: SearchDishItem[] = await res.json();
            setDishSuggestions(data.slice(0, 5));
            setShowSuggestions(true);
          }
        } else {
          const url = new URL(`${API_BASE_URL}/v1/shops/`);
          url.searchParams.set("q", trimmed);
          if (lat && lng) {
            url.searchParams.set("lat", lat);
            url.searchParams.set("lng", lng);
          }
          const res = await fetch(url.toString());
          if (res.ok) {
            const data: SearchShopItem[] = await res.json();
            setShopSuggestions(data.slice(0, 5));
            setShowSuggestions(true);
          }
        }
      } catch {
        // Silently catch suggestion errors
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, coordinates]);

  // Click outside listener to dismiss autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/shops?q=${encodeURIComponent(searchQuery.trim())}&type=${searchMode}`
      );
      setShowSuggestions(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSuggestionClick = (path: string) => {
    setShowSuggestions(false);
    router.push(path);
  };

  const hasLocation = activeLocation.source !== "none";
  const displayLocation = isDetectingLocation
    ? "Detecting your location..."
    : hasLocation
    ? activeLocation.shortAddress || activeLocation.addressLabel
    : "Set Delivery Location";

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-brand-border/70 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 md:gap-6">
          {/* Left: Brand Logo & Honest Location Pill */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <BrandLogo variant="header" size="md" href="/" className="shrink-0" />

            {/* Desktop Location Selector */}
            <button
              type="button"
              onClick={openLocationModal}
              className="hidden sm:flex flex-col text-left px-3 py-1.5 rounded-2xl bg-white/70 hover:bg-white border border-brand-border/80 shadow-2xs hover:border-brand-orange/60 transition-all cursor-pointer group max-w-[210px] md:max-w-[260px]"
              title="Change delivery location"
              aria-label={`Delivery location: ${displayLocation}. Click to change.`}
            >
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                {isDetectingLocation ? (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-brand-orange animate-spin shrink-0" />
                    <span className="text-brand-orange">Detecting GPS...</span>
                  </>
                ) : activeLocation.source === "gps" ? (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700">GPS Location</span>
                  </>
                ) : activeLocation.source === "saved" ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                    <span className="text-brand-orange">Saved Address</span>
                  </>
                ) : activeLocation.source === "manual" ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-brand-charcoal shrink-0" />
                    <span className="text-brand-charcoal">Delivery To</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-brand-tomato shrink-0" />
                    <span className="text-brand-tomato">Choose Location</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors">
                <span className="truncate">{displayLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Center: Dual-Mode Search Bar with Live Suggestions (Desktop) */}
          <div
            ref={desktopSearchRef}
            className="hidden lg:flex relative items-center flex-1 max-w-xl mx-2"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full bg-white rounded-2xl shadow-xs border border-brand-border/90 px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-orange/30 focus-within:border-brand-orange transition-all"
            >
              {/* Search Mode Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSearchMode((prev) => (prev === "dish" ? "shop" : "dish"))
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-surface hover:bg-brand-border/60 text-xs font-black text-brand-charcoal border border-brand-border transition-colors mr-2 shrink-0 cursor-pointer"
                title={`Click to switch between Dishes and Kitchens search (currently: ${
                  searchMode === "dish" ? "Dishes" : "Kitchens"
                })`}
              >
                {searchMode === "dish" ? (
                  <>
                    <UtensilsCrossed className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Dishes</span>
                  </>
                ) : (
                  <>
                    <Store className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Kitchens</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-brand-muted" />
              </button>

              <Search className="w-4 h-4 text-brand-muted shrink-0 mr-2" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                }}
                placeholder={
                  searchMode === "dish"
                    ? CRAVINGS_ROTATING_PLACEHOLDERS[placeholderIndex]
                    : "Search kitchens, e.g. 'Live Tandoor'..."
                }
                className="w-full text-sm bg-transparent border-none focus:outline-none text-brand-charcoal placeholder:text-brand-muted/70 transition-all font-medium"
              />

              {isSuggesting && (
                <Loader2 className="w-3.5 h-3.5 text-brand-orange animate-spin shrink-0 mr-1.5" />
              )}

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="p-1 text-xs text-brand-muted hover:text-brand-charcoal cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-brand-border overflow-hidden z-50 animate-in fade-in-50 duration-150">
                <div className="px-4 py-2 bg-brand-surface/60 border-b border-brand-border flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-brand-muted">
                  <span>
                    Matching {searchMode === "dish" ? "Dishes" : "Kitchens"}
                  </span>
                  <span className="text-brand-orange font-bold">Live Search</span>
                </div>

                {searchMode === "dish" ? (
                  dishSuggestions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-brand-muted">
                      No dishes match &ldquo;{searchQuery}&rdquo;. Press Enter to view full results.
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-border/50 max-h-80 overflow-y-auto">
                      {dishSuggestions.map((dish) => {
                        const isVeg =
                          dish.dietary_type === "VEG" ||
                          dish.dietary_type === "VEGAN";
                        return (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() =>
                              handleSuggestionClick(`/shops/${dish.shop_slug}`)
                            }
                            className="w-full text-left px-4 py-3 hover:bg-brand-surface flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <span
                                className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                                  isVeg
                                    ? "border-emerald-600 bg-emerald-50"
                                    : "border-rose-600 bg-rose-50"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isVeg ? "bg-emerald-600" : "bg-rose-600"
                                  }`}
                                />
                              </span>
                              <div className="truncate">
                                <p className="text-xs font-black text-brand-charcoal group-hover:text-brand-orange transition-colors truncate">
                                  {dish.name}
                                </p>
                                <p className="text-[11px] text-brand-muted truncate flex items-center gap-1.5">
                                  <span>by {dish.shop_name}</span>
                                  {dish.distance_km !== null &&
                                    dish.distance_km !== undefined && (
                                      <span className="font-semibold text-brand-charcoal">
                                        • {dish.distance_km} km
                                      </span>
                                    )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-brand-charcoal">
                                ₹{dish.base_price}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : shopSuggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-brand-muted">
                    No kitchens match &ldquo;{searchQuery}&rdquo;. Press Enter to view full results.
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border/50 max-h-80 overflow-y-auto">
                    {shopSuggestions.map((shop) => (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() =>
                          handleSuggestionClick(`/shops/${shop.slug}`)
                        }
                        className="w-full text-left px-4 py-3 hover:bg-brand-surface flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-orange shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-black text-brand-charcoal group-hover:text-brand-orange transition-colors truncate">
                              {shop.name}
                            </p>
                            <p className="text-[11px] text-brand-muted truncate">
                              {shop.address_line}, {shop.city}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              shop.is_accepting_orders
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {shop.is_accepting_orders ? "Open" : "Closed"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-2.5 bg-brand-surface border-t border-brand-border">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full text-center py-1.5 text-xs font-bold text-brand-orange hover:text-brand-tomato transition-colors cursor-pointer"
                  >
                    Press Enter to view all results for &ldquo;{searchQuery}&rdquo; →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions, Customer Profile & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Role-Specific Portal Button (Admin or Vendor) */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-purple-900 hover:text-purple-700 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin</span>
              </Link>
            )}

            {user?.role === "VENDOR" && (
              <Link
                href="/vendor/dashboard"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-brand-charcoal hover:text-brand-orange px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 transition-colors shadow-2xs"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-orange" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* User Profile or Sign In */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-brand-surface border border-brand-border shadow-2xs transition-colors"
                  title="My Profile & Addresses"
                >
                  <div className="w-7 h-7 rounded-xl bg-brand-charcoal text-white flex items-center justify-center text-xs font-black uppercase">
                    {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-brand-charcoal truncate max-w-[110px]">
                      {user.first_name || user.username}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase text-brand-muted tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="hidden sm:flex p-2 rounded-xl text-brand-muted hover:text-brand-tomato hover:bg-white transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-xs transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center p-2.5 rounded-2xl bg-white border border-brand-border/90 text-brand-charcoal hover:border-brand-orange hover:text-brand-orange shadow-2xs transition-all cursor-pointer"
              aria-label={`Shopping Cart with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-brand-tomato text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              ) : null}
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-brand-charcoal hover:bg-brand-surface lg:hidden focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Header: Location & Dual-Mode Search */}
        <div className="pb-3 lg:hidden space-y-2">
          {/* Mobile Location Selector Bar */}
          <button
            type="button"
            onClick={openLocationModal}
            className="w-full flex items-center justify-between text-xs font-bold text-brand-charcoal bg-white border border-brand-border/80 px-3.5 py-2 rounded-2xl shadow-2xs hover:border-brand-orange transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              {activeLocation.source === "gps" ? (
                <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-brand-tomato shrink-0" />
              )}
              <div className="text-left truncate">
                <span className="block text-[9px] uppercase font-black text-brand-orange">
                  {activeLocation.source === "gps"
                    ? "GPS Detected"
                    : activeLocation.source === "saved"
                    ? "Saved Address"
                    : activeLocation.source === "manual"
                    ? "Delivery Location"
                    : "Choose Location"}
                </span>
                <span className="block text-xs font-bold text-brand-charcoal truncate">
                  {displayLocation}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-brand-orange font-black uppercase shrink-0 border border-brand-orange/30 px-2 py-0.5 rounded-lg bg-brand-orange/5">
              Change
            </span>
          </button>

          {/* Mobile Search Bar with Mode Toggle & Suggestions */}
          <div ref={mobileSearchRef} className="relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center w-full bg-white rounded-2xl shadow-2xs border border-brand-border/90 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSearchMode((prev) => (prev === "dish" ? "shop" : "dish"))
                  }
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-brand-surface text-[11px] font-black text-brand-charcoal border border-brand-border mr-1.5 shrink-0 cursor-pointer"
                >
                  {searchMode === "dish" ? (
                    <>
                      <UtensilsCrossed className="w-3 h-3 text-brand-orange" />
                      <span>Dishes</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-3 h-3 text-brand-orange" />
                      <span>Kitchens</span>
                    </>
                  )}
                  <ChevronDown className="w-2.5 h-2.5 text-brand-muted" />
                </button>

                <Search className="w-4 h-4 text-brand-muted shrink-0 mr-1.5" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                  }}
                  placeholder={
                    searchMode === "dish"
                      ? CRAVINGS_ROTATING_PLACEHOLDERS[placeholderIndex]
                      : "Search kitchens..."
                  }
                  className="w-full text-xs bg-transparent border-none focus:outline-none text-brand-charcoal placeholder:text-brand-muted/70 font-medium"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="p-1 text-xs text-brand-muted cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Mobile Dropdown */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-brand-border overflow-hidden z-50">
                <div className="divide-y divide-brand-border/50 max-h-60 overflow-y-auto">
                  {searchMode === "dish" ? (
                    dishSuggestions.map((dish) => (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => {
                          handleSuggestionClick(`/shops/${dish.shop_slug}`);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-brand-surface flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-brand-charcoal truncate">
                            {dish.name}
                          </p>
                          <p className="text-[10px] text-brand-muted truncate">
                            by {dish.shop_name}
                          </p>
                        </div>
                        <span className="font-black text-brand-charcoal shrink-0">
                          ₹{dish.base_price}
                        </span>
                      </button>
                    ))
                  ) : (
                    shopSuggestions.map((shop) => (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => {
                          handleSuggestionClick(`/shops/${shop.slug}`);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-brand-surface flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-brand-charcoal truncate">
                            {shop.name}
                          </p>
                          <p className="text-[10px] text-brand-muted truncate">
                            {shop.city}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          {shop.is_accepting_orders ? "Open" : "Closed"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2 text-xs font-bold text-brand-orange bg-brand-surface border-t border-brand-border cursor-pointer"
                >
                  View all results →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FDFBF7] border-b border-brand-border px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {user ? (
            <div className="space-y-2 pt-1">
              <div className="p-3.5 rounded-2xl bg-white border border-brand-border flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-charcoal text-white flex items-center justify-center text-sm font-black uppercase">
                    {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-charcoal">
                      {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.username}
                    </p>
                    <span className="text-[10px] font-extrabold uppercase text-brand-orange">
                      {user.role} Account
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-brand-tomato hover:underline cursor-pointer"
                >
                  Log Out
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-2xl bg-white border border-brand-border text-xs font-bold text-brand-charcoal flex items-center gap-2 hover:border-brand-orange shadow-2xs"
                >
                  <MapPin className="w-4 h-4 text-brand-orange" />
                  <span>My Addresses</span>
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-2xl bg-white border border-brand-border text-xs font-bold text-brand-charcoal flex items-center gap-2 hover:border-brand-orange shadow-2xs"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-tomato" />
                  <span>My Orders</span>
                </Link>
              </div>

              {user.role === "VENDOR" && (
                <Link
                  href="/vendor/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-black text-brand-charcoal hover:bg-amber-100 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-brand-orange" />
                      <span>Vendor Kitchen Dashboard</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-brand-orange" />
                  </div>
                </Link>
              )}

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-black text-purple-900 hover:bg-purple-100 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span>Master Admin Portal</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-700" />
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-2xl bg-brand-charcoal text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>Customer Sign In</span>
              </Link>
              <Link
                href="/vendor/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-2xl bg-white border border-brand-border text-brand-charcoal text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-surface shadow-2xs"
              >
                <Store className="w-4 h-4 text-brand-orange" />
                <span>Register as Kitchen Partner</span>
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-brand-border/60 flex items-center justify-around text-xs font-bold text-brand-muted">
            <Link
              href="/shops"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-charcoal"
            >
              All Kitchens
            </Link>
            <span>•</span>
            <Link
              href="/shops?type=dish"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-charcoal"
            >
              Explore Dishes
            </Link>
            <span>•</span>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-charcoal"
            >
              Cart
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
