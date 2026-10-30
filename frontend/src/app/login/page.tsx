"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await login(identifier, password);
    setSubmitting(false);

    if (res.success && res.user) {
      // Role-Based Explicit Dashboard & Experience Routing
      if (res.role === "ADMIN") {
        router.push("/admin");
      } else if (res.role === "VENDOR") {
        router.push("/vendor/dashboard");
      } else {
        // Customer Experience
        router.push(redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/");
      }
    } else {
      setError(res.error || "Login failed. Please verify your credentials.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-brand-border shadow-xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo variant="header" size="lg" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-charcoal tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted">
            Sign in to access your orders, kitchen dashboard, or platform administration.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-brand-tomato/10 border border-brand-tomato/20 text-brand-tomato text-xs leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
              Username or Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-brand-cream/60 border border-brand-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-sm text-brand-charcoal font-medium transition-all"
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
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="pt-4 border-t border-brand-border text-center space-y-2 text-xs">
          <p className="text-brand-muted">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-brand-orange hover:underline"
            >
              Create customer account
            </Link>
          </p>
          <p className="text-brand-muted">
            Are you a restaurant or food shopkeeper?{" "}
            <Link
              href="/vendor/register"
              className="font-bold text-brand-tomato hover:underline"
            >
              Partner with us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
