"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, Globe, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, QrCode } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install on Chrome/Edge: Click the 'Install' icon in your browser's address bar. On iOS Safari: Tap 'Share' -> 'Add to Home Screen'.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-white pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Get BhukkadVerse on Any Device
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Your Cravings. In Your Pocket.
          </h1>
          <p className="text-neutral-400 text-base md:text-lg">
            Download our native Android app or install the ultra-fast Progressive WebApp (PWA). Zero surge fees, 100% free delivery over ₹99, and flat 10% platform fees for neighborhood kitchens.
          </p>
        </div>

        {/* 3 Download Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Card 1: Progressive WebApp (PWA) */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 flex flex-col justify-between hover:border-brand-orange/40 transition-all shadow-xl">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-3">
                Instant • No Download Needed
              </div>
              <h3 className="text-2xl font-black mb-2 text-white">Install WebApp (PWA)</h3>
              <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                Works instantly across <strong>Android, iPhone, iPad, Windows & Mac</strong>. Adds the official BhukkadVerse icon directly to your home screen with zero storage overhead.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full-screen app experience without browser tabs</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Always auto-updated with the latest menu items</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant push notifications for live order tracking</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-brand-orange text-white font-black text-sm tracking-wide shadow-lg shadow-brand-orange/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isInstalled ? "App Installed ✓" : "Install WebApp to Home Screen"}
            </button>
          </div>

          {/* Card 2: Standalone Android App (APK) */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-brand-orange/10 text-brand-orange text-xs font-bold mb-3">
                React Native • Expo SDK 52
              </div>
              <h3 className="text-2xl font-black mb-2 text-white">Android Native App (.APK)</h3>
              <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                Download the standalone Android package (`.apk`) containing the <strong>Customer Storefront</strong>, <strong>Vendor Kitchen Hub</strong>, and <strong>Rider Fleet Tracker</strong>.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Built for Android 10, 11, 12, 13, 14 & 15</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time GPS telemetry & anti-theft ₹1,500 float gauge</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kitchen order chime audio alerts for vendors</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="https://github.com/Ayush2809-tech/bhukkad-verse/actions/workflows/build-android-apk.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-black text-sm tracking-wide border border-neutral-700 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                Download Android APK from GitHub
              </Link>
            </div>
          </div>
        </div>

        {/* Installation Steps Guide */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-8 mb-16">
          <h3 className="text-xl font-black mb-6 text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-orange" />
            Quick 3-Step Android APK Installation Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black flex items-center justify-center text-sm mb-3">
                1
              </div>
              <h4 className="font-bold text-white text-base mb-1">Download APK</h4>
              <p className="text-xs text-neutral-400">
                Click download to save <code className="text-brand-orange">BhukkadVerse-v1.0.apk</code> on your Android phone.
              </p>
            </div>

            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black flex items-center justify-center text-sm mb-3">
                2
              </div>
              <h4 className="font-bold text-white text-base mb-1">Allow Unknown Apps</h4>
              <p className="text-xs text-neutral-400">
                If prompted by Chrome or Files, tap <em>Settings</em> and toggle <em>Allow from this source</em>.
              </p>
            </div>

            <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black flex items-center justify-center text-sm mb-3">
                3
              </div>
              <h4 className="font-bold text-white text-base mb-1">Tap Install & Enjoy</h4>
              <p className="text-xs text-neutral-400">
                Tap <em>Install</em>. Launch BhukkadVerse with the official chef hat logo on your home screen!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Support Notice */}
        <div className="text-center text-neutral-500 text-xs">
          Need assistance or custom fleet deployment? Contact official team support at{" "}
          <a href="mailto:bhukkadverse.teams@gmail.com" className="text-brand-orange font-bold hover:underline">
            bhukkadverse.teams@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}

