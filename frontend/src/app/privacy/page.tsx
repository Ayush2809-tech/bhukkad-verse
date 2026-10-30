"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, MapPin, Eye, ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-black text-brand-muted hover:text-brand-orange uppercase tracking-wider transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FSSAI & Digital Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-xs text-brand-muted">
            Last Updated: October 2026 • Bhukkad Verse Food Technologies
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-brand-muted leading-relaxed font-medium">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-orange" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              When you register on Bhukkad Verse, place an order, or participate in culinary reviews, we collect necessary personal details such as your verified phone number, delivery address, recipient name, and order preferences.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-orange" />
              <span>2. Precise Geolocation Data</span>
            </h2>
            <p>
              We request access to your device GPS location solely to compute accurate delivery radii from neighborhood kitchens, street food carts, and luxury hotels to ensure your meal arrives within the estimated delivery window. We never sell or share your geolocation history.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-orange" />
              <span>3. Hygiene & Safety Verification</span>
            </h2>
            <p>
              All kitchen partners (street food vendors, luxury restaurants, and cloud kitchens) must hold active FSSAI certifications. Periodic hygiene clearance logs are stored securely to guarantee high culinary standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-orange" />
              <span>4. Contact our Data Protection Officer</span>
            </h2>
            <p>
              For questions regarding account deletion, address privacy, or data retrieval, reach out to our team at{" "}
              <a href="mailto:support@bhukkadverse.com" className="text-brand-orange underline font-bold">
                support@bhukkadverse.com
              </a>{" "}
              or via WhatsApp Concierge at +91 9528055151.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

