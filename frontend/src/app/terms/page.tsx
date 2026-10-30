"use client";

import React from "react";
import Link from "next/link";
import { FileText, CheckCircle, AlertTriangle, HelpCircle, ChevronLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-black uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Fulfillment SLA & Platform Rules</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-charcoal tracking-tight">
            Terms of Service & Order Policy
          </h1>
          <p className="text-xs text-brand-muted">
            Effective Date: October 2026 • Bhukkad Verse Food Technologies
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-brand-muted leading-relaxed font-medium">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Order Placement & Fulfillment</span>
            </h2>
            <p>
              By ordering through Bhukkad Verse, you enter into a direct dining contract with the selected food partner (Street Food Stall, Fine Dining Hotel, or Cloud Kitchen). Kitchens prepare every dish fresh according to customized preparation notes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-amber" />
              <span>2. Promo Vouchers & Coupons Policy</span>
            </h2>
            <p>
              Coupons issued by Bhukkad Verse (e.g. BHUKKAD50, FIRSTBITE, LUXURY20) are subject to active platform validation, minimum cart subtotals, and usage limitations managed dynamically by platform administrators. Coupons cannot be redeemed for physical cash.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-tomato" />
              <span>3. Dispute Escalation & Refunds</span>
            </h2>
            <p>
              If a meal arrives damaged, spilled, or delayed past the designated SLA window, customers can raise a ticket directly against the specific kitchen partner via our Support Desk (/support). Refunds are credited to the original payment source within 24 hours of ticket resolution.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

