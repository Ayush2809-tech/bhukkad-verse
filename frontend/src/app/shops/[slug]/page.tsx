"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import {
  Store,
  MapPin,
  Clock,
  Search,
  ChevronRight,
  Check,
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle,
  ShoppingBag,
  FileText,
  ExternalLink,
  Download,
  Star,
} from "lucide-react";

interface AddonChoice {
  id: string;
  name: string;
  price: string;
  is_available: boolean;
}

interface AddonGroupData {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  items: AddonChoice[];
}

interface VariantData {
  id: string;
  name: string;
  price: string;
  is_default: boolean;
  is_available: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  compare_at_price: string | null;
  image: string | null;
  image_url: string;
  dietary_type: "VEG" | "NON_VEG" | "VEGAN";
  preparation_time_minutes: number;
  is_available: boolean;
  has_variants: boolean;
  has_3d_model: boolean;
  model_3d_url: string;
  category_name: string;
  category_slug: string;
  variants: VariantData[];
  addon_groups: AddonGroupData[];
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  products: ProductItem[];
}

export interface OperatingHourItem {
  id: string;
  weekday: number;
  weekday_display: string;
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
  is_overnight: boolean;
}

export interface ShopLiveStatus {
  is_open: boolean;
  is_accepting_orders: boolean;
  status_code: string;
  status_display: string;
  next_opening_time: string | null;
  next_opening_day: string | null;
  pause_reason: string;
}

export interface PublicMenuCard {
  id: string;
  title: string;
  file_url: string;
  file_type: "PDF" | "JPEG" | "PNG";
  file_size_bytes: number;
  version: number;
  updated_at: string;
}

interface ShopMenuPayload {
  shop: {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo: string | null;
    banner: string | null;
    address_line: string;
    city: string;
    timezone?: string;
    opening_time: string;
    closing_time: string;
    delivery_radius_km: string;
    minimum_order_value: string;
    is_accepting_orders: boolean;
    order_pause_reason?: string;
    live_status?: ShopLiveStatus;
    operating_hours?: OperatingHourItem[];
    active_menu_card?: PublicMenuCard | null;
  };
  categories: MenuCategory[];
}

