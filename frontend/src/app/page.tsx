"use client";

import React, { useState } from "react";
import { GrandEntranceShutter } from "@/components/home/GrandEntranceShutter";
import { HeroSection } from "@/components/home/HeroSection";
import { ContinuousDishesSlider } from "@/components/home/ContinuousDishesSlider";
import { HomepageVideoSlider } from "@/components/home/HomepageVideoSlider";
import { CravingsShelfSection } from "@/components/home/CravingsShelfSection";
import { CuratedTiersSection } from "@/components/home/CuratedTiersSection";
import { FoodDiscoverySection } from "@/components/home/FoodDiscoverySection";
import { PlatformReviewsSection } from "@/components/home/PlatformReviewsSection";

export default function HomePage() {
  const [activeSearch, setActiveSearch] = useState("");
  const [activeMode, setActiveMode] = useState<"dish" | "shop">("dish");

  const handleSearchSubmit = (query: string, mode?: "dish" | "shop") => {
    setActiveSearch(query);
    if (mode) setActiveMode(mode);
    const el = document.getElementById("discovery");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCategorySelect = (query: string) => {
    setActiveSearch(query);
    setActiveMode("dish");
    const el = document.getElementById("discovery");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClearSearch = () => {
    setActiveSearch("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Interactive Grand Entrance Rolling Shutter */}
      <GrandEntranceShutter />

      {/* Hero Section with food-first craving search and mode toggle */}
      <HeroSection
        onSearchSubmit={handleSearchSubmit}
        onCategorySelect={handleCategorySelect}
      />

      {/* Continuous Automatic Dishes Slider (Real Dynamic Food Items) */}
      <ContinuousDishesSlider />

      {/* Front-Page Behind-the-Scenes Kitchen Video Reels Showcase */}
      <HomepageVideoSlider />

      {/* Interactive Visual Craving Category Shelf */}
      <CravingsShelfSection
        activeQuery={activeSearch}
        onSelectCraving={handleCategorySelect}
        onResetCraving={handleClearSearch}
      />

      {/* 3 Foodie Panels: Street Food Carts | Luxury Fine Dining | Fresh Kitchens */}
      <CuratedTiersSection />

      {/* Live Food Discovery & Real Verified Dishes / Kitchen Cards */}
      <FoodDiscoverySection
        initialSearchQuery={activeSearch}
        initialMode={activeMode}
        onClearSearch={handleClearSearch}
      />

      {/* Community Foodie Reviews & Ratings */}
      <PlatformReviewsSection />
    </div>
  );
}
