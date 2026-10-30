"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import {
  ShieldCheck,
  Users,
  Store,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Search,
  RefreshCw,
  Clock,
  History,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Tag,
  Star,
  MessageSquare,
  Video,
  Phone,
  Mail,
  FileText,
  Sparkles,
  Utensils,
  Trash2,
  Loader2,
  Plus,
  Banknote,
  CreditCard,
  TrendingUp,
  Wallet,
  Edit3,
} from "lucide-react";

// =============================================================
// TYPES
// =============================================================

interface OverviewStats {
  users: {
    total: number;
    customers: number;
    vendors: number;
    admins: number;
    active: number;
    inactive: number;
  };
  shops: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
}

interface AdminShopItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  address_line: string;
  city: string;
  postal_code: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  status_display?: string;
  is_active: boolean;
  is_accepting_orders: boolean;
  admin_review_notes: string;
  created_at: string;
  owner?: {
    id: string;
    username: string;
    email: string;
  };
}

interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  phone: string;
  is_active: boolean;
  date_joined: string;
  has_shop?: boolean;
  shop_status?: string | null;
  shop_slug?: string | null;
  shop_id?: string | null;
}

interface AdminAuditLogItem {
  id: string;
  admin: string;
  admin_username: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  target_repr: string;
  details: string;
  ip_address: string | null;
  created_at: string;
}

type AdminTab = "overview" | "applications" | "shops" | "users" | "audit" | "complaints" | "coupons" | "reviews" | "settings" | "videos" | "dishes" | "financials";

interface PlatformCMSConfig {
  curtain_enabled?: boolean;
  curtain_video_file?: string | null;
  effective_curtain_video_url?: string;
  custom_logo_url?: string;
  custom_logo_file?: string | null;
  effective_logo_url?: string;
  hero_headline_primary?: string;
  hero_headline_highlight?: string;
  hero_subtitle?: string;
  hero_badge_left?: string;
  hero_badge_right?: string;
  hero_mascot_badge_1?: string;
  hero_mascot_badge_2?: string;
  hero_mascot_badge_bottom?: string;
  hero_mascot_image_file?: string | null;
  hero_mascot_image_url?: string;
  effective_hero_mascot_image_url?: string;
  about_hero_title?: string;
  about_hero_subtitle?: string;
  about_street_title?: string;
  about_street_desc?: string;
  about_luxury_title?: string;
  about_luxury_desc?: string;
  about_kitchens_title?: string;
  about_kitchens_desc?: string;
  about_developer_title?: string;
  about_developer_desc?: string;
  curtain_video_url: string;
  curtain_badge: string;
  curtain_headline: string;
  curtain_tagline: string;
  curtain_quote: string;
  support_phone: string;
  support_email: string;
  support_whatsapp: string;
  support_hours: string;
  emergency_notice: string;
}

interface ShopRankingItem {
  shop__id: string;
  shop__name: string;
  complaint_count: number;
}

interface AdminSupportTicketItem {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_id: string;
  shop: string | null;
  shop_name: string | null;
  category: string;
  category_display: string;
  subject: string;
  message: string;
  status: string;
  status_display: string;
  resolution_notes: string;
  created_at: string;
}

// =============================================================
// MAIN COMPONENT
// =============================================================

