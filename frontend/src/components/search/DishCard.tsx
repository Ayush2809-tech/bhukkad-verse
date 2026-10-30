"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SearchDishItem } from "@/types/search";
import { useCart } from "@/context/CartContext";
import { Clock, MapPin, Store, ArrowRight, CheckCircle2, Plus, Minus, ShoppingBag } from "lucide-react";

interface DishCardProps {
  dish: SearchDishItem;
}

export const DishCard: React.FC<DishCardProps> = ({ dish }) => {
  const isVeg = dish.dietary_type === "VEG" || dish.dietary_type === "VEGAN";
  const { items, addItem, updateQuantity } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    dish.variants?.find((v) => v.is_default) || dish.variants?.[0] || null
  );

  const cartItemId = selectedVariant
    ? `${dish.id}_${selectedVariant.id}`
    : `${dish.id}_base`;

  const cartItem = items.find((i) => i.id === cartItemId);
  const activePrice = selectedVariant ? selectedVariant.price : dish.base_price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      dishId: dish.id,
      name: dish.name,
      price: activePrice,
      dietaryType: dish.dietary_type,
      categoryName: dish.category_name,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      shopId: dish.shop_id,
      shopName: dish.shop_name,
      shopSlug: dish.shop_slug,
      imageUrl: dish.image_url,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-border/90 overflow-hidden hover:shadow-xl hover:border-brand-orange/40 transition-all flex flex-col justify-between group">
      <div className="p-5 sm:p-6 space-y-3.5">
        {/* Top Badges: Veg/Non-Veg & Kitchen Live Status */}
        <div className="flex items-center justify-between gap-2">
          {/* Dietary Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-4 h-4 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                isVeg ? "border-emerald-600 bg-emerald-50" : "border-rose-600 bg-rose-50"
              }`}
              title={dish.dietary_type}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVeg ? "bg-emerald-600" : "bg-rose-600"
                }`}
              />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-charcoal">
              {dish.category_name || "Specialty"}
            </span>
          </div>

          {/* Dish Availability */}
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              dish.is_available
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
            }`}
          >
            {dish.is_available ? "In Stock" : "Sold Out"}
          </span>
        </div>

        {/* Dish Title & Description */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-brand-charcoal group-hover:text-brand-orange transition-colors line-clamp-1">
            {dish.name}
          </h3>
          <p className="text-xs text-brand-muted line-clamp-2 mt-1 leading-relaxed">
            {dish.description || "Crafted fresh to order with authentic ingredients and spices."}
          </p>
        </div>

        {/* Variant Selector (if has variants) */}
        {dish.variants && dish.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {dish.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                  selectedVariant?.id === v.id
                    ? "bg-brand-charcoal text-white border-brand-charcoal shadow-2xs"
                    : "bg-brand-surface text-brand-charcoal border-brand-border hover:border-brand-orange"
                }`}
              >
                <span>{v.name}</span>
                <span className="ml-1 opacity-80">₹{v.price}</span>
              </button>
            ))}
          </div>
        )}

        {/* Price & Prep Time Row */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-brand-charcoal">
              ₹{activePrice}
            </span>
            {dish.compare_at_price && (
              <span className="text-xs text-brand-muted line-through">
                ₹{dish.compare_at_price}
              </span>
            )}
            {dish.has_variants && (
              <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-md">
                Custom Sizes
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-brand-muted font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>~{dish.preparation_time_minutes} mins</span>
          </div>
        </div>

        {/* Owning Kitchen Identity */}
        <div className="pt-3 border-t border-brand-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <Link
              href={`/shops/${dish.shop_slug}`}
              className="font-bold text-brand-charcoal hover:text-brand-orange flex items-center gap-1.5 truncate transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              <span className="truncate">{dish.shop_name}</span>
            </Link>

            {dish.distance_km !== null && dish.distance_km !== undefined && (
              <span className="text-[11px] font-black text-brand-charcoal shrink-0 bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border">
                📍 {dish.distance_km} km
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-brand-muted">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-brand-tomato shrink-0" />
              <span className="truncate">{dish.shop_address || dish.shop_city}</span>
            </div>

            {dish.is_deliverable !== null && dish.is_deliverable !== undefined && (
              dish.is_deliverable ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Delivers
                </span>
              ) : (
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                  Outside Radius
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Card Actions: Add to Cart & View Menu */}
      <div className="px-5 sm:px-6 py-3.5 bg-brand-surface/60 border-t border-brand-border/80 flex items-center justify-between gap-2">
        <Link
          href={`/shops/${dish.shop_slug}`}
          className="text-[11px] font-black text-brand-charcoal hover:text-brand-orange flex items-center gap-1 transition-colors truncate"
        >
          <span>Kitchen Menu</span>
          <ArrowRight className="w-3 h-3 shrink-0" />
        </Link>

        {/* Quick Add To Cart / Quantity Stepper */}
        {cartItem ? (
          <div className="flex items-center gap-2 bg-brand-charcoal text-white rounded-full px-2 py-1 shadow-xs">
            <button
              type="button"
              onClick={() => updateQuantity(cartItemId, -1)}
              className="p-1 hover:text-brand-orange transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-black px-1 min-w-[14px] text-center">
              {cartItem.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(cartItemId, 1)}
              className="p-1 hover:text-brand-orange transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!dish.is_available}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black shadow-xs transition-colors shrink-0 cursor-pointer ${
              dish.is_available
                ? "bg-brand-orange hover:bg-brand-tomato text-white"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD</span>
          </button>
        )}
      </div>
    </div>
  );
};
