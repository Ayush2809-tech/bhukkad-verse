"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Flame,
  Store,
  Utensils,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ShowcaseVideoItem {
  id: string;
  title: string;
  caption: string;
  video_url: string;
  video_file: string | null;
  effective_video_url: string;
  thumbnail_url: string;
  shop_id: string | null;
  shop_name: string | null;
  shop_slug: string | null;
  shop_logo: string;
  product_id: string | null;
  product_name: string | null;
  product_price: string | null;
  product_image: string;
  is_featured: boolean;
  views_count: number;
}

export const HomepageVideoSlider: React.FC = () => {
  const [videos, setVideos] = useState<ShowcaseVideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [videoBufferStatus, setVideoBufferStatus] = useState<{ [key: string]: boolean }>({});

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/v1/core/showcase-videos/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setVideos(data);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // 10-Second Story Timer: Auto advance slides every 10 seconds (seamless infinite loop)
  useEffect(() => {
    if (videos.length <= 1 || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 10000); // Exact 10 seconds per reel

    return () => clearInterval(timer);
  }, [videos.length, isPlaying, currentIndex]);

  // Synchronize active video playback & programmatic autoplay
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, vidEl]) => {
      if (!vidEl) return;
      const isCurrent = videos[currentIndex]?.id === id;
      if (isCurrent) {
        vidEl.muted = isMuted;
        vidEl.defaultMuted = isMuted;
        vidEl.playsInline = true;
        if (isPlaying) {
          const playPromise = vidEl.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Reel autoplay deferred by browser:", err);
            });
          }
        } else {
          vidEl.pause();
        }
      } else {
        vidEl.pause();
        vidEl.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying, isMuted, videos]);

  // Ensure first user interaction initiates playback if browser was strict
  useEffect(() => {
    const handleGesture = () => {
      const activeVid = videos[currentIndex] ? videoRefs.current[videos[currentIndex].id] : null;
      if (activeVid && isPlaying) {
        activeVid.muted = isMuted;
        activeVid.play().catch(() => {});
      }
    };
    window.addEventListener("touchstart", handleGesture, { passive: true, once: true });
    window.addEventListener("wheel", handleGesture, { passive: true, once: true });
    window.addEventListener("click", handleGesture, { passive: true, once: true });
    return () => {
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("wheel", handleGesture);
      window.removeEventListener("click", handleGesture);
    };
  }, [currentIndex, isPlaying, isMuted, videos]);

  if (loading && videos.length === 0) {
    return null;
  }

  if (videos.length === 0) return null;

  const currentVideo = videos[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const toggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      Object.values(videoRefs.current).forEach((el) => {
        if (el) el.muted = next;
      });
      return next;
    });
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <section className="py-14 bg-[#140E0A] text-white relative overflow-hidden select-none border-b border-white/10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-amber/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-black text-brand-amber backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-brand-orange fill-brand-orange" />
              <span>Behind the Scenes</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Sizzling Kitchen Stories
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-medium">
              Watch signature recipes handcrafted fresh by neighborhood culinary masters.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
              aria-label="Previous reel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
              aria-label="Next reel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Reel Showcase Container */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-950 aspect-video sm:aspect-21/9 max-h-[560px]">
          {/* Active Looping Video */}
          {videos.map((vid, idx) => {
            const videoSrc = getMediaUrl(vid.effective_video_url || vid.video_url);
            return (
              <video
                key={vid.id}
                ref={(el) => {
                  videoRefs.current[vid.id] = el;
                }}
                src={videoSrc}
                poster={vid.thumbnail_url || undefined}
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onCanPlay={() => {
                  setVideoBufferStatus((prev) => ({ ...prev, [vid.id]: true }));
                  if (idx === currentIndex && isPlaying) {
                    videoRefs.current[vid.id]?.play().catch(() => {});
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              />
            );
          })}

          {/* Vignette Overlay for readability */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-20 bg-radial from-transparent via-black/20 to-black/70 pointer-events-none" />

          {/* 10-Second Progress Bars (Story Style) */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-1.5 p-4 pointer-events-none">
            {videos.map((vid, idx) => (
              <div key={vid.id} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-brand-amber via-brand-orange to-brand-tomato ${
                    idx === currentIndex
                      ? isPlaying
                        ? "w-full transition-all duration-[10000ms] ease-linear"
                        : "w-1/2"
                      : idx < currentIndex
                      ? "w-full"
                      : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Video Player Floating Controls (Top Right) */}
          <div className="absolute top-7 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md cursor-pointer transition-all"
              title={isPlaying ? "Pause Video" : "Play Video"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white backdrop-blur-md cursor-pointer transition-all"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-brand-amber" />}
            </button>
          </div>

          {/* Reel Content Overlay (Bottom Left & Right) */}
          <div className="absolute bottom-6 left-6 right-6 z-30 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            {/* Story & Title */}
            <div className="max-w-xl space-y-2">
              {currentVideo.shop_name && (
                <Link
                  href={`/shops/${currentVideo.shop_slug || "chandu-street-chaat"}`}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-brand-amber backdrop-blur-md transition-colors"
                >
                  <Store className="w-3.5 h-3.5 text-brand-orange" />
                  <span>{currentVideo.shop_name}</span>
                </Link>
              )}

              <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                {currentVideo.title}
              </h3>

              {currentVideo.caption && (
                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 max-w-lg leading-relaxed">
                  {currentVideo.caption}
                </p>
              )}
            </div>

            {/* Featured Dish Pill Link */}
            {currentVideo.product_name && (
              <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3.5 shadow-xl shrink-0">
                {currentVideo.product_image && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                    <img
                      src={getMediaUrl(currentVideo.product_image)}
                      alt={currentVideo.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase text-brand-amber tracking-wider block">
                    Featured Delicacy
                  </span>
                  <p className="text-xs font-black text-white line-clamp-1">
                    {currentVideo.product_name}
                  </p>
                  {currentVideo.product_price && (
                    <span className="text-xs font-bold text-white/80">
                      ₹{currentVideo.product_price}
                    </span>
                  )}
                </div>

                <Link
                  href={`/shops/${currentVideo.shop_slug || "chandu-street-chaat"}`}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-tomato hover:from-brand-amber hover:to-brand-orange text-white text-xs font-black transition-all flex items-center gap-1 shadow-xs ml-1"
                >
                  <span>Order</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