export default function AdminPortalPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Financials & Commission Ledger State
  const [financials, setFinancials] = useState<any>(null);
  const [financialsLoading, setFinancialsLoading] = useState(false);

  const fetchFinancials = useCallback(async () => {
    if (!token) return;
    setFinancialsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/admin/financials/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFinancials(data);
      }
    } catch {
      // Ignored
    } finally {
      setFinancialsLoading(false);
    }
  }, [token]);


  // Overview State
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Applications State
  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopStatusFilter, setShopStatusFilter] = useState<string>("PENDING");
  const [shopSearch, setShopSearch] = useState("");

  // Users State
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userActiveFilter, setUserActiveFilter] = useState<string>("ALL");
  const [userSearch, setUserSearch] = useState("");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Platform CMS & Curtain Settings State
  const [cmsSettings, setCmsSettings] = useState<PlatformCMSConfig>({
    curtain_video_url: "",
    curtain_badge: "",
    curtain_headline: "",
    curtain_tagline: "",
    curtain_quote: "",
    support_phone: "",
    support_email: "",
    support_whatsapp: "",
    support_hours: "",
    emergency_notice: "",
  });
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [curtainVideoFile, setCurtainVideoFile] = useState<File | null>(null);
  const [customLogoFile, setCustomLogoFile] = useState<File | null>(null);
  const [heroMascotImageFile, setHeroMascotImageFile] = useState<File | null>(null);

  // Dynamic Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: "",
    description: "",
    discount_type: "FLAT",
    discount_value: "50",
    min_order_value: "199",
    max_discount_amount: "",
  });

  // Platform Reviews State
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [adminReviewsLoading, setAdminReviewsLoading] = useState(false);

  // Admin Showcase Videos & Dishes State
  // Admin Dish Add/Edit Modal State
  const [adminDishModalOpen, setAdminDishModalOpen] = useState(false);
  const [adminEditingDish, setAdminEditingDish] = useState<any | null>(null);
  const [adminDishSaving, setAdminDishSaving] = useState(false);
  const [adminDishImageFile, setAdminDishImageFile] = useState<File | null>(null);
  const [adminDishImagePreview, setAdminDishImagePreview] = useState<string | null>(null);
  const [adminDishFormData, setAdminDishFormData] = useState({
    shop_id: "",
    category_name: "Specialties",
    name: "",
    description: "",
    base_price: "99.00",
    compare_at_price: "",
    dietary_type: "VEG" as "VEG" | "NON_VEG" | "EGG" | "VEGAN",
    image_url: "",
    is_available: true,
  });

  const [adminVideos, setAdminVideos] = useState<any[]>([]);
  const [adminVideosLoading, setAdminVideosLoading] = useState(false);
  const [deletingAdminVideoId, setDeletingAdminVideoId] = useState<string | null>(null);
  const [isAddAdminVideoOpen, setIsAddAdminVideoOpen] = useState(false);
  const [adminVideoFile, setAdminVideoFile] = useState<File | null>(null);
  const [adminVideoForm, setAdminVideoForm] = useState({
    title: "",
    caption: "",
    video_url: "",
    thumbnail_url: "",
    shop: "",
  });

  const [adminDishes, setAdminDishes] = useState<any[]>([]);
  const [adminDishesLoading, setAdminDishesLoading] = useState(false);
  const [deletingAdminDishId, setDeletingAdminDishId] = useState<string | null>(null);
  const [dishSearchQuery, setDishSearchQuery] = useState("");

  const fetchAdminVideos = useCallback(async () => {
    if (!token) return;
    try {
      setAdminVideosLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/showcase-videos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminVideos(Array.isArray(data) ? data : []);
      }
    } catch {
      notifyError("Failed to fetch showcase videos.");
    } finally {
      setAdminVideosLoading(false);
    }
  }, [token]);

  const fetchAdminDishes = useCallback(async () => {
    if (!token) return;
    try {
      setAdminDishesLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/products/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminDishes(Array.isArray(data) ? data : []);
      }
    } catch {
      notifyError("Failed to fetch all dishes.");
    } finally {
      setAdminDishesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "videos") {
      fetchAdminVideos();
    } else if (activeTab === "dishes") {
      fetchAdminDishes();
    }
  }, [activeTab, fetchAdminVideos, fetchAdminDishes]);

  const handleOpenAddDishModal = () => {
    setAdminEditingDish(null);
    setAdminDishFormData({
      shop_id: shops.length > 0 ? shops[0].id : "",
      category_name: "Specialties",
      name: "",
      description: "",
      base_price: "99.00",
      compare_at_price: "",
      dietary_type: "VEG",
      image_url: "",
      is_available: true,
    });
    setAdminDishImageFile(null);
    setAdminDishImagePreview(null);
    setAdminDishModalOpen(true);
  };

  const handleOpenEditDishModal = (dish: any) => {
    setAdminEditingDish(dish);
    setAdminDishFormData({
      shop_id: dish.shop_id || (shops.length > 0 ? shops[0].id : ""),
      category_name: dish.category_name || "Specialties",
      name: dish.name,
      description: dish.description || "",
      base_price: dish.base_price,
      compare_at_price: dish.compare_at_price || "",
      dietary_type: dish.dietary_type || "VEG",
      image_url: dish.image_url || "",
      is_available: dish.is_available !== false,
    });
    setAdminDishImageFile(null);
    setAdminDishImagePreview(dish.image ? getMediaUrl(dish.image) : dish.image_url || null);
    setAdminDishModalOpen(true);
  };

  const handleSaveAdminDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setAdminDishSaving(true);
      let res: Response;

      if (adminDishImageFile) {
        const formData = new FormData();
        formData.append("shop_id", adminDishFormData.shop_id);
        formData.append("category_name", adminDishFormData.category_name);
        formData.append("name", adminDishFormData.name);
        formData.append("description", adminDishFormData.description);
        formData.append("base_price", adminDishFormData.base_price);
        if (adminDishFormData.compare_at_price) {
          formData.append("compare_at_price", adminDishFormData.compare_at_price);
        }
        formData.append("dietary_type", adminDishFormData.dietary_type);
        formData.append("is_available", String(adminDishFormData.is_available));
        if (adminDishFormData.image_url) {
          formData.append("image_url", adminDishFormData.image_url);
        }
        formData.append("image", adminDishImageFile);

        const url = adminEditingDish
          ? `${API_BASE_URL}/v1/admin/products/${adminEditingDish.id}/`
          : `${API_BASE_URL}/v1/admin/products/`;
        res = await fetch(url, {
          method: adminEditingDish ? "PATCH" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        const url = adminEditingDish
          ? `${API_BASE_URL}/v1/admin/products/${adminEditingDish.id}/`
          : `${API_BASE_URL}/v1/admin/products/`;
        res = await fetch(url, {
          method: adminEditingDish ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(adminDishFormData),
        });
      }

      if (res.ok) {
        notifySuccess(adminEditingDish ? "Dish updated successfully!" : "Dish added to platform successfully!");
        setAdminDishModalOpen(false);
        fetchAdminDishes();
      } else {
        notifyError("Failed to save dish. Please verify fields.");
      }
    } catch {
      notifyError("Network error saving dish.");
    } finally {
      setAdminDishSaving(false);
    }
  };

  const handleToggleAdminDishAvailability = async (dish: any) => {
    if (!token) return;
    const newStatus = !dish.is_available;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/products/${dish.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: newStatus }),
      });
      if (res.ok) {
        setAdminDishes((prev) =>
          prev.map((d) => (d.id === dish.id ? { ...d, is_available: newStatus } : d))
        );
        notifySuccess(`"${dish.name}" is now ${newStatus ? "In Stock (Visible in Slider)" : "Sold Out"}.`);
      } else {
        notifyError("Failed to update dish availability.");
      }
    } catch {
      notifyError("Network error updating dish.");
    }
  };

  const handleDeleteAdminDish = async (dishId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to permanently delete dish "${dishName}" from the platform?`)) return;
    try {
      setDeletingAdminDishId(dishId);
      const res = await fetch(`${API_BASE_URL}/v1/admin/products/${dishId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdminDishes((prev) => prev.filter((d) => d.id !== dishId));
        notifySuccess(`"${dishName}" deleted from platform.`);
      } else {
        notifyError("Failed to delete dish.");
      }
    } catch {
      notifyError("Network error deleting dish.");
    } finally {
      setDeletingAdminDishId(null);
    }
  };

  const handleDeleteAdminVideo = async (videoId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete video "${title}"?`)) return;
    try {
      setDeletingAdminVideoId(videoId);
      const res = await fetch(`${API_BASE_URL}/v1/admin/showcase-videos/${videoId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdminVideos((prev) => prev.filter((v) => v.id !== videoId));
        notifySuccess("Showcase video deleted.");
      } else {
        notifyError("Failed to delete video.");
      }
    } catch {
      notifyError("Network error deleting video.");
    } finally {
      setDeletingAdminVideoId(null);
    }
  };

  const handleCreateAdminVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!adminVideoForm.title.trim()) {
      notifyError("Title is required.");
      return;
    }
    if (!adminVideoFile && !adminVideoForm.video_url.trim()) {
      notifyError("Please select an MP4/WebM file to upload or enter a video stream URL.");
      return;
    }
    try {
      let res: Response;
      if (adminVideoFile) {
        const formData = new FormData();
        formData.append("title", adminVideoForm.title.trim());
        formData.append("caption", adminVideoForm.caption.trim());
        formData.append("video_file", adminVideoFile);
        if (adminVideoForm.thumbnail_url.trim()) {
          formData.append("thumbnail_url", adminVideoForm.thumbnail_url.trim());
        }
        if (adminVideoForm.shop) {
          formData.append("shop", adminVideoForm.shop);
        }
        formData.append("is_featured", "true");
        formData.append("is_active", "true");

        res = await fetch(`${API_BASE_URL}/v1/admin/showcase-videos/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        let finalUrl = adminVideoForm.video_url.trim();
        const driveMatch = finalUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          finalUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
        }

        const payload: any = {
          title: adminVideoForm.title.trim(),
          caption: adminVideoForm.caption.trim(),
          video_url: finalUrl,
          thumbnail_url: adminVideoForm.thumbnail_url.trim(),
          is_featured: true,
          is_active: true,
        };
        if (adminVideoForm.shop) {
          payload.shop = adminVideoForm.shop;
        }

        res = await fetch(`${API_BASE_URL}/v1/admin/showcase-videos/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        notifySuccess("Platform showcase video created successfully!");
        setAdminVideoForm({ title: "", caption: "", video_url: "", thumbnail_url: "", shop: "" });
        setAdminVideoFile(null);
        setIsAddAdminVideoOpen(false);
        fetchAdminVideos();
      } else {
        notifyError("Failed to create video.");
      }
    } catch {
      notifyError("Network error creating video.");
    }
  };


  // Customer Complaints & Disputes State
  const [adminTickets, setAdminTickets] = useState<AdminSupportTicketItem[]>([]);
  const [shopRankings, setShopRankings] = useState<ShopRankingItem[]>([]);
  const [adminTicketsLoading, setAdminTicketsLoading] = useState(false);
  const [adminTicketFilter, setAdminTicketFilter] = useState("ALL");
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [adminResolutionNotes, setAdminResolutionNotes] = useState<Record<string, string>>({});

  const fetchCmsSettings = useCallback(async () => {
    if (!token) return;
    try {
      setCmsLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/core/settings/`);
      if (res.ok) {
        const data = await res.json();
        setCmsSettings(data);
      }
    } catch {
      notifyError("Failed to fetch platform CMS settings.");
    } finally {
      setCmsLoading(false);
    }
  }, [token]);

  const fetchCoupons = useCallback(async () => {
    if (!token) return;
    try {
      setCouponsLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/coupons/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      notifyError("Failed to fetch coupons.");
    } finally {
      setCouponsLoading(false);
    }
  }, [token]);

  const handleToggleCoupon = async (id: string, currentActive: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) {
        notifySuccess(`Coupon ${!currentActive ? "activated" : "deactivated"} successfully.`);
        fetchCoupons();
      } else {
        notifyError("Failed to update coupon status.");
      }
    } catch {
      notifyError("Error updating coupon.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/coupons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCouponForm.code.trim().toUpperCase(),
          description: newCouponForm.description.trim(),
          discount_type: newCouponForm.discount_type,
          discount_value: parseFloat(newCouponForm.discount_value) || 0,
          min_order_value: parseFloat(newCouponForm.min_order_value) || 0,
          max_discount_amount: newCouponForm.max_discount_amount
            ? parseFloat(newCouponForm.max_discount_amount)
            : null,
          is_active: true,
        }),
      });
      if (res.ok) {
        notifySuccess(`Coupon ${newCouponForm.code.toUpperCase()} created successfully!`);
        setIsAddCouponOpen(false);
        setNewCouponForm({
          code: "",
          description: "",
          discount_type: "FLAT",
          discount_value: "50",
          min_order_value: "199",
          max_discount_amount: "",
        });
        fetchCoupons();
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to create coupon voucher.");
      }
    } catch {
      notifyError("Network error creating coupon.");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!token || !confirm("Delete this coupon voucher permanently?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        notifySuccess("Coupon voucher deleted.");
        fetchCoupons();
      }
    } catch {
      notifyError("Failed to delete coupon.");
    }
  };

  const fetchAdminReviews = useCallback(async () => {
    if (!token) return;
    try {
      setAdminReviewsLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminReviews(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      notifyError("Failed to fetch customer reviews.");
    } finally {
      setAdminReviewsLoading(false);
    }
  }, [token]);

  const handleToggleReviewApproval = async (id: string, currentApproved: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/reviews/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_approved: !currentApproved }),
      });
      if (res.ok) {
        notifySuccess(`Review ${!currentApproved ? "approved" : "hidden"}.`);
        fetchAdminReviews();
      }
    } catch {
      notifyError("Failed to update review status.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!token || !confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/reviews/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        notifySuccess("Review deleted.");
        fetchAdminReviews();
      }
    } catch {
      notifyError("Failed to delete review.");
    }
  };

  const handleSaveCmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setCmsSaving(true);
      let res: Response;
      const CMS_TEXT_FIELDS = [
        "curtain_enabled",
        "curtain_video_url",
        "curtain_badge",
        "curtain_headline",
        "curtain_tagline",
        "curtain_quote",
        "custom_logo_url",
        "hero_headline_primary",
        "hero_headline_highlight",
        "hero_subtitle",
        "hero_badge_left",
        "hero_badge_right",
        "hero_mascot_badge_1",
        "hero_mascot_badge_2",
        "hero_mascot_badge_bottom",
        "hero_mascot_image_url",
        "support_phone",
        "support_email",
        "support_whatsapp",
        "support_hours",
        "emergency_notice",
        "about_hero_title",
        "about_hero_subtitle",
        "about_street_title",
        "about_street_desc",
        "about_luxury_title",
        "about_luxury_desc",
        "about_kitchens_title",
        "about_kitchens_desc",
        "about_developer_title",
        "about_developer_desc",
      ];

      if (curtainVideoFile || customLogoFile || heroMascotImageFile) {
        const formData = new FormData();
        CMS_TEXT_FIELDS.forEach((key) => {
          const val = (cmsSettings as any)[key];
          if (val !== undefined && val !== null) {
            formData.append(key, String(val));
          }
        });
        if (curtainVideoFile) {
          formData.append("curtain_video_file", curtainVideoFile);
        }
        if (customLogoFile) {
          formData.append("custom_logo_file", customLogoFile);
        }
        if (heroMascotImageFile) {
          formData.append("hero_mascot_image_file", heroMascotImageFile);
        }

        res = await fetch(`${API_BASE_URL}/v1/admin/settings/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        const cleanPayload: Record<string, any> = {};
        CMS_TEXT_FIELDS.forEach((key) => {
          const val = (cmsSettings as any)[key];
          if (val !== undefined && val !== null) {
            cleanPayload[key] = val;
          }
        });

        res = await fetch(`${API_BASE_URL}/v1/admin/settings/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanPayload),
        });
      }

      if (res.ok) {
        const data = await res.json();
        notifySuccess("Platform & Curtain CMS settings updated successfully.");
        if (data.effective_curtain_video_url) {
          setCmsSettings((prev) => ({
            ...prev,
            effective_curtain_video_url: data.effective_curtain_video_url,
          }));
        }
        setCurtainVideoFile(null);
        setCustomLogoFile(null);
        setHeroMascotImageFile(null);
      } else {
        notifyError("Failed to update settings. Please verify inputs.");
      }
    } catch {
      notifyError("Network error saving settings.");
    } finally {
      setCmsSaving(false);
    }
  };

  const fetchAdminTickets = useCallback(async () => {
    if (!token) return;
    try {
      setAdminTicketsLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/support/tickets/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminTickets(data.tickets || []);
        setShopRankings(data.shop_complaint_ranking || []);
      }
    } catch {
      notifyError("Failed to fetch customer disputes.");
    } finally {
      setAdminTicketsLoading(false);
    }
  }, [token]);

  const handleAdminResolveTicket = async (ticketId: string) => {
    if (!token) return;
    setResolvingTicketId(ticketId);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/support/tickets/${ticketId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "RESOLVED",
          resolution_notes: adminResolutionNotes[ticketId] || "Resolved by platform supervisor.",
        }),
      });
      if (res.ok) {
        notifySuccess("Ticket resolved successfully.");
        fetchAdminTickets();
      } else {
        notifyError("Failed to update ticket.");
      }
    } catch {
      notifyError("Network error resolving ticket.");
    } finally {
      setResolvingTicketId(null);
    }
  };

  // Action Modals State
  const [selectedShop, setSelectedShop] = useState<AdminShopItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Toast Helpers
  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
    setTimeout(() => setActionError(null), 6000);
  };

  // =============================================================
  // DATA FETCHING
  // =============================================================

  const fetchOverview = useCallback(async () => {
    if (!token) return;
    try {
      setOverviewLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/overview/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      } else {
        notifyError("Failed to fetch platform metrics.");
      }
    } catch {
      notifyError("Network error fetching metrics.");
    } finally {
      setOverviewLoading(false);
    }
  }, [token]);

  const fetchShops = useCallback(
    async (statusFilter = shopStatusFilter, query = shopSearch) => {
      if (!token) return;
      try {
        setShopsLoading(true);
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== "ALL") {
          params.append("status", statusFilter);
        }
        if (query.trim()) {
          params.append("q", query.trim());
        }

        const res = await fetch(`${API_BASE_URL}/v1/admin/shops/?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setShops(data);
        } else {
          notifyError("Failed to fetch shops list.");
        }
      } catch {
        notifyError("Network error fetching shops.");
      } finally {
        setShopsLoading(false);
      }
    },
    [token, shopStatusFilter, shopSearch]
  );

  const fetchUsers = useCallback(
    async (role = userRoleFilter, active = userActiveFilter, query = userSearch) => {
      if (!token) return;
      try {
        setUsersLoading(true);
        const params = new URLSearchParams();
        if (role && role !== "ALL") {
          params.append("role", role);
        }
        if (active === "ACTIVE") {
          params.append("is_active", "true");
        } else if (active === "INACTIVE") {
          params.append("is_active", "false");
        }
        if (query.trim()) {
          params.append("q", query.trim());
        }

        const res = await fetch(`${API_BASE_URL}/v1/admin/users/?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data);
        } else {
          notifyError("Failed to fetch platform users.");
        }
      } catch {
        notifyError("Network error fetching users.");
      } finally {
        setUsersLoading(false);
      }
    },
    [token, userRoleFilter, userActiveFilter, userSearch]
  );

  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    try {
      setAuditLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/audit-logs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      } else {
        notifyError("Failed to fetch audit records.");
      }
    } catch {
      notifyError("Network error fetching audit logs.");
    } finally {
      setAuditLoading(false);
    }
  }, [token]);

  // Initial tab loading
  useEffect(() => {
    if (user?.role === "ADMIN") {
      queueMicrotask(() => {
        if (activeTab === "overview") fetchOverview();
        if (activeTab === "applications" || activeTab === "shops") fetchShops();
        if (activeTab === "users") fetchUsers();
        if (activeTab === "audit") fetchAuditLogs();
      });
    }
  }, [user, activeTab, fetchOverview, fetchShops, fetchUsers, fetchAuditLogs]);

  // Handle Application Approval
  const handleApproveShop = async () => {
    if (!selectedShop || !token) return;
    try {
      setModalSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/shops/${selectedShop.id}/approve/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_review_notes: reviewNotes.trim() }),
      });

      if (res.ok) {
        notifySuccess(`Shop "${selectedShop.name}" has been approved.`);
        setIsApproveModalOpen(false);
        setSelectedShop(null);
        setReviewNotes("");
        fetchShops();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to approve shop.");
      }
    } catch {
      notifyError("Network error executing approval.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Application Rejection
  const handleRejectShop = async () => {
    if (!selectedShop || !token) return;
    if (!reviewNotes.trim()) {
      notifyError("Please provide constructive review notes explaining the rejection.");
      return;
    }
    try {
      setModalSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/shops/${selectedShop.id}/reject/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_review_notes: reviewNotes.trim() }),
      });

      if (res.ok) {
        notifySuccess(`Shop "${selectedShop.name}" application rejected.`);
        setIsRejectModalOpen(false);
        setSelectedShop(null);
        setReviewNotes("");
        fetchShops();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to reject shop application.");
      }
    } catch {
      notifyError("Network error executing rejection.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Shop Suspension
  const handleSuspendShop = async () => {
    if (!selectedShop || !token) return;
    try {
      setModalSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/v1/admin/shops/${selectedShop.id}/suspend/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: suspendReason.trim() }),
      });

      if (res.ok) {
        notifySuccess(`Shop "${selectedShop.name}" has been suspended. Live orders halted.`);
        setIsSuspendModalOpen(false);
        setSelectedShop(null);
        setSuspendReason("");
        fetchShops();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to suspend shop.");
      }
    } catch {
      notifyError("Network error executing suspension.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Shop Reactivation
  const handleReactivateShop = async (shop: AdminShopItem) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/shops/${shop.id}/reactivate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        notifySuccess(`Shop "${shop.name}" reactivated successfully.`);
        fetchShops();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to reactivate shop.");
      }
    } catch {
      notifyError("Network error reactivating shop.");
    }
  };

  // Handle User Status Toggle
  const handleToggleUserActive = async (targetUser: AdminUserItem) => {
    if (!token) return;
    if (targetUser.id === user?.id) {
      notifyError("Self-deactivation is prohibited for administrators.");
      return;
    }

    const nextState = !targetUser.is_active;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/admin/users/${targetUser.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: nextState }),
      });

      if (res.ok) {
        notifySuccess(
          `User "${targetUser.username}" ${nextState ? "activated" : "deactivated"} successfully.`
        );
        fetchUsers();
        fetchOverview();
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to update user status.");
      }
    } catch {
      notifyError("Network error updating user status.");
    }
  };

  // =============================================================
  // ROUTE GUARDS & ACCESS CONTROL
  // =============================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-brand-charcoal">Verifying platform administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login?redirect=/admin");
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-md text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-brand-charcoal mb-2">Access Denied</h2>
          <p className="text-xs text-brand-muted leading-relaxed mb-6">
            Administrator privileges are strictly required to access the Platform Control Center.
            You are currently signed in as a <strong className="text-brand-charcoal uppercase">{user.role}</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-brand-charcoal text-white rounded-full text-xs font-bold hover:bg-brand-orange transition-colors"
            >
              Return to Storefront
            </Link>
            {user.role === "VENDOR" && (
              <Link
                href="/vendor/dashboard"
                className="w-full py-2.5 px-4 bg-brand-surface text-brand-charcoal border border-brand-border rounded-full text-xs font-bold hover:border-brand-orange transition-colors"
              >
                Go to Vendor Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER ADMIN PORTAL
  // =============================================================

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-brand-charcoal pb-16">
      {/* Top Header Banner */}
      <div className="bg-brand-charcoal text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administrator Portal
                </span>
                <span className="text-xs text-zinc-400 font-mono">BHUKKAD VERSE v2.1</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Platform Control Center</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Authoritative governance, vendor onboarding, operations monitoring & compliance records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{user.username}</p>
                <p className="text-[10px] text-zinc-400 font-mono">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "overview") fetchOverview();
                  if (activeTab === "applications" || activeTab === "shops") fetchShops();
                  if (activeTab === "users") fetchUsers();
                  if (activeTab === "audit") fetchAuditLogs();
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                title="Refresh current tab"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Platform Overview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("applications");
                setShopStatusFilter("PENDING");
                fetchShops("PENDING", shopSearch);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
                activeTab === "applications"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Vendor Applications</span>
              {overview && overview.shops.pending > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center">
                  {overview.shops.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("shops");
                setShopStatusFilter("ALL");
                fetchShops("ALL", shopSearch);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "shops"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Kitchens Directory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "users"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & Role Governance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "audit"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("complaints");
                fetchAdminTickets();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
                activeTab === "complaints"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Complaints & Disputes</span>
              {adminTickets.filter((t) => t.status === "OPEN").length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {adminTickets.filter((t) => t.status === "OPEN").length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("coupons");
                fetchCoupons();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "coupons"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Coupons & Discounts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("reviews");
                fetchAdminReviews();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "reviews"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Platform Reviews</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("settings");
                fetchCmsSettings();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "settings"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Curtain & CMS Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("dishes");
                fetchAdminDishes();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "dishes"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>Dishes Catalog ({adminDishes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("videos");
                fetchAdminVideos();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "videos"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-brand-orange" />
              <span>Showcase Video Reels ({adminVideos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("financials");
                fetchFinancials();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === "financials"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financials & Commissions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Toast Alerts */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold">{actionSuccess}</p>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-xs font-bold">{actionError}</p>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1: PLATFORM OVERVIEW                                      */}
        {/* ============================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {overviewLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-brand-muted">Loading platform database metrics...</p>
              </div>
            ) : overview ? (
              <>
                {/* Metrics Cards Grid */}
                <div>
                  <h2 className="text-base font-extrabold text-brand-charcoal mb-4 flex items-center gap-2">
                    <Store className="w-4 h-4 text-brand-orange" />
                    Kitchens & Onboarding Health
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-xs">
                      <p className="text-[11px] font-bold text-brand-muted uppercase">Total Kitchens</p>
                      <p className="text-2xl font-black text-brand-charcoal mt-1">{overview.shops.total}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">All registered partner shops</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-amber-800 uppercase">Pending Review</p>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-2xl font-black text-amber-900 mt-1">{overview.shops.pending}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("applications");
                          setShopStatusFilter("PENDING");
                          fetchShops("PENDING");
                        }}
                        className="text-[10px] font-extrabold text-amber-700 hover:underline mt-1 inline-flex items-center gap-0.5"
                      >
                        Review Now <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-emerald-800 uppercase">Approved & Active</p>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-black text-emerald-900 mt-1">{overview.shops.approved}</p>
                      <p className="text-[10px] text-emerald-700 mt-1">Live customer storefronts</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-purple-800 uppercase">Suspended</p>
                        <Ban className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-black text-purple-900 mt-1">{overview.shops.suspended}</p>
                      <p className="text-[10px] text-purple-700 mt-1">Halted orders intake</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-red-800 uppercase">Rejected</p>
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-2xl font-black text-red-900 mt-1">{overview.shops.rejected}</p>
                      <p className="text-[10px] text-red-700 mt-1">Unsuccessful applications</p>
                    </div>
                  </div>
                </div>

                {/* Users Metric Cards Grid */}
                <div className="pt-4">
                  <h2 className="text-base font-extrabold text-brand-charcoal mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    User Directory & Roles Distribution
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-xs col-span-2">
                      <p className="text-[11px] font-bold text-brand-muted uppercase">Total Platform Accounts</p>
                      <p className="text-2xl font-black text-brand-charcoal mt-1">{overview.users.total}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-2">
                        <span className="text-emerald-700 font-bold">● {overview.users.active} Active</span>
                        <span className="text-red-700 font-bold">● {overview.users.inactive} Deactivated</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-xs">
                      <p className="text-[11px] font-bold text-emerald-800 uppercase">Customers</p>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{overview.users.customers}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Consumer accounts</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-xs">
                      <p className="text-[11px] font-bold text-amber-800 uppercase">Vendors</p>
                      <p className="text-2xl font-black text-brand-orange mt-1">{overview.users.vendors}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Merchant accounts</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-xs">
                      <p className="text-[11px] font-bold text-purple-800 uppercase">Administrators</p>
                      <p className="text-2xl font-black text-purple-700 mt-1">{overview.users.admins}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Platform operators</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-brand-border/80 shadow-xs flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-zinc-700 uppercase">Audit Records</p>
                        <p className="text-xs text-zinc-500 mt-1">Full compliance logging</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("audit")}
                        className="text-xs font-extrabold text-purple-700 hover:underline flex items-center gap-1 mt-2"
                      >
                        View Logs <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Action Banner */}
                <div className="p-6 rounded-3xl bg-linear-to-r from-purple-900 to-indigo-950 text-white shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">Vendor Moderation Pending</h3>
                      <p className="text-xs text-purple-200 mt-1 max-w-xl">
                        {overview.shops.pending > 0
                          ? `There are ${overview.shops.pending} vendor applications awaiting review and document verification.`
                          : "All vendor registration applications have been reviewed. Outstanding queue is clear."}
                      </p>
                    </div>
                    {overview.shops.pending > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("applications");
                          setShopStatusFilter("PENDING");
                          fetchShops("PENDING");
                        }}
                        className="px-5 py-2.5 rounded-full bg-white text-purple-950 text-xs font-black hover:bg-purple-100 transition-colors shrink-0"
                      >
                        Inspect Pending Applications
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: VENDOR APPLICATIONS                                    */}
        {/* ============================================================= */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {/* Header and Filter Controls */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShopStatusFilter("PENDING");
                    fetchShops("PENDING", shopSearch);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    shopStatusFilter === "PENDING"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Pending Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShopStatusFilter("ALL");
                    fetchShops("ALL", shopSearch);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    shopStatusFilter === "ALL"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  All Applications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShopStatusFilter("APPROVED");
                    fetchShops("APPROVED", shopSearch);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    shopStatusFilter === "APPROVED"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Approved
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShopStatusFilter("REJECTED");
                    fetchShops("REJECTED", shopSearch);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    shopStatusFilter === "REJECTED"
                      ? "bg-red-100 text-red-900 border border-red-300"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Rejected
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 max-w-xs w-full">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchShops(shopStatusFilter, shopSearch);
                    }}
                    placeholder="Search by kitchen or city..."
                    className="w-full text-xs pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchShops(shopStatusFilter, shopSearch)}
                  className="px-3 py-2 bg-brand-charcoal text-white rounded-xl text-xs font-bold hover:bg-brand-orange transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Applications List */}
            {shopsLoading ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-brand-border">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-brand-muted">Loading vendor applications...</p>
              </div>
            ) : shops.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-brand-border p-6">
                <FileCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-brand-charcoal">No Applications Found</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  There are currently no vendor onboarding applications matching the selected criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="p-5 rounded-2xl bg-white border border-brand-border/80 shadow-xs hover:border-brand-orange/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-brand-charcoal">{shop.name}</h3>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            shop.status === "PENDING"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : shop.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : shop.status === "SUSPENDED"
                              ? "bg-purple-50 text-purple-800 border-purple-300"
                              : "bg-red-50 text-red-800 border-red-300"
                          }`}
                        >
                          {shop.status_display || shop.status}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Applied: {new Date(shop.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-brand-muted line-clamp-2">{shop.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 pt-1">
                        <span>
                          <strong>Location:</strong> {shop.address_line}, {shop.city} - {shop.postal_code}
                        </span>
                        <span>
                          <strong>Contact:</strong> {shop.phone} | {shop.email}
                        </span>
                      </div>

                      {shop.admin_review_notes && (
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 mt-2">
                          <span className="font-bold text-zinc-900">Review Notes: </span>
                          {shop.admin_review_notes}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                      {shop.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShop(shop);
                              setReviewNotes("");
                              setIsApproveModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShop(shop);
                              setReviewNotes("");
                              setIsRejectModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {shop.status === "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShop(shop);
                            setReviewNotes("Application reconsidered and approved by administration.");
                            setIsApproveModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reconsider & Approve</span>
                        </button>
                      )}

                      {shop.status === "APPROVED" && (
                        <Link
                          href={`/shops/${shop.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Public Page</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: SHOPS DIRECTORY                                        */}
        {/* ============================================================= */}
        {activeTab === "shops" && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-brand-charcoal">All Platform Kitchens</h2>
                <p className="text-[11px] text-zinc-500">Live operational statuses and kitchen safety controls.</p>
              </div>

              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchShops("ALL", shopSearch);
                    }}
                    placeholder="Search by kitchen, city, or owner..."
                    className="w-full text-xs pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchShops("ALL", shopSearch)}
                  className="px-3 py-2 bg-brand-charcoal text-white rounded-xl text-xs font-bold hover:bg-brand-orange transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Shops Table / Cards */}
            {shopsLoading ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-brand-border">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-brand-muted">Fetching platform shops...</p>
              </div>
            ) : shops.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-brand-border p-6">
                <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-brand-charcoal">No Kitchens Found</h3>
                <p className="text-xs text-zinc-500 mt-1">No kitchens match your current search query.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-brand-border/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-600 font-extrabold uppercase border-b border-brand-border text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Kitchen Name</th>
                        <th className="px-4 py-3">City & Address</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Live Ordering</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {shops.map((shop) => (
                        <tr key={shop.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-extrabold text-brand-charcoal">{shop.name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">/{shop.slug}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-zinc-800">{shop.city}</p>
                            <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{shop.address_line}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                shop.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : shop.status === "SUSPENDED"
                                  ? "bg-purple-50 text-purple-800 border-purple-300"
                                  : shop.status === "PENDING"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-red-50 text-red-800 border-red-300"
                              }`}
                            >
                              {shop.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {shop.status === "APPROVED" ? (
                              shop.is_accepting_orders ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Accepting
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Paused
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-zinc-400 font-semibold">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-zinc-700">{shop.phone}</p>
                            <p className="text-[10px] text-zinc-400">{shop.email}</p>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            {shop.status === "APPROVED" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setSuspendReason("");
                                  setIsSuspendModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                              >
                                <Ban className="w-3 h-3 text-purple-600" />
                                <span>Suspend</span>
                              </button>
                            )}

                            {shop.status === "SUSPENDED" && (
                              <button
                                type="button"
                                onClick={() => handleReactivateShop(shop)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-600" />
                                <span>Reactivate</span>
                              </button>
                            )}

                            {shop.status === "APPROVED" && (
                              <Link
                                href={`/shops/${shop.slug}`}
                                target="_blank"
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-1 text-[11px]"
                                title="Open customer page"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: USERS & ROLE GOVERNANCE                                */}
        {/* ============================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-brand-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 mr-1">Role:</span>
                {(["ALL", "CUSTOMER", "VENDOR", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setUserRoleFilter(r);
                      fetchUsers(r, userActiveFilter, userSearch);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      userRoleFilter === r
                        ? "bg-purple-600 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {r === "ALL" ? "All Roles" : r}
                  </button>
                ))}

                <span className="text-zinc-300 mx-1">|</span>

                <span className="text-xs font-bold text-zinc-500 mr-1">Status:</span>
                {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setUserActiveFilter(s);
                      fetchUsers(userRoleFilter, s, userSearch);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      userActiveFilter === s
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {s === "ALL" ? "All States" : s}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 max-w-xs w-full">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchUsers(userRoleFilter, userActiveFilter, userSearch);
                    }}
                    placeholder="Search by name, email, phone..."
                    className="w-full text-xs pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchUsers(userRoleFilter, userActiveFilter, userSearch)}
                  className="px-3 py-2 bg-brand-charcoal text-white rounded-xl text-xs font-bold hover:bg-brand-orange transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-brand-border">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-brand-muted">Fetching platform user records...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-brand-border p-6">
                <Users className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-brand-charcoal">No Users Match</h3>
                <p className="text-xs text-zinc-500 mt-1">Try broadening your search or resetting filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-brand-border/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-600 font-extrabold uppercase border-b border-brand-border text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Account</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Shop Linkage</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Registered On</th>
                        <th className="px-4 py-3 text-right">Account Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {usersList.map((u) => {
                        const isSelf = u.id === user?.id;
                        return (
                          <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-extrabold text-brand-charcoal">
                                {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                                {isSelf && (
                                  <span className="ml-1.5 text-[9px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-sm">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono">@{u.username} • {u.email}</p>
                            </td>

                            <td className="px-4 py-3.5">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  u.role === "ADMIN"
                                    ? "bg-purple-50 text-purple-800 border-purple-300"
                                    : u.role === "VENDOR"
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              {u.has_shop ? (
                                <div>
                                  <span className="font-semibold text-zinc-800">Shop Attached</span>
                                  <p className="text-[10px] text-zinc-400">Status: {u.shop_status}</p>
                                </div>
                              ) : (
                                <span className="text-[11px] text-zinc-400 font-semibold">—</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-zinc-500 text-[11px]">
                              {new Date(u.date_joined).toLocaleDateString()}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => handleToggleUserActive(u)}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-colors text-[11px] ${
                                  isSelf
                                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                    : u.is_active
                                    ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                }`}
                                title={isSelf ? "Self-deactivation is prohibited" : undefined}
                              >
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: AUDIT TRAIL                                            */}
        {/* ============================================================= */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-brand-border/80 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-brand-charcoal">Administrative Audit History</h2>
                <p className="text-[11px] text-zinc-500">Immutable log of moderation decisions and status transitions.</p>
              </div>

              <button
                type="button"
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 transition-colors text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Log</span>
              </button>
            </div>

            {auditLoading ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-brand-border">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-brand-muted">Loading audit records...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-brand-border p-6">
                <History className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-brand-charcoal">No Audit Records Yet</h3>
                <p className="text-xs text-zinc-500 mt-1">Administrative actions will appear here automatically.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-brand-border/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-600 font-extrabold uppercase border-b border-brand-border text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Admin</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Details / Reason</th>
                        <th className="px-4 py-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-brand-charcoal">{log.admin_username}</span>
                            <span className="text-[10px] text-zinc-400 block font-mono">{log.admin_email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                log.action.includes("APPROVE") || log.action.includes("REACTIVATE")
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : log.action.includes("REJECT") || log.action.includes("SUSPEND")
                                  ? "bg-red-50 text-red-800 border-red-300"
                                  : "bg-purple-50 text-purple-800 border-purple-300"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-zinc-800">{log.target_repr || log.target_id}</span>
                            <span className="text-[10px] text-zinc-400 block uppercase font-mono">
                              Type: {log.target_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs text-zinc-600 truncate" title={log.details}>
                            {log.details || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-zinc-400">
                            {log.ip_address || "Internal"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 6: CUSTOMER COMPLAINTS & SHOP DISPUTES                    */}
        {/* ============================================================= */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold">Shop-Wise Customer Complaints</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                    {adminTickets.filter((t) => t.status === "OPEN").length} Open Disputes
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Monitor dispute frequency across all kitchen partners to identify high-complaint vendors.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAdminTickets}
                disabled={adminTicketsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${adminTicketsLoading ? "animate-spin" : ""}`} />
                <span>Refresh Complaints</span>
              </button>
            </div>

            {/* Shop Complaint Frequency Leaderboard */}
            <div className="bg-white p-6 rounded-2xl border border-brand-border space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-orange" />
                <span>Kitchens with Most Complaints (Dispute Frequency Ranking)</span>
              </h3>

              {shopRankings.length === 0 ? (
                <p className="text-xs text-brand-muted">No complaints recorded against any kitchen partner.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {shopRankings.map((sr, idx) => (
                    <div
                      key={sr.shop__id}
                      className="p-4 rounded-xl border border-brand-border bg-brand-surface/40 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 block">Rank #{idx + 1}</span>
                        <h4 className="text-xs font-black text-brand-charcoal line-clamp-1">{sr.shop__name}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black">
                        {sr.complaint_count} {sr.complaint_count === 1 ? "issue" : "issues"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-brand-border flex items-center justify-between">
                <span className="text-xs font-black text-brand-charcoal">
                  All Support Tickets ({adminTickets.length})
                </span>

                <div className="flex items-center gap-2">
                  {(["ALL", "OPEN", "RESOLVED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAdminTicketFilter(st)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        adminTicketFilter === st
                          ? "bg-purple-600 text-white"
                          : "bg-brand-surface text-brand-muted hover:text-brand-charcoal"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {adminTicketsLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-brand-muted">Loading customer disputes...</p>
                </div>
              ) : adminTickets.length === 0 ? (
                <div className="p-12 text-center text-xs text-brand-muted">
                  No support tickets found matching your filter.
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {adminTickets
                    .filter((t) => adminTicketFilter === "ALL" || t.status === adminTicketFilter)
                    .map((ticket) => (
                      <div key={ticket.id} className="p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-brand-charcoal bg-zinc-100 px-2.5 py-0.5 rounded-full">
                              #{ticket.ticket_number}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                ticket.status === "OPEN"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {ticket.status_display || ticket.status}
                            </span>
                            <span className="text-xs font-bold text-purple-700">
                              Kitchen: {ticket.shop_name || "General Platform"}
                            </span>
                          </div>

                          <span className="text-[11px] text-zinc-400">
                            {new Date(ticket.created_at).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-brand-charcoal">{ticket.subject}</h4>
                          <p className="text-xs text-brand-muted mt-1 bg-zinc-50 p-3 rounded-xl border border-zinc-200 leading-relaxed">
                            {ticket.message}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                          <span>Customer: <strong>{ticket.customer_name}</strong></span>
                          <span>•</span>
                          <span>Phone: <strong>{ticket.customer_phone}</strong></span>
                          <span>•</span>
                          <span>Email: <strong>{ticket.customer_email}</strong></span>
                          {ticket.order_id && (
                            <>
                              <span>•</span>
                              <span>Order: <strong>{ticket.order_id}</strong></span>
                            </>
                          )}
                        </div>

                        {ticket.status === "RESOLVED" ? (
                          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs">
                            <strong>Resolution:</strong> {ticket.resolution_notes || "Resolved"}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-brand-border">
                            <input
                              type="text"
                              placeholder="Enter administrative resolution notes..."
                              value={adminResolutionNotes[ticket.id] || ""}
                              onChange={(e) =>
                                setAdminResolutionNotes({
                                  ...adminResolutionNotes,
                                  [ticket.id]: e.target.value,
                                })
                              }
                              className="flex-1 text-xs px-3.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200"
                            />
                            <button
                              type="button"
                              disabled={resolvingTicketId === ticket.id}
                              onClick={() => handleAdminResolveTicket(ticket.id)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {resolvingTicketId === ticket.id ? "Resolving..." : "Mark Resolved"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
          {/* ============================================================= */}
        {/* TAB: COUPONS & DISCOUNT VOUCHERS MANAGEMENT                  */}
        {/* ============================================================= */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  <span>Promo Coupons &amp; Discount Vouchers</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Control which vouchers can be applied at checkout. Enable, disable, create, or delete promo codes live.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCouponOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Coupon</span>
              </button>
            </div>

            {/* Coupons List */}
            {couponsLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-brand-border">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-brand-border text-xs font-bold text-brand-muted">
                No active or historical coupon vouchers found. Click &quot;Create New Coupon&quot; to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                      c.is_active
                        ? "bg-white border-purple-200 shadow-sm"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black tracking-wider px-3 py-1 rounded-xl bg-purple-100 text-purple-800 font-mono">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c.id, c.is_active)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            c.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {c.is_active ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div>
                        <div className="text-xl font-black text-brand-charcoal">
                          {c.discount_type === "FLAT" ? `₹${c.discount_value} OFF` : `${c.discount_value}% OFF`}
                        </div>
                        <p className="text-xs text-brand-muted mt-1">{c.description || "Valid on all eligible orders."}</p>
                      </div>

                      <div className="pt-3 border-t border-brand-border/60 text-xs text-brand-muted space-y-1">
                        <div className="flex justify-between">
                          <span>Min. Order Value:</span>
                          <strong className="text-brand-charcoal">₹{c.min_order_value}</strong>
                        </div>
                        {c.max_discount_amount && (
                          <div className="flex justify-between">
                            <span>Max Cap:</span>
                            <strong className="text-brand-charcoal">₹{c.max_discount_amount}</strong>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px]">
                          <span>Times Redeemed:</span>
                          <span className="font-bold">{c.usage_count} orders</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-brand-border/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c.id, c.is_active)}
                        className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                      >
                        {c.is_active ? "Turn Off Voucher" : "Enable Voucher"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-tomato hover:bg-red-50 cursor-pointer"
                        title="Delete voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Coupon Modal */}
            {isAddCouponOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-white rounded-3xl border border-brand-border max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
                  <button
                    type="button"
                    onClick={() => setIsAddCouponOpen(false)}
                    className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-brand-charcoal">Create Promo Coupon</h3>
                      <p className="text-xs text-brand-muted">
                        Set voucher code, discount amount, and order threshold.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-brand-charcoal mb-1">
                        Coupon Code (Uppercase)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MONSOON50"
                        value={newCouponForm.code}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                        className="w-full text-xs font-mono font-black uppercase px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-brand-charcoal mb-1">
                          Discount Type
                        </label>
                        <select
                          value={newCouponForm.discount_type}
                          onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_type: e.target.value })}
                          className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-brand-border bg-white"
                        >
                          <option value="FLAT">Flat ₹ Amount</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-brand-charcoal mb-1">
                          Discount Value
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="50"
                          value={newCouponForm.discount_value}
                          onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_value: e.target.value })}
                          className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-brand-charcoal mb-1">
                          Min. Order Value (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="199"
                          value={newCouponForm.min_order_value}
                          onChange={(e) => setNewCouponForm({ ...newCouponForm, min_order_value: e.target.value })}
                          className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-brand-charcoal mb-1">
                          Max Cap (₹, Optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="200"
                          value={newCouponForm.max_discount_amount}
                          onChange={(e) => setNewCouponForm({ ...newCouponForm, max_discount_amount: e.target.value })}
                          className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-brand-charcoal mb-1">
                        Offer Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₹50 OFF on orders above ₹199"
                        value={newCouponForm.description}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, description: e.target.value })}
                        className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-surface"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer transition-all"
                    >
                      Publish Voucher
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB: PLATFORM REVIEWS & COMMUNITY MODERATION                  */}
        {/* ============================================================= */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>Platform Customer Reviews Moderation</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Moderate, feature, or delete verified customer feedback appearing on the homepage and reviews board.
              </p>
            </div>

            {adminReviewsLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-brand-border">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              </div>
            ) : adminReviews.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-brand-border text-xs font-bold text-brand-muted">
                No customer reviews submitted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 rounded-3xl bg-white border border-brand-border shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleReviewApproval(rev.id, rev.is_approved)}
                          className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            rev.is_approved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rev.is_approved ? "Approved" : "Pending"}
                        </button>
                      </div>

                      <h4 className="text-sm font-black text-brand-charcoal">
                        &ldquo;{rev.headline}&rdquo;
                      </h4>
                      <p className="text-xs text-brand-muted line-clamp-4 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs">
                      <div>
                        <strong className="block text-brand-charcoal">{rev.author_name}</strong>
                        <span className="text-[10px] text-brand-muted">{rev.city} • {rev.author_role}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-tomato hover:bg-red-50 cursor-pointer"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* TAB 7: ENTRANCE CURTAIN & PLATFORM CMS SETTINGS               */}
        {/* ============================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-white space-y-1">
              <h2 className="text-base font-extrabold">Entrance Curtain &amp; Live Support CMS</h2>
              <p className="text-xs text-zinc-400">
                Configure the background looping video, headline, brand quote, and live customer helpline channels. Changes appear instantly across the platform.
              </p>
            </div>

            <form onSubmit={handleSaveCmsSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-border space-y-6 shadow-xs">
              <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-wider pb-2 border-b border-brand-border">
                1. Entrance Curtain &amp; Cinematic Video / Animation
              </h3>

              <div className="space-y-4">
                {/* Curtain Master Switch */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface/70 border border-brand-border">
                  <div>
                    <span className="text-xs font-black uppercase text-brand-charcoal block">
                      Front-Page Entrance Curtain
                    </span>
                    <span className="text-[11px] text-brand-muted">
                      Show or hide the theatrical rolling shutter curtain when users land on the homepage.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCmsSettings({ ...cmsSettings, curtain_enabled: !cmsSettings.curtain_enabled })}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      cmsSettings.curtain_enabled !== false
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-300 text-zinc-700"
                    }`}
                  >
                    {cmsSettings.curtain_enabled !== false ? "Enabled (Visible)" : "Disabled (Hidden)"}
                  </button>
                </div>

                {/* Device Video File Upload OR Web URL */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <label className="text-xs font-black uppercase text-brand-charcoal block">
                    Curtain Background Video (Device File Upload OR Web URL)
                  </label>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-600 block">Option A: Upload Video directly from your Device (MP4 / WebM)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => setCurtainVideoFile(e.target.files?.[0] || null)}
                      className="w-full text-xs p-2 rounded-xl bg-white border border-zinc-300 cursor-pointer"
                    />
                    {curtainVideoFile && (
                      <span className="text-[11px] text-emerald-600 font-bold block">
                        Selected file: {curtainVideoFile.name} ({(curtainVideoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>

                  {/* Live Video Player Preview for Admin */}
                  {(cmsSettings.effective_curtain_video_url || cmsSettings.curtain_video_url) && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-black border border-white/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-brand-amber flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Active Curtain Video Preview</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate max-w-xs">
                          {cmsSettings.effective_curtain_video_url || cmsSettings.curtain_video_url}
                        </span>
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                        <video
                          key={cmsSettings.effective_curtain_video_url || cmsSettings.curtain_video_url}
                          src={getMediaUrl(cmsSettings.effective_curtain_video_url || cmsSettings.curtain_video_url)}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Plays seamlessly behind the grand entrance curtain. Verify looping and visual clarity above.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-zinc-200">
                    <span className="text-[11px] font-bold text-zinc-600 block">Option B: Direct Video Stream URL</span>
                    <input
                      type="url"
                      value={cmsSettings.curtain_video_url}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, curtain_video_url: e.target.value })}
                      placeholder="https://assets.mixkit.co/.../video.mp4"
                      className="w-full text-xs p-3 rounded-xl bg-white border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Direct MP4 or WebM video stream that loops silently behind the grand entrance curtain.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                      Curtain Badge
                    </label>
                    <input
                      type="text"
                      value={cmsSettings.curtain_badge}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, curtain_badge: e.target.value })}
                      placeholder="e.g. BHUKKAD VERSE ARCHWAY"
                      className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                      Curtain Headline
                    </label>
                    <input
                      type="text"
                      value={cmsSettings.curtain_headline}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, curtain_headline: e.target.value })}
                      placeholder="e.g. BHUKKAD VERSE"
                      className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Brand Tagline / Motto
                  </label>
                  <input
                    type="text"
                    value={cmsSettings.curtain_tagline}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, curtain_tagline: e.target.value })}
                    placeholder="e.g. YOUR CRAVINGS. YOUR UNIVERSE."
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Brand Story &amp; Quote
                  </label>
                  <textarea
                    rows={3}
                    value={cmsSettings.curtain_quote}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, curtain_quote: e.target.value })}
                    placeholder="Inspiring culinary quote displayed prominently on the entrance veil..."
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 4. About Us Page Story & Pillars (Dynamic CMS) */}
              <div className="pt-6 border-t border-brand-border space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                  <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-orange" />
                    <span>About Us Page Dynamic CMS</span>
                  </h3>
                  <span className="text-[11px] font-bold text-zinc-500">Live on /about</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Hero Primary Title
                    </label>
                    <input
                      type="text"
                      value={cmsSettings.about_hero_title || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_hero_title: e.target.value })}
                      placeholder="One Universe for All Your Cravings"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Hero Subtitle / Brand Mission
                    </label>
                    <textarea
                      rows={2}
                      value={cmsSettings.about_hero_subtitle || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_hero_subtitle: e.target.value })}
                      placeholder="Born from an unbridled passion for authentic flavors..."
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <span className="text-[11px] font-black uppercase text-brand-charcoal block">
                      1. Street Food Pillar
                    </span>
                    <input
                      type="text"
                      value={cmsSettings.about_street_title || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_street_title: e.target.value })}
                      placeholder="Iconic Street Food & Legendary Carts"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border text-xs bg-white"
                    />
                    <textarea
                      rows={2}
                      value={cmsSettings.about_street_desc || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_street_desc: e.target.value })}
                      placeholder="Deep-rooted recipes from traditional chaat corners..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border text-[11px] bg-white"
                    />
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <span className="text-[11px] font-black uppercase text-amber-700 block">
                      2. Luxury Fine Dining Pillar
                    </span>
                    <input
                      type="text"
                      value={cmsSettings.about_luxury_title || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_luxury_title: e.target.value })}
                      placeholder="Luxury Fine Dining & Hotels"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border text-xs bg-white"
                    />
                    <textarea
                      rows={2}
                      value={cmsSettings.about_luxury_desc || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_luxury_desc: e.target.value })}
                      placeholder="Partnering with royal Mughlai heritage dining rooms..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border text-[11px] bg-white"
                    />
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <span className="text-[11px] font-black uppercase text-emerald-700 block">
                      3. Fresh Kitchens Pillar
                    </span>
                    <input
                      type="text"
                      value={cmsSettings.about_kitchens_title || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_kitchens_title: e.target.value })}
                      placeholder="Fresh Neighborhood Kitchens"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border text-xs bg-white"
                    />
                    <textarea
                      rows={2}
                      value={cmsSettings.about_kitchens_desc || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_kitchens_desc: e.target.value })}
                      placeholder="Pure homestyle comfort cooked fresh every single day..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border text-[11px] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Creator Spotlight Title
                    </label>
                    <input
                      type="text"
                      value={cmsSettings.about_developer_title || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_developer_title: e.target.value })}
                      placeholder="Crafted with Passion by Ayush Saxena"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Creator Description
                    </label>
                    <textarea
                      rows={2}
                      value={cmsSettings.about_developer_desc || ""}
                      onChange={(e) => setCmsSettings({ ...cmsSettings, about_developer_desc: e.target.value })}
                      placeholder="Bhukkad Verse was engineered from ground up as a modern..."
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-wider pt-4 pb-2 border-b border-brand-border">
                2. Live Customer Support Desk Channels
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Support Hotline Phone
                  </label>
                  <input
                    type="text"
                    value={cmsSettings.support_phone}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, support_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    WhatsApp Concierge Number
                  </label>
                  <input
                    type="text"
                    value={cmsSettings.support_whatsapp}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, support_whatsapp: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={cmsSettings.support_email}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, support_email: e.target.value })}
                    placeholder="support@bhukkadverse.com"
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                    Operational Support Hours
                  </label>
                  <input
                    type="text"
                    value={cmsSettings.support_hours}
                    onChange={(e) => setCmsSettings({ ...cmsSettings, support_hours: e.target.value })}
                    placeholder="10:00 AM - 03:00 AM Daily"
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-brand-charcoal block mb-1">
                  Emergency Notice Banner (Optional - Leave blank to hide)
                </label>
                <input
                  type="text"
                  value={cmsSettings.emergency_notice}
                  onChange={(e) => setCmsSettings({ ...cmsSettings, emergency_notice: e.target.value })}
                  placeholder="e.g. Heavy rainfall in Delhi may cause 10-15 minute delivery delays today."
                  className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-brand-border flex justify-end">
                <button
                  type="submit"
                  disabled={cmsSaving}
                  className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {cmsSaving ? "Saving Live CMS Settings..." : "Save Platform CMS Settings"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL: APPROVE SHOP APPLICATION                               */}
      {/* ============================================================= */}
      {isApproveModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-border space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-brand-charcoal">Approve Vendor Kitchen</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                You are approving <strong>{selectedShop.name}</strong> to go live on the BHUKKAD VERSE platform.
              </p>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 mt-2 text-xs space-y-1 text-zinc-700">
                <p><strong>City:</strong> {selectedShop.city}</p>
                <p><strong>Phone:</strong> {selectedShop.phone}</p>
                <p><strong>Email:</strong> {selectedShop.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-charcoal">
                Approval Notes / Onboarding Guidance (Optional)
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Approved after verifying FSSAI registration. Welcome to Bhukkad Verse!"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalSubmitting}
                onClick={handleApproveShop}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {modalSubmitting ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: REJECT SHOP APPLICATION                                */}
      {/* ============================================================= */}
      {isRejectModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-border space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-brand-charcoal">Reject Vendor Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Rejecting application for <strong>{selectedShop.name}</strong>. The vendor will be notified and can
                view your feedback to address missing requirements.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-charcoal">
                Rejection Reason & Required Corrections <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Please provide valid contact number and verified kitchen address."
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalSubmitting || !reviewNotes.trim()}
                onClick={handleRejectShop}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {modalSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: SUSPEND SHOP                                           */}
      {/* ============================================================= */}
      {isSuspendModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-border space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2 text-purple-700">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-brand-charcoal">Suspend Active Kitchen</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Suspending <strong>{selectedShop.name}</strong> will immediately halt customer order intake and remove
                it from public discovery.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-charcoal">Suspension Reason (Optional)</label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Hygiene audit inspection pending or temporary merchant request."
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalSubmitting}
                onClick={handleSuspendShop}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors disabled:opacity-50"
              >
                {modalSubmitting ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          TAB: ALL DISHES MANAGEMENT (ADMIN-WIDE)
         ============================================================= */}
      {activeTab === "dishes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-border shadow-xs">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-brand-charcoal flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-orange" />
                <span>All Platform Dishes &amp; Menu Items</span>
              </h2>
              <p className="text-xs text-brand-muted">
                Supervisor control over all foods appearing in the continuous dishes slider and search. Delete inappropriate items directly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenAddDishModal}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish to Platform</span>
              </button>
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search by dish or shop name..."
                  value={dishSearchQuery}
                  onChange={(e) => setDishSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                />
              </div>
            </div>
          </div>

          {adminDishesLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-2" />
              <p className="text-xs text-brand-muted">Loading all dishes...</p>
            </div>
          ) : adminDishes.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-3">
              <Utensils className="w-10 h-10 text-brand-muted mx-auto opacity-40" />
              <h3 className="text-base font-black text-brand-charcoal">No Dishes Found</h3>
              <p className="text-xs text-brand-muted">No dishes currently uploaded across partner kitchens.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-surface/70 border-b border-brand-border text-brand-charcoal font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Dish Name</th>
                    <th className="py-3 px-4">Kitchen</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Slider / Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {adminDishes
                    .filter(
                      (d) =>
                        d.name.toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
                        (d.shop_name && d.shop_name.toLowerCase().includes(dishSearchQuery.toLowerCase()))
                    )
                    .map((dish) => (
                      <tr key={dish.id} className="hover:bg-brand-surface/30">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border overflow-hidden shrink-0">
                            {dish.image || dish.image_url ? (
                              <img
                                src={getMediaUrl(dish.image_url || dish.image)}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-muted">
                                <Utensils className="w-4 h-4 opacity-40" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-brand-charcoal block">{dish.name}</span>
                          {dish.description && (
                            <span className="text-[11px] text-zinc-400 line-clamp-1">{dish.description}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-brand-orange">
                          {dish.shop_name || "Partner Kitchen"}
                        </td>
                        <td className="py-3 px-4 font-black text-brand-charcoal">
                          ₹{dish.base_price}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                              dish.dietary_type === "VEG"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-red-50 text-red-700 border-red-300"
                            }`}
                          >
                            {dish.dietary_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleAdminDishAvailability(dish)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer border ${
                              dish.is_available
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                                : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                            }`}
                            title="Click to toggle in continuous slider & customer menu"
                          >
                            {dish.is_available ? "In Slider (Available)" : "Sold Out (Hidden)"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDishModal(dish)}
                            className="p-1.5 rounded-lg border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer transition-colors"
                            title="Edit Dish & Photo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingAdminDishId === dish.id}
                            onClick={() => handleDeleteAdminDish(dish.id, dish.name)}
                            className="p-1.5 rounded-lg border border-brand-border hover:bg-red-50 text-red-600 cursor-pointer disabled:opacity-50 transition-colors"
                            title="Delete Dish Permanently"
                          >
                            {deletingAdminDishId === dish.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          TAB: SHOWCASE VIDEOS (FRONT-PAGE REELS)
         ============================================================= */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-border shadow-xs">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-brand-charcoal flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-amber" />
                <span>Front-Page Showcase Videos &amp; Reels</span>
              </h2>
              <p className="text-xs text-brand-muted">
                Manage all promotional culinary reels appearing in the front-page video slider. Admin has full upload and deletion rights.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddAdminVideoOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Platform Video</span>
            </button>
          </div>

          {adminVideosLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-2" />
              <p className="text-xs text-brand-muted">Loading showcase videos...</p>
            </div>
          ) : adminVideos.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-3">
              <Video className="w-10 h-10 text-brand-muted mx-auto opacity-40" />
              <h3 className="text-base font-black text-brand-charcoal">No Showcase Videos Yet</h3>
              <p className="text-xs text-brand-muted">Add video clips to populate the front-page reels carousel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <video
                      src={vid.effective_video_url}
                      poster={vid.thumbnail_url || undefined}
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-brand-orange text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      {vid.shop_name || "Platform Reel"}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-sm text-brand-charcoal line-clamp-1">{vid.title}</h4>
                      {vid.caption && (
                        <p className="text-xs text-brand-muted line-clamp-2 mt-1">{vid.caption}</p>
                      )}
                      {vid.product_name && (
                        <div className="mt-2 text-[11px] font-bold text-brand-orange flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Dish: {vid.product_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        {new Date(vid.created_at).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        disabled={deletingAdminVideoId === vid.id}
                        onClick={() => handleDeleteAdminVideo(vid.id, vid.title)}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 p-1.5 rounded-xl hover:bg-red-50 cursor-pointer disabled:opacity-50"
                      >
                        {deletingAdminVideoId === vid.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Admin Video Modal */}
          {isAddAdminVideoOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-lg w-full p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <h3 className="text-base font-black text-brand-charcoal flex items-center gap-2">
                    <Video className="w-5 h-5 text-brand-orange" />
                    <span>Upload Front-Page Showcase Video</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddAdminVideoOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-brand-surface text-brand-muted cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateAdminVideo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sizzling Tandoori Feast"
                      value={adminVideoForm.title}
                      onChange={(e) => setAdminVideoForm({ ...adminVideoForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Upload Video File from Device (MP4 / WebM)
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => setAdminVideoFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-brand-charcoal file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-charcoal file:text-white hover:file:bg-brand-orange file:cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted mt-1 block">
                      Choose an MP4/WebM video file from your computer.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 border-t border-brand-border"></div>
                    <span className="text-[10px] font-bold text-brand-muted uppercase">OR ONLINE STREAM URL</span>
                    <div className="flex-1 border-t border-brand-border"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Video Stream URL (MP4 / Web Video / Google Drive Link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://.../video.mp4 or Google Drive sharing link"
                      value={adminVideoForm.video_url}
                      onChange={(e) => setAdminVideoForm({ ...adminVideoForm, video_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Poster Thumbnail URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://.../thumbnail.jpg"
                      value={adminVideoForm.thumbnail_url}
                      onChange={(e) => setAdminVideoForm({ ...adminVideoForm, thumbnail_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Assign to Kitchen (Optional)
                    </label>
                    <select
                      value={adminVideoForm.shop}
                      onChange={(e) => setAdminVideoForm({ ...adminVideoForm, shop: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange bg-white"
                    >
                      <option value="">-- Platform Wide Reel --</option>
                      {shops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Caption / Short Story
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Short appetizing description..."
                      value={adminVideoForm.caption}
                      onChange={(e) => setAdminVideoForm({ ...adminVideoForm, caption: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddAdminVideoOpen(false)}
                      className="px-4 py-2 rounded-full border border-brand-border text-xs font-bold text-brand-muted hover:bg-brand-surface cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black shadow-md cursor-pointer"
                    >
                      Publish Video
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

        {/* TAB 12: FINANCIALS & COMMISSION REVENUE */}
        {activeTab === "financials" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">
                    Marketplace Economics &amp; Revenue Split
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-charcoal mt-1">
                    Platform Financials &amp; Commission Ledger
                  </h2>
                  <p className="text-xs text-brand-muted mt-1">
                    Transparent tracking of platform GMV, automated 10% commissions, fixed ₹10 platform fees, and net vendor payouts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchFinancials}
                  disabled={financialsLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${financialsLoading ? "animate-spin" : ""}`} />
                  <span>Refresh Ledger</span>
                </button>
              </div>

              {/* 4 Primary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[11px] font-black uppercase tracking-wider">Gross Merchandise Value</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-brand-charcoal">
                    ₹{financials?.marketplace_summary?.gmv?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium">Total customer payments processed</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="text-[11px] font-black uppercase tracking-wider">Total Admin Revenue</span>
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-800">
                    ₹{financials?.marketplace_summary?.admin_total_revenue?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium">Platform Fee (₹10) + 10% Commission</p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-amber-800">
                    <span className="text-[11px] font-black uppercase tracking-wider">Vendor Payouts</span>
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-900">
                    ₹{financials?.marketplace_summary?.vendor_payouts_disbursed?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium">90% net dish sales credited to kitchens</p>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between text-purple-800">
                    <span className="text-[11px] font-black uppercase tracking-wider">Orders Processed</span>
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-purple-900">
                    {financials?.marketplace_summary?.total_orders || 0} Orders
                  </div>
                  <p className="text-[10px] text-purple-700 font-medium">Across all approved cloud kitchens</p>
                </div>
              </div>

              {/* Revenue Architecture Info Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 text-xs space-y-2">
                <span className="text-[11px] font-black uppercase text-purple-800 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  How Revenue Sharing Works on Bhukkad Verse
                </span>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  When an order is paid via <strong>Razorpay Route / UPI</strong> or <strong>Cash on Delivery</strong>:
                  The customer pays (Subtotal + ₹10 Platform Fee + ₹35 Delivery + 5% GST - Voucher).
                  The platform automatically routes <strong>10% commission + ₹10 platform fee</strong> into the Administrator treasury account, and <strong>90% net sales</strong> is disbursed directly into the culinary partner verified bank account.
                </p>
              </div>

              {/* Recent Orders Ledger Table */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-charcoal">
                  Recent Orders &amp; Financial Breakdown
                </h3>

                {financialsLoading ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500">
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                    <span>Loading financial ledger...</span>
                  </div>
                ) : financials?.recent_orders?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-200">
                    No orders placed yet. Orders will appear here in real-time as customers checkout.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-black uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Order ID</th>
                          <th className="py-3 px-4">Kitchen</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4 text-right">Dish Subtotal</th>
                          <th className="py-3 px-4 text-right">Admin Fee</th>
                          <th className="py-3 px-4 text-right">Admin Cut (10%)</th>
                          <th className="py-3 px-4 text-right">Vendor Payout</th>
                          <th className="py-3 px-4 text-right">Total Paid</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {financials?.recent_orders?.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-3 px-4 font-black font-mono text-purple-900">
                              {ord.order_number}
                            </td>
                            <td className="py-3 px-4 font-bold text-brand-charcoal">
                              {ord.shop_name}
                            </td>
                            <td className="py-3 px-4 text-zinc-600">
                              {ord.customer_name}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-zinc-700">
                              ₹{ord.subtotal}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-purple-700">
                              ₹{ord.platform_fee}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-purple-700">
                              ₹{ord.admin_commission_amount}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700">
                              ₹{ord.vendor_payout_amount}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-brand-charcoal">
                              ₹{ord.total_amount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                ord.payment_status === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {ord.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
