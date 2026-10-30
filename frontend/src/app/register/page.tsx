"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { MobileOtpModal } from "@/components/auth/MobileOtpModal";
import {
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  LogIn,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "CUSTOMER",
  });

  const [error, setError] = useState<string | null>(null);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // If already logged in, route to appropriate experience
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "VENDOR") router.push("/vendor/dashboard");
      else if (user.role === "ADMIN") router.push("/admin");
      else router.push("/");
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) {
      setError(null);
      setIsDuplicateEmail(false);
    }
  };

  const executeRegistration = async () => {
    setError(null);
    setIsDuplicateEmail(false);
    setSubmitting(true);

    const res = await register(formData);
    setSubmitting(false);

    if (res.success) {
      router.push("/");
    } else {
      const err = res.error || "Registration failed. Please check the fields.";
      setError(err);
      if (err.toLowerCase().includes("email already exists")) {
        setIsDuplicateEmail(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number for order notifications.");
      return;
    }

    if (!isPhoneVerified) {
      setOtpModalOpen(true);
      return;
    }

    executeRegistration();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-brand-border shadow-xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo variant="header" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-[11px] font-extrabold text-brand-orange uppercase">
            <Sparkles className="w-3.5 h-3.5 text-brand-amber fill-brand-amber" />
            <span>Join The Food-Verse</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-charcoal tracking-tight">
            Create Customer Account
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted">
            Order from 50+ local independent kitchens, save delivery addresses, and track orders live.
          </p>
        </div>

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
                <span className="font-bold text-brand-charcoal">Already registered with us?</span>
                <Link
                  href={`/login?redirect=/`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-tomato text-white text-xs font-bold hover:bg-brand-charcoal transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Log In Instead</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                required
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Aarav"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                required
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Sharma"
                className="w-full px-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="tasty_foodie"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="aarav@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                minLength={8}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-brand-border text-center text-xs text-brand-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-orange hover:underline">
            Sign in here
          </Link>
        </div>

        {/* Mobile SMS OTP Verification Modal */}
        <MobileOtpModal
          isOpen={otpModalOpen}
          phoneNumber={formData.phone}
          onVerified={() => {
            setIsPhoneVerified(true);
            setOtpModalOpen(false);
            executeRegistration();
          }}
          onClose={() => setOtpModalOpen(false)}
        />
      </div>
    </div>
  );
}
