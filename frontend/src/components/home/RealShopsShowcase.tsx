"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useLocation } from "@/context/LocationContext";
import {
  Store,
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";

interface PublicShop {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  opening_time: string;
  closing_time: string;
  delivery_radius_km: string;
  minimum_order_value: string;
  is_accepting_orders: boolean;
  distance_km?: number | null;
  is_deliverable?: boolean | null;
}

export function RealShopsShowcase() {
  const { coordinates } = useLocation();
  const [shops, setShops] = useState<PublicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRealShops = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = new URL(`${API_BASE_URL}/v1/shops/`);
        if (coordinates?.lat && coordinates?.lng) {
          url.searchParams.set("lat", coordinates.lat.toString());
          url.searchParams.set("lng", coordinates.lng.toString());
        }
        const res = await fetch(url.toString());
        if (res.ok) {
          const data: PublicShop[] = await res.json();
          if (isMounted) setShops(data);
        } else {
          if (isMounted) setError("Could not load partner kitchens.");
        }
      } catch {
        if (isMounted) setError("Network error connecting to kitchens API.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRealShops();
    return () => {
      isMounted = false;
    };
  }, [coordinates]);


  return (
    <section className="py-16 bg-white border-y border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-brand-tomato">
              Verified Independent Kitchens
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-brand-charcoal tracking-tight mt-1">
              Real Food Crafted by Real Chefs
            </h2>
            <p className="text-sm sm:text-base text-brand-muted mt-2">
              Browse approved local cloud kitchens, artisan bakers, and culinary creators. Every kitchen manages its own fresh recipes, size variants, and customization options.
            </p>
          </div>

          <Link
            href="/shops"
            className="inline-flex items-center gap-2 text-xs font-black text-brand-charcoal hover:text-brand-orange transition-colors self-start md:self-auto"
          >
            <span>Browse All Kitchens</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
            <p className="text-xs font-bold text-brand-muted">
              Discovering active partner kitchens...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-brand-surface border border-brand-border text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-brand-tomato mx-auto" />
            <h3 className="text-sm font-black text-brand-charcoal">
              Could not retrieve active kitchens
            </h3>
            <p className="text-xs text-brand-muted">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && shops.length === 0 && (
          <div className="py-16 px-6 rounded-3xl bg-brand-surface border border-brand-border text-center max-w-xl mx-auto space-y-4">
            <Store className="w-12 h-12 text-brand-orange mx-auto" />
            <h3 className="text-lg font-black text-brand-charcoal">
              No Kitchens Active Right Now
            </h3>
            <p className="text-xs text-brand-muted max-w-md mx-auto">
              Partner kitchens are undergoing onboarding verification. Check back shortly or apply to register your food kitchen.
            </p>
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors"
            >
              <span>Register as a Food Partner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Real Kitchens Grid */}
        {!loading && !error && shops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-brand-cream/60 rounded-3xl border border-brand-border overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="p-6 space-y-4">
                  {/* Top: Status Badges */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Kitchen</span>
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        shop.is_accepting_orders
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {shop.is_accepting_orders ? "Open For Orders" : "Kitchen Paused"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-black text-brand-charcoal group-hover:text-brand-orange transition-colors">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-brand-muted line-clamp-2 mt-1 leading-relaxed">
                      {shop.description || "Authentic culinary craftsmanship & fresh flavors prepared to order."}
                    </p>
                  </div>

                  {/* Address & Operational Specs */}
                  <div className="space-y-2 pt-2 border-t border-brand-border/60 text-xs text-brand-muted">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-tomato shrink-0" />
                        <span className="truncate">
                          {shop.address_line}, {shop.city} - {shop.postal_code}
                        </span>
                      </div>
                      {shop.distance_km !== undefined && shop.distance_km !== null && (
                        <span className="text-[11px] font-black text-brand-charcoal shrink-0 bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border">
                          📍 {shop.distance_km} km
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        <span>
                          {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                        </span>
                        <span>•</span>
                        <span>Radius: {shop.delivery_radius_km} km</span>
                      </div>
                      {shop.is_deliverable === true && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Delivers
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-bold text-brand-charcoal pt-1">
                      Min. Order: ₹{shop.minimum_order_value}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 bg-white border-t border-brand-border/80 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-charcoal flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Variants & Add-ons</span>
                  </span>

                  <Link
                    href={`/shops/${shop.slug}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors"
                  >
                    <span>View Menu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
