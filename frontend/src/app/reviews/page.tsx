"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import {
  Star,
  MessageSquarePlus,
  CheckCircle2,
  Sparkles,
  X,
  Loader2,
  Quote,
  ChevronLeft,
} from "lucide-react";

interface ReviewItem {
  id: string;
  author_name: string;
  author_role: string;
  city: string;
  rating: number;
  headline: string;
  comment: string;
  created_at: string;
}

export default function CommunityReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [authorName, setAuthorName] = useState("");
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [city, setCity] = useState("Delhi NCR");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/core/reviews/`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      // Graceful
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!comment.trim()) {
      setErrorMessage("Please write your review comment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/core/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: authorName.trim() || "Food Enthusiast",
          headline: headline.trim() || "Unmatched Culinary Experience",
          comment: comment.trim(),
          rating,
          city: city.trim() || "Delhi NCR",
          author_role: "Verified Foodie",
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
          setAuthorName("");
          setHeadline("");
          setComment("");
          setRating(5);
          fetchReviews();
        }, 1500);
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || "Failed to submit review.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) =>
    ratingFilter === "ALL" ? true : r.rating === ratingFilter
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black text-brand-muted hover:text-brand-orange uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Food Universe</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-xs font-black text-brand-orange uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Customer Testimonials</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-brand-charcoal tracking-tight">
                Community Foodie Reviews
              </h1>
              <p className="text-sm text-brand-muted font-medium">
                Real dining reviews and ratings from food lovers across Delhi NCR, Gurugram, and Noida.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-brand-orange hover:bg-brand-tomato text-white font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-all hover:scale-105 cursor-pointer shrink-0"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Write a Platform Review</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-brand-border/60">
          <span className="text-xs font-black text-brand-charcoal mr-2">Filter by Rating:</span>
          {(["ALL", 5, 4, 3] as ("ALL" | number)[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRatingFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                ratingFilter === f
                  ? "bg-brand-charcoal text-white shadow-xs"
                  : "bg-white border border-brand-border text-brand-charcoal hover:border-brand-orange"
              }`}
            >
              {f === "ALL" ? "All Reviews" : `${f} Stars Only`}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-brand-border space-y-3">
            <p className="text-sm font-bold text-brand-muted">
              No reviews found matching this rating filter.
            </p>
            <button
              type="button"
              onClick={() => setRatingFilter("ALL")}
              className="text-xs font-black text-brand-orange hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-brand-border p-6 shadow-xs hover:shadow-xl hover:border-brand-orange/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < r.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200 fill-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black uppercase text-brand-muted">
                      {r.city}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-brand-charcoal">
                    &ldquo;{r.headline}&rdquo;
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {r.comment}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-brand-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-brand-charcoal block">
                      {r.author_name}
                    </span>
                    <span className="text-[10px] font-bold text-brand-orange">
                      {r.author_role}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <Quote className="w-4 h-4 opacity-70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-border max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-black text-brand-charcoal">Review Published!</h3>
                <p className="text-xs text-brand-muted">
                  Thank you for contributing to the Bhukkad Verse foodie community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-brand-orange tracking-wider">
                    Community Testimonial
                  </span>
                  <h3 className="text-2xl font-black text-brand-charcoal">Write Your Review</h3>
                </div>

                {/* Rating Picker */}
                <div>
                  <label className="block text-xs font-black uppercase text-brand-charcoal mb-1">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-brand-charcoal ml-2">
                      {rating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-brand-charcoal mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ayush Saxena"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-brand-charcoal mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi NCR"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-brand-charcoal mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. The best biryani delivery in NCR!"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-brand-charcoal mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the packaging, flavor, and delivery experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs font-bold text-brand-tomato bg-red-50 p-2.5 rounded-xl">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Review</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

