"use client";

import React, { useState, useEffect, useRef } from "react";
import { BRAND_TOKENS } from "@/lib/tokens";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import { ChevronDown, ArrowUp } from "lucide-react";

interface PlatformSettingsData {
  curtain_video_url: string;
  curtain_badge: string;
  curtain_headline: string;
  curtain_tagline: string;
  curtain_quote: string;
  curtain_logo_url?: string;
}

const DEFAULT_SETTINGS: PlatformSettingsData = {
  curtain_video_url: "/brand/curtain_loop.mp4",
  curtain_badge: "AUTHENTIC NEIGHBORHOOD KITCHENS",
  curtain_headline: "BHUKKAD VERSE",
  curtain_tagline: "YOUR CRAVINGS. YOUR UNIVERSE.",
  curtain_quote:
    "Authentic neighborhood cloud kitchens, artisanal eateries, and gourmet masters cooked fresh to your exact taste.",
  curtain_logo_url: "/brand/logo-primary.png",
};

interface GrandEntranceShutterProps {
  onShutterLifted?: () => void;
}

export const GrandEntranceShutter: React.FC<GrandEntranceShutterProps> = ({
  onShutterLifted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [settings, setSettings] = useState<PlatformSettingsData>(DEFAULT_SETTINGS);
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>("/brand/curtain_loop.mp4");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 0% to 100% linear scroll progression

  const videoRef = useRef<HTMLVideoElement>(null);
  const accumulatedDelta = useRef(0);
  const threshold = 380; // Smooth, responsive scroll distance to lift curtain completely

  // Instant Autoplay on initial component mount
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;

    const attemptPlay = () => {
      if (vid.paused) {
        const p = vid.play();
        if (p !== undefined) {
          p.catch(() => {
            // Silently wait for first gesture if browser is very strict
          });
        }
      }
    };

    attemptPlay();

    vid.addEventListener("loadeddata", attemptPlay);
    vid.addEventListener("canplay", attemptPlay);
    vid.addEventListener("canplaythrough", attemptPlay);

    return () => {
      vid.removeEventListener("loadeddata", attemptPlay);
      vid.removeEventListener("canplay", attemptPlay);
      vid.removeEventListener("canplaythrough", attemptPlay);
    };
  }, []);

  // Fetch dynamic CMS curtain settings from Django backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/core/settings/`);
        if (res.ok) {
          const data = await res.json();
          let effectiveVid = data.effective_curtain_video_url || data.curtain_video_url;
          // Use instant local streaming video if using platform default video or mixkit
          if (!effectiveVid || effectiveVid.includes("mixkit.co") || effectiveVid.includes("bhukkad_2.mp4")) {
            effectiveVid = "/brand/curtain_loop.mp4";
          }

          setSettings({
            curtain_video_url: effectiveVid,
            curtain_badge: data.curtain_badge || DEFAULT_SETTINGS.curtain_badge,
            curtain_headline: data.curtain_headline || DEFAULT_SETTINGS.curtain_headline,
            curtain_tagline: data.curtain_tagline || DEFAULT_SETTINGS.curtain_tagline,
            curtain_quote: data.curtain_quote || DEFAULT_SETTINGS.curtain_quote,
            curtain_logo_url: data.effective_logo_url || data.custom_logo_url || DEFAULT_SETTINGS.curtain_logo_url,
          });

          const resolved = getMediaUrl(effectiveVid);
          if (resolved && resolved !== activeVideoSrc) {
            setActiveVideoSrc(resolved);
          }

          if (data.curtain_enabled === false) {
            setIsOpen(true);
          }
        }
      } catch {
        // Fallback to default branding
      }
    };

    fetchSettings();
  }, []);

  // Autoplay video explicitly whenever activeVideoSrc changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;

    const p = vid.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  }, [activeVideoSrc]);

  // Guaranteed fallback: Any user interaction (pointer, touch, wheel, mousemove) instantly starts video
  useEffect(() => {
    const handleUserInteraction = () => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", handleUserInteraction, { passive: true, once: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true, once: true });
    window.addEventListener("wheel", handleUserInteraction, { passive: true, once: true });
    window.addEventListener("mousemove", handleUserInteraction, { passive: true, once: true });
    window.addEventListener("scroll", handleUserInteraction, { passive: true, once: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("mousemove", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
    };
  }, []);

  // Ensure on every refresh that the browser doesn't skip the curtain
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }, []);

  // Monitor physical wheel & touch gestures for progressive, smooth curtain roll-up
  useEffect(() => {
    if (isOpen) return;

    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      if (isOpen) return;

      // Accumulate wheel movement (scroll down lifts curtain smoothly)
      accumulatedDelta.current += e.deltaY;
      if (accumulatedDelta.current < 0) accumulatedDelta.current = 0;

      const progress = Math.min(100, Math.max(0, (accumulatedDelta.current / threshold) * 100));
      setScrollProgress(progress);

      // Lock underlying page scroll until curtain has lifted all the way to 100%
      if (progress < 100) {
        if (e.cancelable) e.preventDefault();
      } else {
        setIsOpen(true);
        if (onShutterLifted) onShutterLifted();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isOpen) return;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isOpen) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // positive when swiping upwards
      touchStartY = currentY;

      accumulatedDelta.current += deltaY * 1.5;
      if (accumulatedDelta.current < 0) accumulatedDelta.current = 0;

      const progress = Math.min(100, Math.max(0, (accumulatedDelta.current / threshold) * 100));
      setScrollProgress(progress);

      if (progress < 100) {
        if (e.cancelable) e.preventDefault();
      } else {
        setIsOpen(true);
        if (onShutterLifted) onShutterLifted();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen, onShutterLifted, threshold]);

  // Monitor window scroll for real-world Back to Top floating button
  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  // Smooth cinematic curtain lift triggered by buttons
  const liftCurtainSmoothly = () => {
    setIsAnimating(true);
    setScrollProgress(100);
    setTimeout(() => {
      setIsOpen(true);
      setIsAnimating(false);
      if (onShutterLifted) {
        onShutterLifted();
      }
    }, 950);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resolvedLogoUrl = getMediaUrl(settings.curtain_logo_url) || BRAND_TOKENS.assets.logoPrimary;

  return (
    <>
      {/* Real-World Return to Top Floating Button */}
      {showBackToTop && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in duration-300">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-charcoal/90 hover:bg-brand-charcoal text-white text-xs font-black shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
            title="Return to top of page"
          >
            <ArrowUp className="w-4 h-4 text-brand-orange group-hover:-translate-y-0.5 transition-transform" />
            <span>Back to Top</span>
          </button>
        </div>
      )}

      {/* Theatrical Curtain / Velvet Food Shutter */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden flex flex-col justify-between select-none shadow-2xl ${
          isOpen ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{
          transform: `translateY(-${isOpen ? 100 : scrollProgress}%)`,
          transition: isAnimating
            ? "transform 0.95s cubic-bezier(0.22, 1, 0.36, 1)"
            : "transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
          background: "radial-gradient(ellipse at 50% 30%, #20110A 0%, #110804 55%, #080302 100%)",
        }}
      >
        {/* Dynamic Looping Cinematic Background Video */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            src={activeVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => {
              if (activeVideoSrc !== "/brand/curtain_loop.mp4") {
                setActiveVideoSrc("/brand/curtain_loop.mp4");
              }
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-85 filter brightness-95 contrast-105 scale-105"
          />

          {/* Cinematic subtle vignette overlay for rich colors and sharp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/70 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/65 pointer-events-none" />
        </div>

        {/* Top Architectural Header */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-6 sm:pt-8 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-black text-brand-amber backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
            <span>{settings.curtain_badge}</span>
          </div>

          <button
            type="button"
            onClick={liftCurtainSmoothly}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer backdrop-blur-md"
          >
            Explore Kitchens ✕
          </button>
        </div>

        {/* Center Stage: Luxury Culinary Brand Crest & Dynamic Admin Quotes */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center space-y-6">
          {/* Official 3D Master Brand Emblem */}
          <div className="relative inline-block mx-auto">
            <div className="absolute -inset-6 bg-gradient-to-tr from-brand-amber via-brand-orange to-brand-tomato rounded-full blur-3xl opacity-60 animate-pulse" />
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl p-1.5 bg-gradient-to-tr from-brand-amber via-brand-orange to-brand-tomato shadow-2xl border border-white/30 overflow-hidden backdrop-blur-md">
              <div className="w-full h-full bg-[#FCF1E0] rounded-[22px] flex items-center justify-center p-2 relative shadow-inner">
                <img
                  src={resolvedLogoUrl}
                  alt="BHUKKAD VERSE — Master Crest"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/brand/logo-primary.png";
                  }}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Typography & Quote */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-7xl font-black text-white tracking-tight leading-[1.05]">
              {settings.curtain_headline.split(" ")[0]}{" "}
              <span className="bg-gradient-to-r from-brand-amber via-brand-orange to-brand-tomato bg-clip-text text-transparent">
                {settings.curtain_headline.split(" ").slice(1).join(" ") || "VERSE"}
              </span>
            </h1>

            <p className="text-sm sm:text-base font-black tracking-[0.25em] text-[#FDFBF7]/90 uppercase">
              {settings.curtain_tagline}
            </p>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed pt-1 font-medium italic">
              &ldquo;{settings.curtain_quote}&rdquo;
            </p>
          </div>
        </div>

        {/* Bottom Curtain Pull Tab / Scroll Indicator */}
        <div className="relative z-10 pb-8 sm:pb-12 text-center space-y-3">
          <div className="inline-flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={liftCurtainSmoothly}
              className="group flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <span className="text-xs font-black tracking-widest text-brand-amber uppercase flex items-center gap-1.5">
                <span>Scroll Down or Click to Enter</span>
                <ChevronDown className="w-4 h-4 animate-bounce text-brand-orange" />
              </span>
              <span className="text-[10px] text-zinc-300 font-medium">
                Lift the curtain to unveil authentic culinary kitchens
              </span>
            </button>

            {/* Micro visual progress bar of scroll lift */}
            <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-brand-orange transition-all duration-75"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
