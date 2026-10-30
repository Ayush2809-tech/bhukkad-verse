"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Headphones,
  Store,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface SupportSettings {
  support_phone: string;
  support_email: string;
  support_whatsapp: string;
  support_hours: string;
  emergency_notice: string;
}

interface ShopChoice {
  id: string;
  name: string;
  city: string;
}

const FAQS = [
  {
    q: "How can I contact a specific kitchen regarding my order?",
    a: "Select the specific kitchen/shop from the dropdown in the support form below. Your ticket will be dispatched directly to that kitchen's partner dashboard as well as our platform resolution desk.",
  },
  {
    q: "How can I track my food delivery order in real-time?",
    a: "Once your order is confirmed by the partner kitchen, you can check the live status directly under 'My Orders'. Our kitchen partners update when the order is accepted, prepared, and dispatched.",
  },
  {
    q: "How do you verify the quality and hygiene of partner cloud kitchens?",
    a: "Every single cloud kitchen and artisan on BHUKKAD VERSE undergoes physical kitchen verification, FSSAI compliance audits, and food-handling hygiene inspections before being approved by our platform administrators.",
  },
  {
    q: "Can I customize dish sizes, toppings, and spice levels?",
    a: "Yes! When browsing any dish with custom options, you can select custom portions (Regular, Medium, Large) and add-on crusts, extra toppings, or dips directly before adding them to your cart.",
  },
  {
    q: "What should I do if an item is missing or damaged?",
    a: "You can instantly raise a dispute using the ticket form below or message our 24x7 WhatsApp support line. Both the vendor and platform administrators review disputes for instant refunds or replacements.",
  },
  {
    q: "How can I register my restaurant or cloud kitchen on BHUKKAD VERSE?",
    a: "Click on 'Register Your Kitchen' in the top navigation or footer. You can submit your shop profile, menu cards, and operating schedule in under 3 minutes for admin review.",
  },
];