function ShopMenuContent() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [data, setData] = useState<ShopMenuPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart Integration
  const { items, addItem, updateQuantity, totalItems, grandTotal } = useCart();

  // Filters & Tabs
  const [menuTab, setMenuTab] = useState<"digital" | "card" | "reviews">("digital");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietFilter, setDietFilter] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Shop Reviews State
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewDish, setNewReviewDish] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const fetchShopReviews = async () => {
    if (!slug) return;
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/shops/${slug}/reviews/`);
      if (res.ok) {
        const data = await res.json();
        setShopReviews(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      // Graceful
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (menuTab === "reviews") {
      fetchShopReviews();
    }
  }, [menuTab, slug]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/shops/${slug}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: newReviewAuthor.trim() || "Food Enthusiast",
          product_name: newReviewDish.trim(),
          rating: newReviewRating,
          comment: newReviewComment.trim(),
        }),
      });
      if (res.ok) {
        setReviewNotice("Thank you! Your review has been published.");
        setNewReviewComment("");
        setNewReviewDish("");
        fetchShopReviews();
        setTimeout(() => setReviewNotice(null), 3000);
      }
    } catch {
      // Graceful
    } finally {
      setSubmittingReview(false);
    }
  };

  // Weekly Hours Modal State
  const [showHoursModal, setShowHoursModal] = useState(false);

  // Original Menu Card Modal State
  const [showMenuCardModal, setShowMenuCardModal] = useState(false);

  // Customization Modal State
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantData | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/v1/shops/${slug}/menu/`);
      if (res.ok) {
        const payload: ShopMenuPayload = await res.json();
        setData(payload);
      } else if (res.status === 404) {
        setError("This kitchen is currently not available or awaiting platform approval.");
      } else {
        setError("Unable to load kitchen menu. Please try again later.");
      }
    } catch {
      setError("Network error connecting to food marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchMenu();
    });
  }, [slug]);

  // Handle open modal
  const handleOpenCustomize = (product: ProductItem) => {
    setActiveProduct(product);
    // Select default variant if available, otherwise first variant
    if (product.has_variants && product.variants.length > 0) {
      const def = product.variants.find((v) => v.is_default) || product.variants[0];
      setSelectedVariant(def);
    } else {
      setSelectedVariant(null);
    }
    // Initialize addon selections
    const initialAddons: Record<string, string[]> = {};
    product.addon_groups.forEach((group) => {
      initialAddons[group.id] = [];
    });
    setSelectedAddons(initialAddons);
  };

  const handleToggleAddon = (groupId: string, itemId: string, maxSelections: number) => {
    setSelectedAddons((prev) => {
      const current = prev[groupId] || [];
      if (maxSelections === 1) {
        // Single choice toggle (radio-like)
        return {
          ...prev,
          [groupId]: current.includes(itemId) ? [] : [itemId],
        };
      }
      // Multiple choices toggle up to max
      if (current.includes(itemId)) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== itemId),
        };
      }
      if (current.length < maxSelections) {
        return {
          ...prev,
          [groupId]: [...current, itemId],
        };
      }
      return prev;
    });
  };

  // Calculate live modal total
  const calculateModalTotal = () => {
    if (!activeProduct) return "0.00";
    let base = selectedVariant
      ? parseFloat(selectedVariant.price)
      : parseFloat(activeProduct.base_price);

    // Sum chosen addons
    if (activeProduct.addon_groups) {
      activeProduct.addon_groups.forEach((group) => {
        const chosenIds = selectedAddons[group.id] || [];
        group.items.forEach((item) => {
          if (chosenIds.includes(item.id)) {
            base += parseFloat(item.price);
          }
        });
      });
    }
    return base.toFixed(2);
  };

  const handleConfirmCustomization = () => {
    if (!activeProduct || !data) return;
    const finalTotal = calculateModalTotal();
    const configSummary = selectedVariant ? `${selectedVariant.name}` : "";

    // Format chosen addons
    const formattedAddons: Record<string, string[]> = {};
    activeProduct.addon_groups.forEach((group) => {
      const chosenIds = selectedAddons[group.id] || [];
      const itemNames = group.items
        .filter((item) => chosenIds.includes(item.id))
        .map((item) => `${item.name} (+₹${item.price})`);
      if (itemNames.length > 0) {
        formattedAddons[group.name] = itemNames;
      }
    });

    addItem({
      dishId: activeProduct.id,
      name: activeProduct.name,
      price: parseFloat(finalTotal),
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      categoryName: activeProduct.category_name,
      shopId: data.shop.id,
      shopName: data.shop.name,
      shopSlug: data.shop.slug,
      dietaryType: activeProduct.dietary_type,
      imageUrl: activeProduct.image_url || activeProduct.image || undefined,
    });

    setAddedNotice(
      `Added "${activeProduct.name}${configSummary ? ` (${configSummary})` : ""}" to cart!`
    );
    setActiveProduct(null);
    setTimeout(() => setAddedNotice(null), 4000);
  };

  const handleDirectAdd = (product: ProductItem) => {
    if (!data) return;
    if (product.has_variants || product.addon_groups.some((g) => g.is_required)) {
      handleOpenCustomize(product);
      return;
    }

    addItem({
      dishId: product.id,
      name: product.name,
      price: parseFloat(product.base_price),
      categoryName: product.category_name,
      shopId: data.shop.id,
      shopName: data.shop.name,
      shopSlug: data.shop.slug,
      dietaryType: product.dietary_type,
      imageUrl: product.image_url || product.image || undefined,
    });

    setAddedNotice(`Added "${product.name}" to cart!`);
    setTimeout(() => setAddedNotice(null), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-xs font-bold text-brand-muted">Loading fresh kitchen menu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-surface mx-auto flex items-center justify-center text-brand-tomato">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-brand-charcoal">Kitchen Unavailable</h1>
        <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto">
          {error || "Shop not found."}
        </p>
        <Link
          href="/shops"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange"
        >
          <span>Browse All Kitchens</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const { shop, categories } = data;

  // Filter products by category, diet, and search
  const filteredCategories = categories
    .filter((cat) => selectedCategory === "all" || cat.slug === selectedCategory)
    .map((cat) => {
      const items = cat.products.filter((p) => {
        const matchesDiet =
          dietFilter === "ALL" ||
          (dietFilter === "VEG" && p.dietary_type === "VEG") ||
          (dietFilter === "NON_VEG" && p.dietary_type === "NON_VEG");
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDiet && matchesSearch;
      });
      return { ...cat, products: items };
    })
    .filter((cat) => cat.products.length > 0);

  return (
    <div className="min-h-screen pb-20">
      {/* Notice Banner */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-charcoal text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{addedNotice}</span>
          <button
            type="button"
            onClick={() => setAddedNotice(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Shop Hero Banner Header */}
      <section className="bg-gradient-to-b from-brand-surface via-brand-cream to-brand-cream border-b border-brand-border/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-2xl bg-white border border-brand-border flex items-center justify-center text-brand-orange shadow-xs">
                  <Store className="w-5 h-5" />
                </span>
                <div>
                  {(shop as any).tier && (
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1 ${
                        (shop as any).tier === "STREET_FOOD"
                          ? "bg-red-100 text-red-700"
                          : (shop as any).tier === "LUXURY_DINING"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {(shop as any).tier_display || "Fresh Neighborhood Eatery"}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
                    {shop.name}
                  </h1>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {shop.description || "Authentic culinary craftsmanship & fresh flavors."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-tomato" />
                  <span>{shop.address_line}, {shop.city}</span>
                </div>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowHoursModal(true)}
                  className="flex items-center gap-1.5 hover:text-brand-orange cursor-pointer transition-colors"
                  title="Click to view weekly operating schedule"
                >
                  <Clock className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Hours: {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}</span>
                  <span className="text-[10px] text-brand-orange font-black underline ml-1">Weekly Schedule</span>
                </button>
                <span>•</span>
                <span className="font-bold text-brand-charcoal">
                  Min. Order: ₹{shop.minimum_order_value}
                </span>

                {shop.active_menu_card && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setShowMenuCardModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 font-bold transition-all cursor-pointer text-xs shadow-xs"
                      title="View original printed menu card (PDF or photo)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Original Menu</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-orange text-white uppercase font-black tracking-wider">
                        {shop.active_menu_card.file_type}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 ${
                  shop.live_status?.status_code === "OPEN"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : !shop.is_accepting_orders || shop.live_status?.status_code === "PAUSED"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    shop.live_status?.status_code === "OPEN"
                      ? "bg-emerald-500 animate-pulse"
                      : !shop.is_accepting_orders || shop.live_status?.status_code === "PAUSED"
                      ? "bg-amber-500"
                      : "bg-gray-400"
                  }`}
                />
                <span>
                  {shop.live_status?.status_display ||
                    (shop.is_accepting_orders ? "Open For Orders" : "Kitchen Paused")}
                </span>
              </span>
              <span className="text-[11px] text-brand-muted">
                Delivery Radius: <strong>{shop.delivery_radius_km} km</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Kitchen Status Notice Banner if Not Accepting Orders */}
      {shop.live_status && !shop.live_status.is_accepting_orders && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2.5 text-xs font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {shop.live_status.status_code === "PAUSED"
                ? `Kitchen is currently paused (${shop.live_status.pause_reason || "temporarily not accepting orders"}). You can explore dishes and customize sizes, but orders cannot be placed at this moment.`
                : `Kitchen is currently closed (${shop.live_status.status_display}). You can explore dishes and check back during operating hours.`}
            </span>
          </div>
        </div>
      )}

      {/* Menu Navigation & Search Sub-bar */}
      <section className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Top Switcher: Interactive Digital Menu vs Original Kitchen Menu Card */}
          <div className="flex items-center gap-2 border-b border-brand-border/60 pb-2">
            <button
              type="button"
              onClick={() => setMenuTab("digital")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                menuTab === "digital"
                  ? "bg-brand-charcoal text-white shadow-xs"
                  : "bg-brand-surface text-brand-muted hover:text-brand-charcoal hover:bg-brand-border"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-orange" />
              <span>Interactive Digital Menu</span>
            </button>

            {shop.active_menu_card ? (
              <button
                type="button"
                onClick={() => setMenuTab("card")}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  menuTab === "card"
                    ? "bg-gradient-to-r from-brand-orange to-brand-tomato text-white shadow-xs"
                    : "bg-brand-surface text-brand-muted hover:text-brand-charcoal hover:bg-brand-border"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Original Printed Menu Card</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 text-white uppercase font-black">
                  {shop.active_menu_card.file_type}
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setMenuTab("reviews")}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                menuTab === "reviews"
                  ? "bg-amber-500 text-black shadow-xs font-black"
                  : "bg-brand-surface text-brand-muted hover:text-brand-charcoal hover:bg-brand-border"
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Reviews & Ratings ({shopReviews.length})</span>
            </button>
          </div>

          {menuTab === "digital" && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-colors ${
                    selectedCategory === "all"
                      ? "bg-brand-charcoal text-white shadow-xs"
                      : "bg-brand-surface hover:bg-brand-border text-brand-charcoal"
                  }`}
                >
                  Full Menu
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-brand-charcoal text-white shadow-xs"
                        : "bg-brand-surface hover:bg-brand-border text-brand-charcoal"
                    }`}
                  >
                    {cat.name} ({cat.products.length})
                  </button>
                ))}
              </div>

              {/* Diet Filter & Search */}
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                <div className="inline-flex rounded-full bg-brand-surface p-1 border border-brand-border text-xs">
                  <button
                    type="button"
                    onClick={() => setDietFilter("ALL")}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      dietFilter === "ALL" ? "bg-white text-brand-charcoal shadow-xs" : "text-brand-muted"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setDietFilter("VEG")}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      dietFilter === "VEG" ? "bg-emerald-600 text-white shadow-xs" : "text-brand-muted"
                    }`}
                  >
                    Veg Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setDietFilter("NON_VEG")}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      dietFilter === "NON_VEG" ? "bg-brand-tomato text-white shadow-xs" : "text-brand-muted"
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* VIEW A: ORIGINAL PHYSICAL MENU CARD */}
      {menuTab === "card" && shop.active_menu_card && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-brand-charcoal">
                    {shop.active_menu_card.title || `${shop.name} Menu`}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-black uppercase">
                    {shop.active_menu_card.file_type} • v{shop.active_menu_card.version}
                  </span>
                </div>
                <p className="text-xs text-brand-muted">
                  Official physical menu card uploaded directly by {shop.name} kitchen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={getMediaUrl(shop.active_menu_card.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-charcoal transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
              <a
                href={getMediaUrl(shop.active_menu_card.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-brand-orange to-brand-tomato hover:scale-105 text-white text-xs font-black uppercase transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Menu ({Math.round(shop.active_menu_card.file_size_bytes / 1024)} KB)</span>
              </a>
            </div>
          </div>

          {/* Full Viewer */}
          <div className="bg-white rounded-3xl border border-brand-border p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
            {shop.active_menu_card.file_type === "PDF" ? (
              <iframe
                src={getMediaUrl(shop.active_menu_card.file_url)}
                className="w-full h-[750px] rounded-2xl border border-brand-border bg-white shadow-inner"
                title={`${shop.name} Full Menu PDF`}
              />
            ) : (
              <div className="w-full flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(shop.active_menu_card.file_url)}
                  alt={`${shop.name} Menu Card`}
                  className="max-h-[850px] w-auto max-w-full rounded-2xl border border-brand-border shadow-md object-contain bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW C: CUSTOMER REVIEWS & RATINGS */}
      {menuTab === "reviews" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
          {/* Write a Review Card */}
          <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-black text-brand-charcoal mb-1">
              Review Your Food Experience at {shop.name}
            </h3>
            <p className="text-xs text-brand-muted mb-6">
              Rate the dishes, taste, and packaging. Verified reviews help local foodies make authentic choices.
            </p>

            <form onSubmit={handlePostReview} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-brand-charcoal mr-2">Your Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReviewRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= newReviewRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-brand-charcoal mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Food Lover"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-brand-charcoal mb-1">
                    Dish You Ordered (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samosa Chaat or Saffron Biryani"
                    value={newReviewDish}
                    onChange={(e) => setNewReviewDish(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-brand-charcoal mb-1">
                  Your Review & Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details on portion size, authentic spices, hot delivery, or your favorite flavor..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>

              {reviewNotice && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
                  {reviewNotice}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-3 rounded-2xl bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Publish Food Review</span>
              </button>
            </form>
          </div>

          {/* List of Verified Reviews */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-brand-charcoal">
              Customer Ratings ({shopReviews.length})
            </h4>

            {loadingReviews ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
              </div>
            ) : shopReviews.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-3xl border border-brand-border p-6 text-brand-muted text-xs font-bold">
                No reviews recorded yet for {shop.name}. Be the first customer to leave feedback!
              </div>
            ) : (
              <div className="space-y-4">
                {shopReviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-3xl border border-brand-border p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-brand-charcoal">
                          {rev.customer_name}
                        </span>
                        {rev.product_name && (
                          <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                            Ordered: {rev.product_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-gray-400 block">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: INTERACTIVE DIGITAL MENU */}
      {menuTab === "digital" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-brand-border p-8">
              <Search className="w-8 h-8 text-brand-muted mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">No Dishes Found</h3>
              <p className="text-xs text-brand-muted max-w-sm mx-auto">
                No menu items match your current category and dietary filters.
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="border-b border-brand-border pb-2 flex items-baseline justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-brand-charcoal tracking-tight">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-xs text-brand-muted mt-0.5">{category.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-brand-muted">
                    {category.products.length} {category.products.length === 1 ? "Item" : "Items"}
                  </span>
                </div>

                {/* Grid of Dishes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.products.map((product) => {
                    const hasCustomization =
                      product.has_variants || product.addon_groups.length > 0;
                    const priceDisplay =
                      product.has_variants && product.variants.length > 0
                        ? `₹${product.variants[0].price} - ₹${product.variants[product.variants.length - 1].price}`
                        : `₹${product.base_price}`;

                    const cartItem = items.find(
                      (i) => i.dishId === product.id && i.shopSlug === shop.slug
                    );

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-3xl border border-brand-border overflow-hidden transition-all flex flex-col justify-between hover:shadow-lg ${
                          !product.is_available ? "opacity-70 bg-gray-50" : ""
                        }`}
                      >
                        <div className="p-5 space-y-3">
                          {/* Top: Diet Badge & Sizing Indicator */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                                product.dietary_type === "VEG"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-red-50 text-red-700 border-red-300"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  product.dietary_type === "VEG" ? "bg-emerald-600" : "bg-red-600"
                                }`}
                              />
                              <span>{product.dietary_type}</span>
                            </span>

                            {product.has_variants && (
                              <span className="text-[10px] font-bold text-brand-orange bg-brand-surface px-2 py-0.5 rounded-md flex items-center gap-1">
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Sizes Available</span>
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h3 className="text-base font-black text-brand-charcoal">
                              {product.name}
                            </h3>
                            <p className="text-xs text-brand-muted line-clamp-2 mt-1 leading-relaxed">
                              {product.description || "Freshly cooked to order with signature ingredients."}
                            </p>
                          </div>

                          {/* Variants Preview Badges */}
                          {product.has_variants && product.variants.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {product.variants.map((v) => (
                                <span
                                  key={v.id}
                                  className="text-[10px] font-semibold bg-brand-cream border border-brand-border px-2 py-0.5 rounded-lg text-brand-charcoal"
                                >
                                  {v.name} ₹{v.price}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Add-on preview */}
                          {product.addon_groups.length > 0 && (
                            <p className="text-[10px] text-brand-muted truncate">
                              Customizations:{" "}
                              <strong className="text-brand-charcoal">
                                {product.addon_groups.map((g) => g.name).join(", ")}
                              </strong>
                            </p>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="px-5 py-3.5 bg-brand-surface/40 border-t border-brand-border/80 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-black text-brand-charcoal">
                              {priceDisplay}
                            </span>
                          </div>

                          {!product.is_available ? (
                            <span className="px-3 py-1.5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                              Sold Out Today
                            </span>
                          ) : cartItem && !hasCustomization ? (
                            <div className="flex items-center gap-2 bg-brand-charcoal text-white px-2.5 py-1 rounded-full shadow-xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center font-black hover:text-brand-orange cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-black min-w-[14px] text-center">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center font-black hover:text-brand-orange cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                hasCustomization ? handleOpenCustomize(product) : handleDirectAdd(product)
                              }
                              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                            >
                              <span>{hasCustomization ? "Customize" : "Add +"}</span>
                              {cartItem && hasCustomization && (
                                <span className="w-2 h-2 rounded-full bg-brand-orange" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating Bottom Cart Pill when Items Present */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-full bg-brand-charcoal/95 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-white/20 flex items-center justify-between backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <p className="text-xs font-bold text-zinc-300">
              {totalItems} {totalItems === 1 ? "dish" : "dishes"} from {shop.name}
            </p>
            <p className="text-sm font-black text-brand-amber">
              ₹{grandTotal.toFixed(2)}{" "}
              <span className="text-[10px] text-zinc-400 font-normal">incl. taxes</span>
            </p>
          </div>
          <Link
            href="/cart"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-orange to-brand-tomato hover:from-brand-amber hover:to-brand-orange text-white text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Cart</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Interactive Customization Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-brand-border p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-brand-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-orange">
                  {activeProduct.category_name}
                </span>
                <h2 className="text-xl font-black text-brand-charcoal">
                  {activeProduct.name}
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  {activeProduct.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="p-1.5 rounded-full hover:bg-brand-surface text-brand-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sizing / Variant Selection */}
            {activeProduct.has_variants && activeProduct.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-brand-charcoal tracking-wide">
                    Choose Size / Variant
                  </h3>
                  <span className="text-[10px] font-extrabold text-brand-tomato bg-brand-tomato/10 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                </div>

                <div className="space-y-2">
                  {activeProduct.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedVariant?.id === variant.id
                          ? "border-brand-orange bg-brand-orange/5"
                          : "border-brand-border hover:bg-brand-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="variant_option"
                          checked={selectedVariant?.id === variant.id}
                          onChange={() => setSelectedVariant(variant)}
                          className="accent-brand-orange w-4 h-4"
                        />
                        <span className="text-xs font-bold text-brand-charcoal">
                          {variant.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-brand-charcoal">
                        ₹{variant.price}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Add-on Groups Selection */}
            {activeProduct.addon_groups.map((group) => (
              <div key={group.id} className="space-y-3 pt-3 border-t border-brand-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-brand-charcoal tracking-wide">
                      {group.name}
                    </h3>
                    <p className="text-[11px] text-brand-muted">
                      {group.max_selections === 1
                        ? "Select up to 1 option"
                        : `Select up to ${group.max_selections} options`}
                    </p>
                  </div>
                  {group.is_required && (
                    <span className="text-[10px] font-extrabold text-brand-tomato bg-brand-tomato/10 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isSelected = (selectedAddons[group.id] || []).includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-brand-orange bg-brand-orange/5"
                            : "border-brand-border hover:bg-brand-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={group.max_selections === 1 ? "radio" : "checkbox"}
                            name={`addon_${group.id}`}
                            checked={isSelected}
                            onChange={() =>
                              handleToggleAddon(group.id, item.id, group.max_selections)
                            }
                            className="accent-brand-orange w-4 h-4"
                          />
                          <span className="text-xs font-semibold text-brand-charcoal">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-brand-muted">
                          +₹{item.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Modal Total & Confirm Button */}
            <div className="pt-4 border-t border-brand-border flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-bold block">
                  Configured Total
                </span>
                <span className="text-xl font-black text-brand-charcoal">
                  ₹{calculateModalTotal()}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmCustomization}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-md transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Item to Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Operating Hours Modal */}
      {showHoursModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-brand-charcoal/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface/40">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-orange" />
                <h2 className="text-base font-black text-brand-charcoal">
                  Weekly Operating Schedule
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHoursModal(false)}
                className="p-1 rounded-full text-brand-muted hover:text-brand-charcoal cursor-pointer"
                aria-label="Close hours schedule"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-brand-muted">
                {shop.name} serves customers during the following weekly hours in{" "}
                <strong>{shop.timezone || "Asia/Kolkata"}</strong> local time:
              </p>

              <div className="divide-y divide-brand-border/60 border border-brand-border rounded-2xl overflow-hidden bg-brand-cream/30">
                {(shop.operating_hours && shop.operating_hours.length > 0
                  ? shop.operating_hours
                  : [0, 1, 2, 3, 4, 5, 6].map((w) => ({
                      id: String(w),
                      weekday: w,
                      weekday_display: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ][w],
                      is_closed: false,
                      opening_time: shop.opening_time,
                      closing_time: shop.closing_time,
                      is_overnight: shop.closing_time < shop.opening_time,
                    }))
                ).map((oh) => {
                  return (
                    <div
                      key={oh.weekday}
                      className="px-4 py-3 flex items-center justify-between text-xs"
                    >
                      <span className="font-black text-brand-charcoal w-28">
                        {oh.weekday_display ||
                          [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ][oh.weekday]}
                      </span>

                      <div>
                        {oh.is_closed ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            Closed All Day
                          </span>
                        ) : (
                          <span className="font-bold text-brand-charcoal">
                            {oh.opening_time ? oh.opening_time.slice(0, 5) : "10:00"} -{" "}
                            {oh.closing_time ? oh.closing_time.slice(0, 5) : "23:00"}
                            {oh.is_overnight && (
                              <span className="text-[10px] text-indigo-700 ml-1.5 font-bold">
                                🌙 Overnight
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHoursModal(false)}
                  className="px-5 py-2 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Menu Card Modal */}
      {showMenuCardModal && shop.active_menu_card && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-brand-border overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-cream/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-brand-charcoal">
                      {shop.active_menu_card.title || `${shop.name} Menu`}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase">
                      {shop.active_menu_card.file_type} • v{shop.active_menu_card.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Official physical menu card verified by {shop.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getMediaUrl(shop.active_menu_card.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-charcoal transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowMenuCardModal(false)}
                  className="p-2 rounded-xl text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-brand-cream/30 flex items-center justify-center min-h-[350px]">
              {shop.active_menu_card.file_type === "PDF" ? (
                <div className="w-full h-full flex flex-col items-center">
                  <iframe
                    src={getMediaUrl(shop.active_menu_card.file_url)}
                    className="w-full h-[62vh] rounded-2xl border border-brand-border shadow-xs bg-white"
                    title={`${shop.name} Original Menu PDF`}
                  />
                  <p className="text-xs text-brand-muted mt-3 text-center">
                    Having trouble viewing the PDF preview?{" "}
                    <a
                      href={getMediaUrl(shop.active_menu_card.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-orange font-bold underline hover:text-brand-tomato"
                    >
                      Click here to open directly
                    </a>
                  </p>
                </div>
              ) : (
                <div className="max-h-[68vh] flex flex-col items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(shop.active_menu_card.file_url)}
                    alt={`${shop.name} Original Menu Card`}
                    className="max-h-[62vh] w-auto max-w-full rounded-2xl border border-brand-border shadow-md object-contain bg-white"
                  />
                  <p className="text-xs text-brand-muted mt-2 text-center">
                    Original restaurant menu photo • Pinch or zoom to inspect items
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-border bg-white flex items-center justify-between">
              <a
                href={getMediaUrl(shop.active_menu_card.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-brand-tomato transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Menu ({Math.round(shop.active_menu_card.file_size_bytes / 1024)} KB)</span>
              </a>
              <button
                type="button"
                onClick={() => setShowMenuCardModal(false)}
                className="px-5 py-2 rounded-xl bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-charcoal/90 transition-colors shadow-xs cursor-pointer"
              >
                Close & Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-xs font-bold text-brand-muted">Loading fresh kitchen menu...</p>
        </div>
      }
    >
      <ShopMenuContent />
    </Suspense>
  );
}
