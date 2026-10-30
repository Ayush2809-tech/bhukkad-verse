"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PackageCheck,
  ChefHat,
  Bike,
  Home,
  CheckCircle2,
  Clock,
  Phone,
  ChevronLeft,
  Sparkles,
  Loader2,
  Store,
  MapPin,
  Receipt,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrderCommunicationModal } from "@/components/orders/OrderCommunicationModal";

interface OrderTrackingData {
  order_number: string;
  shop_name: string;
  shop_slug: string;
  shop_tier: string;
  shop_phone: string;
  status: "PLACED" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  payment_method: string;
  subtotal: string | number;
  platform_fee: string | number;
  delivery_fee: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  customer_name: string;
  customer_phone: string;
  delivery_address_line: string;
  estimated_delivery_minutes: number;
  delivery_partner_name: string;
  delivery_partner_phone: string;
  items: Array<{
    id: string;
    dish_name: string;
    quantity: number;
    unit_price: string | number;
    total_price: string | number;
    dietary_type: string;
    variant_name?: string;
  }>;
  created_at: string;
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("id");
  const { user, token } = useAuth();

  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupId, setLookupId] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderIdFromUrl) {
        // Try fetching customer's latest order from API if logged in
        if (token) {
          try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/orders/my-orders/", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const list = await res.json();
              if (Array.isArray(list) && list.length > 0) {
                setOrder(list[0]);
                setLoading(false);
                return;
              }
            }
          } catch {
            // Ignored
          }
        }
        setOrder(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/orders/track/${orderIdFromUrl}/`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setOrder(null);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderIdFromUrl, token]);

  // Stepper calculations
  const getStatusStepIndex = (status: OrderTrackingData["status"]) => {
    switch (status) {
      case "PLACED":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PREPARING":
        return 1;
      case "OUT_FOR_DELIVERY":
        return 2;
      case "DELIVERED":
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    { title: "Order Confirmed", desc: "Sent to kitchen partner", icon: PackageCheck },
    { title: "Chef Cooking Fresh", desc: "Simmering on the tawa", icon: ChefHat },
    { title: "Out for Delivery", desc: "Partner speeding to you", icon: Bike },
    { title: "Delivered", desc: "Enjoy your hot meal", icon: Home },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-xs font-bold text-brand-muted">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <span>Tracking your culinary journey...</span>
        </div>
      </div>
    );
  }

  // Honest Empty State: No active dummy data
  if (!order) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-brand-border p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange mx-auto flex items-center justify-center border border-brand-orange/20">
            <PackageCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-brand-charcoal">
              No Active Order Found
            </h1>
            <p className="text-xs text-brand-muted leading-relaxed">
              You don&apos;t have any ongoing order delivery right now. Place an order to track your food preparation in real time!
            </p>
          </div>

          {/* Lookup real order */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (lookupId.trim()) {
                window.location.href = `/orders?id=${lookupId.trim().toUpperCase()}`;
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Enter Order ID (e.g. BV-2026-XXXXXX)"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="flex-1 uppercase font-black text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-brand-charcoal"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors cursor-pointer"
            >
              Track
            </button>
          </form>

          <div className="pt-2">
            <Link
              href="/shops"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black transition-colors shadow-md"
            >
              <span>Explore Kitchens &amp; Dishes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStepIndex(order.status);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-black text-brand-muted hover:text-brand-orange uppercase tracking-wider transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Food Universe</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-brand-orange tracking-widest block">
              Live Order Pulse
            </span>
            <h1 className="text-3xl font-black text-brand-charcoal">
              Order #{order.order_number}
            </h1>
            <p className="text-xs text-brand-muted font-medium flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-brand-orange" />
              <span>
                Prepared fresh by{" "}
                <strong className="text-brand-charcoal">{order.shop_name}</strong>
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-orange" />
              <span>Chat with Kitchen / Rider</span>
            </button>

            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs font-black text-emerald-800">
                Estimated Arrival: ~{order.estimated_delivery_minutes} Mins
              </span>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Stepper */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-brand-charcoal">
              Live Delivery Journey
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {order.payment_status === "PAID" ? "Payment Confirmed (Paid)" : "Cash On Delivery"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={s.title}
                  className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-2 ${
                    isCurrent
                      ? "bg-brand-orange/10 border-brand-orange shadow-md scale-105"
                      : isPast
                      ? "bg-emerald-50/70 border-emerald-300"
                      : "bg-brand-surface/40 border-brand-border opacity-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? "bg-brand-orange text-white animate-bounce"
                        : isPast
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-brand-charcoal">{s.title}</h3>
                    <p className="text-[10px] text-brand-muted">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Driver Info */}
          <div className="pt-6 border-t border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-charcoal">
                <Bike className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-brand-muted block">
                  Assigned Delivery Partner
                </span>
                <span className="text-xs font-black text-brand-charcoal">
                  {order.delivery_partner_name}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black transition-colors shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Order Chat</span>
              </button>

              <a
                href={`tel:${order.delivery_partner_phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Rider ({order.delivery_partner_phone})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Order Items & Bill Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dishes */}
          <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-charcoal">
              Ordered Cravings ({order.items.length})
            </h2>
            <div className="divide-y divide-brand-border/60">
              {order.items.map((it) => (
                <div key={it.id || it.dish_name} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-brand-charcoal block">
                      {it.quantity}x {it.dish_name}
                    </span>
                    {it.variant_name && (
                      <span className="text-[10px] text-brand-muted">{it.variant_name}</span>
                    )}
                  </div>
                  <span className="font-black text-brand-charcoal">₹{it.total_price}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs font-black">
              <span>Total Paid</span>
              <span className="text-brand-orange text-sm">₹{order.total_amount}</span>
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-charcoal">
              Delivery Destination
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-brand-charcoal block">
                    {order.customer_name} ({order.customer_phone})
                  </span>
                  <p className="text-brand-muted leading-relaxed mt-0.5">
                    {order.delivery_address_line}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-charcoal">
                  Payment Status:
                </span>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {order.payment_status} ({order.payment_method})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Order Communication Modal (Kitchen & Rider) */}
        <OrderCommunicationModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          orderNumber={order.order_number}
          shopName={order.shop_name}
          shopPhone={order.shop_phone}
          riderName={order.delivery_partner_name}
          riderPhone={order.delivery_partner_phone}
          orderStatus={order.status}
        />
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