export default function SupportPage() {
  const { user } = useAuth();

  const [settings, setSettings] = useState<SupportSettings>({
    support_phone: "+91 98765 43210",
    support_email: "support@bhukkadverse.com",
    support_whatsapp: "+91 98765 43210",
    support_hours: "10:00 AM - 03:00 AM Daily",
    emergency_notice: "",
  });

  const [shops, setShops] = useState<ShopChoice[]>([]);
  const [formData, setFormData] = useState({
    name: user ? `${user.first_name} ${user.last_name}`.trim() || user.username : "",
    email: user?.email || "",
    phone: user?.phone || "",
    orderId: "",
    shopId: "",
    category: "ORDER_INQUIRY",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Load live contact settings and approved shops list
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, shopsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/v1/core/settings/`),
          fetch(`${API_BASE_URL}/v1/shops/`),
        ]);

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setSettings({
            support_phone: sData.support_phone || "+91 98765 43210",
            support_email: sData.support_email || "support@bhukkadverse.com",
            support_whatsapp: sData.support_whatsapp || "+91 98765 43210",
            support_hours: sData.support_hours || "10:00 AM - 03:00 AM Daily",
            emergency_notice: sData.emergency_notice || "",
          });
        }

        if (shopsRes.ok) {
          const shData = await shopsRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setShops(shData.map((s: any) => ({ id: s.id, name: s.name, city: s.city })));
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: Record<string, unknown> = {
        customer_name: formData.name.trim(),
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        order_id: formData.orderId.trim(),
        category: formData.category,
        subject: formData.subject.trim() || `${formData.category.replace(/_/g, " ")} inquiry`,
        message: formData.message.trim(),
      };

      if (formData.shopId) {
        payload.shop = formData.shopId;
      }

      const res = await fetch(`${API_BASE_URL}/v1/customer/support/tickets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setTicketNumber(data.ticket?.ticket_number || "BV-SUPP-ACK");
      } else {
        const err = await res.json();
        setSubmitError(err.message?.[0] || err.detail || "Failed to submit ticket. Please check fields.");
      }
    } catch {
      setSubmitError("Network connection error. Please try again or reach our hotline.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-black uppercase tracking-wider">
          <Headphones className="w-3.5 h-3.5" />
          <span>Craving Care Desk</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-charcoal tracking-tight">
          We&apos;re Here to Help You Feast
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
          Need help with your live order, payment refund, dish customization, or partner onboarding? Direct your query to the specific kitchen or our central platform resolution team below.
        </p>
      </div>

      {/* Emergency Notice if enabled by admin */}
      {settings.emergency_notice && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs font-bold">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{settings.emergency_notice}</span>
        </div>
      )}

      {/* Dynamic Contact Channels configured by Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-orange/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center text-brand-orange">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-brand-muted block">
              Call Hotline
            </span>
            <h3 className="text-base font-black text-brand-charcoal">{settings.support_phone}</h3>
            <p className="text-xs text-brand-muted mt-0.5">{settings.support_hours}</p>
          </div>
          <a
            href={`tel:${settings.support_phone.replace(/\s+/g, "")}`}
            className="text-xs font-black text-brand-orange hover:underline flex items-center gap-1"
          >
            <span>Dial Helpline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-orange/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-brand-muted block">
              WhatsApp Concierge
            </span>
            <h3 className="text-base font-black text-brand-charcoal">{settings.support_whatsapp}</h3>
            <p className="text-xs text-brand-muted mt-0.5">Live chat with support resolution team</p>
          </div>
          <a
            href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Start WhatsApp Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-orange/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center text-brand-tomato">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-brand-muted block">
              Email Resolution
            </span>
            <h3 className="text-base font-black text-brand-charcoal">{settings.support_email}</h3>
            <p className="text-xs text-brand-muted mt-0.5">Official dispute resolution team</p>
          </div>
          <a
            href={`mailto:${settings.support_email}`}
            className="text-xs font-black text-brand-tomato hover:underline flex items-center gap-1"
          >
            <span>Send Email</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Ticket Submission Form & FAQs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Support Request Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-brand-charcoal">
              Submit a Complaint or Help Request
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Have an issue with a kitchen, order, or delivery? Select the partner kitchen below so they and our administrators can resolve it immediately.
            </p>
          </div>

          {ticketNumber ? (
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Official Complaint Registered
                </span>
                <h3 className="text-lg font-black text-emerald-950 mt-1">
                  Reference ID: {ticketNumber}
                </h3>
              </div>
              <p className="text-xs text-emerald-900 max-w-sm mx-auto leading-relaxed">
                Your ticket has been recorded in our database and forwarded to the kitchen manager and platform support supervisor. You will receive an SMS/Email update shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTicketNumber(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    orderId: "",
                    shopId: "",
                    category: "ORDER_INQUIRY",
                    subject: "",
                    message: "",
                  });
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-700 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-800 transition-all cursor-pointer shadow-md"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {submitError}
                </div>
              )}

              {/* Kitchen / Shop Selector */}
              <div>
                <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                  Which Kitchen / Restaurant is this regarding? (Optional)
                </label>
                <div className="relative">
                  <select
                    value={formData.shopId}
                    onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 text-brand-charcoal"
                  >
                    <option value="">-- General / Platform-wide Query --</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-brand-muted mt-1">
                  Selecting a kitchen ensures your feedback is routed directly to that restaurant partner&apos;s dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    placeholder="e.g. BV-ORD-94821"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                  Issue Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none text-brand-charcoal"
                >
                  <option value="ORDER_INQUIRY">Order &amp; Delivery Status</option>
                  <option value="FOOD_QUALITY">Food Taste &amp; Quality Issue</option>
                  <option value="DELIVERY_DELAY">Delivery Delay</option>
                  <option value="MISSING_ITEM">Missing or Incorrect Item</option>
                  <option value="REFUND_REQUEST">Payment &amp; Refund Request</option>
                  <option value="HYGIENE_CONCERN">Hygiene &amp; Packaging Concern</option>
                  <option value="PARTNER_INQUIRY">Kitchen Onboarding &amp; Partnership</option>
                  <option value="OTHER">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary of your complaint"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                  Describe Your Query / Complaint in Detail *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe what happened with your food, delivery, or inquiry..."
                  className="w-full text-xs p-3.5 rounded-xl bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-brand-orange to-brand-tomato hover:from-brand-amber hover:to-brand-orange text-white text-xs font-black uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Ticket in Database...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Official Support Ticket</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* FAQs Accordion */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-brand-surface/60 rounded-3xl p-6 border border-brand-border space-y-2">
            <div className="flex items-center gap-2 text-brand-orange">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">Instant Answers</span>
            </div>
            <h3 className="text-lg font-black text-brand-charcoal">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-brand-muted">
              Quick answers about orders, partner hygiene audits, refunds, and kitchen complaints.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-brand-border overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-brand-charcoal hover:text-brand-orange cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-muted shrink-0 transition-transform ${
                      openFaq === idx ? "rotate-180 text-brand-orange" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-brand-muted leading-relaxed border-t border-brand-border/40 bg-brand-surface/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
