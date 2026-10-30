"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Send,
  MessageCircle,
  X,
  CheckCircle2,
  Store,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DeliveryInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  shopPhone?: string;
  shopTier?: string;
  distanceKm?: number | null;
  customerAddress?: string;
  dishName?: string;
}

export const DeliveryInquiryModal: React.FC<DeliveryInquiryModalProps> = ({
  isOpen,
  onClose,
  shopName,
  shopPhone = "9876543210",
  shopTier = "STREET_FOOD",
  distanceKm,
  customerAddress = "Current GPS Location",
  dishName,
}) => {
  const [inquiryText, setInquiryText] = useState(
    dishName
      ? `Bhaiya, main ${distanceKm ? `${distanceKm} km` : "aas-paas"} door hoon. Kya "${dishName}" abhi deliver ho payega?`
      : `Bhaiya, main ${distanceKm ? `${distanceKm} km` : "aas-paas"} door hoon. Kya aapke yahan se abhi delivery possible hai?`
  );
  const [sending, setSending] = useState(false);
  const [replied, setReplied] = useState<null | { canDeliver: boolean; message: string }>(null);

  if (!isOpen) return null;

  const formattedDistance =
    distanceKm !== null && distanceKm !== undefined
      ? distanceKm < 1.0
        ? `${Math.round(distanceKm * 1000)} meters`
        : `${distanceKm} km`
      : "Nearby";

  const handleSendInAppPing = () => {
    setSending(true);
    // Simulate real-time vendor ping
    setTimeout(() => {
      setSending(false);
      setReplied({
        canDeliver: true,
        message: `Haan bhaiya, ${formattedDistance} door hai! Hum 15-20 minutes me garma-garam deliver kar denge. Aap checkout kar lijiye!`,
      });
    }, 1200);
  };

  const handleWhatsAppRedirect = () => {
    const cleanPhone = shopPhone.replace(/\D/g, "");
    const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone || "919876543210";
    const encodedMsg = encodeURIComponent(
      `*BHUKKAD VERSE — Delivery Enquiry*\n\nNamaste *${shopName}*!\nMain *${formattedDistance}* door hoon (${customerAddress}).\n\n${inquiryText}`
    );
    window.open(`https://wa.me/${waNumber}?text=${encodedMsg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-brand-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-brand-charcoal text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/20 border border-brand-orange/40 text-[11px] font-black text-brand-orange uppercase mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Hyperlocal Pre-Order Check</span>
          </div>

          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-orange" />
            <span>{shopName}</span>
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/80">
            <span className="flex items-center gap-1 font-bold text-brand-amber">
              <MapPin className="w-3.5 h-3.5" />
              <span>{formattedDistance} away</span>
            </span>
            <span>•</span>
            <span className="truncate max-w-[240px] text-white/70">
              {customerAddress}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {replied ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Kitchen Confirmed: Delivery Available!</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                &ldquo;{replied.message}&rdquo;
              </p>
              <button
                onClick={onClose}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-colors"
              >
                Done! Proceed with Order
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-brand-muted tracking-wider block">
                  Delivery Inquiry Message
                </label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-xs text-brand-charcoal rounded-2xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none font-medium"
                  placeholder="Ask if they can deliver to your location right now..."
                />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-brand-muted block">
                  Quick Prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setInquiryText(
                        `Bhaiya, main ${formattedDistance} door hoon. Kya 15-20 min me deliver ho payega?`
                      )
                    }
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange transition-colors"
                  >
                    ⚡ Fast 20-min delivery?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInquiryText(
                        `Bhaiya, main 2nd floor pe hoon. Kya rider room tak deliver karega?`
                      )
                    }
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange transition-colors"
                  >
                    🚪 Room doorstep delivery?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInquiryText(
                        `Bhaiya, extra chutney aur pyaaz ke sath deliver kar doge na?`
                      )
                    }
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange transition-colors"
                  >
                    🧅 Extra chutney & packaging?
                  </button>
                </div>
              </div>

              {/* 2 Ways to Inquire */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1-Tap WhatsApp Ping */}
                <button
                  type="button"
                  onClick={handleWhatsAppRedirect}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Ask on WhatsApp</span>
                </button>

                {/* Instant In-App Ping */}
                <button
                  type="button"
                  onClick={handleSendInAppPing}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors shadow-xs disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{sending ? "Pinging Kitchen..." : "Send Instant Ping"}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-brand-surface border-t border-brand-border/60 text-[11px] text-brand-muted flex items-center justify-between">
          <span>100% Free on Bhukkad Verse</span>
          <span className="font-extrabold text-brand-charcoal">Zero Commission Burden</span>
        </div>
      </div>
    </div>
  );
};
