"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { MobileOtpModal } from "@/components/auth/MobileOtpModal";
import {
  Store,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  LogIn,
} from "lucide-react";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, registerVendor } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: User account
  const [accountData, setAccountData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "VENDOR",
  });

  // Step 2: Shop Kitchen details
  const [shopData, setShopData] = useState({
    name: "",
    tier: "FRESH_KITCHEN" as "STREET_FOOD" | "LUXURY_DINING" | "FRESH_KITCHEN",
    description: "",
    phone: "",
    email: "",
    address_line: "",
    city: "New Delhi",
    postal_code: "110001",
    opening_time: "10:00",
    closing_time: "23:00",
    delivery_radius_km: "8.0",
    minimum_order_value: "99.0",
  });

  const [error, setError] = useState<string | null>(null);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // Handle existing authenticated user state
  useEffect(() => {
    if (!authLoading && user) {
      queueMicrotask(() => {
        if (user.role === "VENDOR") {
          if (user.has_shop) {
            router.push("/vendor/dashboard");
          } else {
            // Vendor account exists but shop onboarding incomplete: skip to Step 2!
            setStep(2);
            setShopData((prev) => ({
              ...prev,
              email: prev.email || user.email,
              phone: prev.phone || user.phone || "",
            }));
          }
        } else if (user.role === "ADMIN") {
          router.push("/admin");
        }
      });
    }
  }, [user, authLoading, router]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) {
      setError(null);
      setIsDuplicateEmail(false);
    }
  };

  const handleShopChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setShopData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) {
      setError(null);
    }
  };

  const handleProceedToShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountData.username || !accountData.email || !accountData.password) {
      setError("Please fill out all required account fields.");
      return;
    }
    setError(null);
    setIsDuplicateEmail(false);
    // Pre-fill shop contact if empty
    setShopData((prev) => ({
      ...prev,
      email: prev.email || accountData.email,
      phone: prev.phone || accountData.phone,
    }));
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDuplicateEmail(false);
    setSubmitting(true);

    // Scenario A: User is ALREADY authenticated as a VENDOR without a shop
    if (user && user.role === "VENDOR" && token) {
      try {
        const shopRes = await fetch(`${API_BASE_URL}/v1/vendor/shop/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(shopData),
        });

        const data = await shopRes.json();
        setSubmitting(false);

        if (shopRes.ok) {
          router.push("/vendor/dashboard");
        } else {
          const errorList: string[] = [];
          for (const [k, v] of Object.entries(data)) {
            errorList.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
          }
          setError(errorList.join(" | ") || "Failed to submit shop application.");
        }
      } catch {
        setSubmitting(false);
        setError("Network error submitting shop application.");
      }
      return;
    }

    // Scenario B: New Vendor Registration (Atomically creates user and shop)
    if (!isPhoneVerified) {
      setSubmitting(false);
      setOtpModalOpen(true);
      return;
    }

    const combinedPayload = {
      username: accountData.username.trim(),
      email: accountData.email.trim().toLowerCase(),
      password: accountData.password,
      first_name: accountData.first_name.trim(),
      last_name: accountData.last_name.trim(),
      phone: accountData.phone.trim(),
      shop_name: shopData.name.trim(),
      shop_tier: shopData.tier,
      shop_description: shopData.description.trim(),
      shop_phone: (shopData.phone || accountData.phone).trim(),
      shop_email: (shopData.email || accountData.email).trim().toLowerCase(),
      shop_address_line: shopData.address_line.trim(),
      shop_city: shopData.city.trim(),
      shop_postal_code: shopData.postal_code.trim(),
      opening_time: shopData.opening_time.length === 5 ? `${shopData.opening_time}:00` : shopData.opening_time,
      closing_time: shopData.closing_time.length === 5 ? `${shopData.closing_time}:00` : shopData.closing_time,
      delivery_radius_km: shopData.delivery_radius_km,
      minimum_order_value: shopData.minimum_order_value,
    };

    const regRes = await registerVendor(combinedPayload);
    setSubmitting(false);

    if (regRes.success) {
      router.push("/vendor/dashboard");
    } else {
      const errMsg = regRes.error || "Failed to create vendor account and shop.";
      setError(errMsg);
      if (errMsg.toLowerCase().includes("email already exists")) {
        setIsDuplicateEmail(true);
      }
    }
  };

  return (
    <div className="min-h-[90vh] py-12 px-4 sm:px-6 lg:px-8 bg-brand-surface/40">
      <div className="max-w-2xl mx-auto space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-brand-border shadow-xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo variant="header" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-tomato/10 text-brand-tomato text-xs font-black tracking-wide uppercase">
            <Store className="w-3.5 h-3.5" />
            <span>Kitchen Partner Program</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
            Register Your Restaurant Shop
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted max-w-lg mx-auto">
            Sell directly to thousands of hungry foodies with isolated vendor dashboards, custom menus, and transparent commissions.
          </p>
        </div>

        {/* Existing Vendor Account Banner */}
        {user && user.role === "VENDOR" && !user.has_shop && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">
                Logged in as vendor partner: <span className="font-black text-brand-charcoal">{user.username}</span> ({user.email})
              </p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Complete your restaurant details below to register your kitchen.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-200/60 font-black text-[10px] uppercase shrink-0">
              Step 2 of 2
            </span>
          </div>
        )}

        {/* Stepper indicator */}
        {(!user || user.role !== "VENDOR") && (
          <div className="flex items-center justify-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
                step === 1
                  ? "bg-brand-charcoal text-white"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span>1. Vendor Account</span>
              {step === 2 && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
            <div className="w-8 h-0.5 bg-brand-border" />
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
                step === 2
                  ? "bg-brand-charcoal text-white"
                  : "bg-brand-surface text-brand-muted"
              }`}
            >
              <span>2. Shop Details</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-tomato/10 border border-brand-tomato/20 text-brand-tomato text-xs leading-relaxed"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {isDuplicateEmail && (
              <div className="pt-2 border-t border-brand-tomato/20 flex items-center justify-between">
                <span className="font-bold text-brand-charcoal">Already have an account?</span>
                <Link
                  href="/login?redirect=/vendor/register"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-tomato text-white text-xs font-bold hover:bg-brand-charcoal transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Log In to Link Shop</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Vendor Account Details */}
        {step === 1 && (
          <form onSubmit={handleProceedToShop} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  name="first_name"
                  value={accountData.first_name}
                  onChange={handleAccountChange}
                  placeholder="Vikram"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  name="last_name"
                  value={accountData.last_name}
                  onChange={handleAccountChange}
                  placeholder="Singh"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Vendor Username
              </label>
              <input
                type="text"
                required
                name="username"
                value={accountData.username}
                onChange={handleAccountChange}
                placeholder="chef_vikram"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Owner Email Address
              </label>
              <input
                type="email"
                required
                name="email"
                value={accountData.email}
                onChange={handleAccountChange}
                placeholder="vikram@kitchens.local"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Owner Mobile Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={accountData.phone}
                onChange={handleAccountChange}
                placeholder="+91 98111 22233"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Password (min. 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                name="password"
                value={accountData.password}
                onChange={handleAccountChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Continue to Kitchen Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Shop Details */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Restaurant / Shop Name
              </label>
              <input
                type="text"
                required
                name="name"
                value={shopData.name}
                onChange={handleShopChange}
                placeholder="e.g. Royal Punjab Dhaba & Grill"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-2">
                Choose Kitchen Experience Universe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "STREET_FOOD",
                    name: "Street Food & Carts",
                    badge: "₹ Budget Delights",
                    desc: "Samosas, chaat, rolls, street carts",
                    icon: "🌶️",
                  },
                  {
                    id: "LUXURY_DINING",
                    name: "Luxury Fine Dining",
                    badge: "5★ Royal Gourmet",
                    desc: "Artisanal chefs, saffron dum, elite hotels",
                    icon: "👑",
                  },
                  {
                    id: "FRESH_KITCHEN",
                    name: "Fresh Eatery",
                    badge: "Daily Fresh",
                    desc: "Homestyle curries, dals, cloud kitchens",
                    icon: "🍲",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setShopData({ ...shopData, tier: t.id as any })}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      shopData.tier === t.id
                        ? "border-brand-orange bg-amber-50/70 shadow-sm"
                        : "border-brand-border bg-white hover:border-brand-orange/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{t.icon}</span>
                      <span className="text-xs font-black text-brand-charcoal">{t.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-orange block">{t.badge}</span>
                    <p className="text-[10px] text-brand-muted mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Kitchen Specialties & Description
              </label>
              <textarea
                rows={3}
                name="description"
                value={shopData.description}
                onChange={handleShopChange}
                placeholder="Authentic clay-oven tandoori chicken, dal makhani, and garlic naans crafted fresh daily."
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Kitchen Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={shopData.phone}
                  onChange={handleShopChange}
                  placeholder="+91 98111 22233"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Order Notification Email
                </label>
                <input
                  type="email"
                  required
                  name="email"
                  value={shopData.email}
                  onChange={handleShopChange}
                  placeholder="orders@royalpunjab.in"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                Commercial Address (Street & Shop Number)
              </label>
              <input
                type="text"
                required
                name="address_line"
                value={shopData.address_line}
                onChange={handleShopChange}
                placeholder="Shop 14, Main Market, Block C"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  name="city"
                  value={shopData.city}
                  onChange={handleShopChange}
                  placeholder="New Delhi"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Postal PIN Code
                </label>
                <input
                  type="text"
                  required
                  name="postal_code"
                  value={shopData.postal_code}
                  onChange={handleShopChange}
                  placeholder="110001"
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Daily Opening Time
                </label>
                <input
                  type="time"
                  required
                  name="opening_time"
                  value={shopData.opening_time}
                  onChange={handleShopChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Daily Closing Time
                </label>
                <input
                  type="time"
                  required
                  name="closing_time"
                  value={shopData.closing_time}
                  onChange={handleShopChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Delivery Radius (KM)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  required
                  name="delivery_radius_km"
                  value={shopData.delivery_radius_km}
                  onChange={handleShopChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  name="minimum_order_value"
                  value={shopData.minimum_order_value}
                  onChange={handleShopChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-sm text-brand-charcoal font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {(!user || user.role !== "VENDOR") && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-full border border-brand-border text-xs font-bold text-brand-charcoal hover:bg-brand-surface cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Submit Shop Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Existing login link */}
        <div className="pt-4 border-t border-brand-border text-center text-xs text-brand-muted">
          Already registered as a vendor?{" "}
          <Link href="/login" className="font-bold text-brand-orange hover:underline">
            Sign in to your dashboard
          </Link>
        </div>

        {/* Mobile SMS OTP Verification Modal */}
        <MobileOtpModal
          isOpen={otpModalOpen}
          phoneNumber={accountData.phone || shopData.phone}
          onVerified={() => {
            setIsPhoneVerified(true);
            setOtpModalOpen(false);
            // Re-trigger final submit with verified state
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            setTimeout(() => {
              handleFinalSubmit(fakeEvent);
            }, 100);
          }}
          onClose={() => setOtpModalOpen(false)}
        />
      </div>
    </div>
  );
}
