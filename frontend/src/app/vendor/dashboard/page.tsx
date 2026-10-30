"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, getMediaUrl } from "@/lib/api";
import {
  Store,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Loader2,
  RefreshCw,
  Power,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  SlidersHorizontal,
  Utensils,
  AlertCircle,
  FolderPlus,
  X,
  ExternalLink,
  FileText,
  UploadCloud,
  FileCheck,
  Eye,
  Download,
  Archive,
  ShieldCheck,
  MessageSquare,
  Video,
  Play,
  Sparkles,
} from "lucide-react";

// =============================================================
// TYPES & INTERFACES
// =============================================================

interface VendorShopData {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  address_line: string;
  city: string;
  postal_code: string;
  opening_time: string;
  closing_time: string;
  delivery_radius_km: string;
  minimum_order_value: string;
  commission_rate_percentage: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  status_display: string;
  admin_review_notes: string;
  is_accepting_orders: boolean;
  order_pause_reason?: string;
  order_paused_at?: string | null;
  timezone?: string;
  live_status?: ShopLiveStatus;
  operating_hours?: OperatingHourSchedule[];
  is_active: boolean;
  created_at: string;
}

export interface ShopLiveStatus {
  is_open: boolean;
  is_accepting_orders: boolean;
  status_code: string;
  status_display: string;
  next_opening_time: string | null;
  next_opening_day: string | null;
  pause_reason: string;
}

export interface OperatingHourSchedule {
  id?: string;
  weekday: number;
  weekday_display?: string;
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
  is_overnight?: boolean;
}


interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

interface VendorVariant {
  id: string;
  product?: string;
  name: string;
  price: string;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
}

interface VendorProduct {
  id: string;
  category: string;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  compare_at_price: string | null;
  image?: string | null;
  image_url: string;
  dietary_type: "VEG" | "NON_VEG" | "EGG" | "VEGAN";
  preparation_time_minutes: number;
  is_available: boolean;
  is_active: boolean;
  display_order: number;
  has_variants: boolean;
  addon_groups: string[];
  variants: VendorVariant[];
  created_at: string;
}

interface VendorAddonItem {
  id: string;
  group?: string;
  name: string;
  price: string;
  is_available: boolean;
  display_order: number;
}

interface VendorAddonGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  items: VendorAddonItem[];
}

export interface VendorMenuCard {
  id: string;
  original_filename: string;
  file_url: string;
  file_type: "PDF" | "JPEG" | "PNG";
  file_size_bytes: number;
  file_size_display: string;
  version: number;
  title: string;
  is_active: boolean;
  uploaded_by_username?: string;
  created_at: string;
  updated_at: string;
}

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DashboardTab = "overview" | "hours" | "menucard" | "categories" | "products" | "addons" | "complaints" | "videos" | "orders";

export interface VendorComplaint {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_id: string;
  category: string;
  category_display: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  status_display: string;
  resolution_notes: string;
  created_at: string;
}

// =============================================================
// MAIN COMPONENT
// =============================================================

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Notifications State
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
    setTimeout(() => setActionError(null), 5000);
  };

  // Showcase Videos State
  const [vendorVideos, setVendorVideos] = useState<any[]>([]);
  const [vendorVideosLoading, setVendorVideosLoading] = useState(false);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Orders & Payouts State
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [vendorFinancials, setVendorFinancials] = useState<any>(null);
  const [vendorOrdersLoading, setVendorOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchVendorOrders = useCallback(async () => {
    if (!token) return;
    setVendorOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorOrders(data.orders || []);
        setVendorFinancials(data.financials || null);
      }
    } catch {
      // Ignored
    } finally {
      setVendorOrdersLoading(false);
    }
  }, [token]);

  const handleUpdateOrderStatus = async (orderNumber: string, nextStatus: string) => {
    if (!token) return;
    setUpdatingOrderId(orderNumber);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/orders/${orderNumber}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchVendorOrders();
      }
    } catch {
      // Ignored
    } finally {
      setUpdatingOrderId(null);
    }
  };


  // Auto-Generate Dish Cards from Menu Card State
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [autoGenSubmitting, setAutoGenSubmitting] = useState(false);
  const [autoGenDishesList, setAutoGenDishesList] = useState<Array<{
    name: string;
    category: string;
    price: number;
    dietary_type: "VEG" | "NON_VEG" | "EGG" | "VEGAN";
    image_url: string;
  }>>([
    {
      name: "Special Paneer Butter Masala",
      category: "Main Course",
      price: 249,
      dietary_type: "VEG",
      image_url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Tandoori Chicken Tikka",
      category: "Tandoori Starters",
      price: 289,
      dietary_type: "NON_VEG",
      image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Crispy Garlic Butter Naan",
      category: "Breads",
      price: 65,
      dietary_type: "VEG",
      image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
    },
    {
      name: "Chilled Mango Lassi",
      category: "Beverages",
      price: 99,
      dietary_type: "VEG",
      image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80",
    },
  ]);
  const [newParsedItem, setNewParsedItem] = useState({
    name: "",
    category: "Main Course",
    price: 199,
    dietary_type: "VEG" as "VEG" | "NON_VEG" | "EGG" | "VEGAN",
    image_url: "",
  });

  const handleAddDishToAutoGenList = () => {
    if (!newParsedItem.name.trim()) {
      notifyError("Please enter a dish name.");
      return;
    }
    // Auto-match online image based on name
    const lookupName = newParsedItem.name.toLowerCase();
    let img = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
    if (lookupName.includes("biryani")) img = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("pizza")) img = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("burger")) img = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("paneer")) img = "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("tikka") || lookupName.includes("chicken")) img = "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("shake") || lookupName.includes("lassi") || lookupName.includes("drink")) img = "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("momo")) img = "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("pasta") || lookupName.includes("noodle")) img = "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80";
    else if (lookupName.includes("naan") || lookupName.includes("dal")) img = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80";

    setAutoGenDishesList((prev) => [
      ...prev,
      {
        ...newParsedItem,
        image_url: newParsedItem.image_url || img,
      },
    ]);
    setNewParsedItem({ name: "", category: "Main Course", price: 199, dietary_type: "VEG", image_url: "" });
  };

  const handleExecuteAutoGenDishes = async () => {
    if (!token) return;
    if (autoGenDishesList.length === 0) {
      notifyError("No dishes in the list to generate.");
      return;
    }
    try {
      setAutoGenSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/products/auto-generate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: autoGenDishesList }),
      });
      const data = await res.json();
      if (res.ok) {
        notifySuccess(data.message || "Dishes generated successfully!");
        setIsAutoGenerateModalOpen(false);
        fetchCatalogData(); // Refreshes products list
        setActiveTab("products");
      } else {
        notifyError(data.detail || "Failed to auto-generate dishes.");
      }
    } catch {
      notifyError("Network error while generating dishes.");
    } finally {
      setAutoGenSubmitting(false);
    }
  };

  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoForm, setNewVideoForm] = useState({
    title: "",
    caption: "",
    video_url: "",
    thumbnail_url: "",
    product: "",
  });

  const fetchVendorVideos = useCallback(async () => {
    if (!token) return;
    try {
      setVendorVideosLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/showcase-videos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorVideos(Array.isArray(data) ? data : []);
      }
    } catch {
      notifyError("Failed to fetch kitchen showcase videos.");
    } finally {
      setVendorVideosLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "videos") {
      fetchVendorVideos();
    }
  }, [activeTab, fetchVendorVideos]);

  const handleDeleteProduct = async (product: VendorProduct) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
      return;
    }
    try {
      setDeletingProductId(product.id);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/products/${product.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        notifySuccess(`"${product.name}" deleted successfully.`);
      } else {
        notifyError("Failed to delete food item.");
      }
    } catch {
      notifyError("Network error deleting food item.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newVideoForm.title.trim()) {
      notifyError("Please provide a video title.");
      return;
    }
    if (!newVideoFile && !newVideoForm.video_url.trim()) {
      notifyError("Please select a video file to upload or enter a video stream URL.");
      return;
    }

    try {
      setVideoSubmitting(true);
      let res: Response;

      if (newVideoFile) {
        const formData = new FormData();
        formData.append("title", newVideoForm.title.trim());
        formData.append("caption", newVideoForm.caption.trim());
        formData.append("video_file", newVideoFile);
        if (newVideoForm.thumbnail_url.trim()) {
          formData.append("thumbnail_url", newVideoForm.thumbnail_url.trim());
        }
        if (newVideoForm.product) {
          formData.append("product", newVideoForm.product);
        }

        res = await fetch(`${API_BASE_URL}/v1/vendor/showcase-videos/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        let finalUrl = newVideoForm.video_url.trim();
        const driveMatch = finalUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          finalUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
        }

        const payload: any = {
          title: newVideoForm.title.trim(),
          caption: newVideoForm.caption.trim(),
          video_url: finalUrl,
          thumbnail_url: newVideoForm.thumbnail_url.trim(),
        };
        if (newVideoForm.product) {
          payload.product = newVideoForm.product;
        }

        res = await fetch(`${API_BASE_URL}/v1/vendor/showcase-videos/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        notifySuccess("Showcase video reel uploaded successfully!");
        setNewVideoForm({ title: "", caption: "", video_url: "", thumbnail_url: "", product: "" });
        setNewVideoFile(null);
        setIsAddVideoModalOpen(false);
        fetchVendorVideos();
      } else {
        const errData = await res.json().catch(() => ({}));
        notifyError(errData.detail || "Failed to save showcase video.");
      }
    } catch {
      notifyError("Network error saving showcase video.");
    } finally {
      setVideoSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete video "${title}"?`)) return;
    try {
      setDeletingVideoId(videoId);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/showcase-videos/${videoId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setVendorVideos((prev) => prev.filter((v) => v.id !== videoId));
        notifySuccess("Showcase video deleted.");
      } else {
        notifyError("Failed to delete video.");
      }
    } catch {
      notifyError("Network error deleting video.");
    } finally {
      setDeletingVideoId(null);
    }
  };


  // Shop Application State
  const [shop, setShop] = useState<VendorShopData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingAccepting, setTogglingAccepting] = useState(false);

  // Operating Hours & Live Status State
  const [operatingHours, setOperatingHours] = useState<OperatingHourSchedule[]>([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [pauseReasonInput, setPauseReasonInput] = useState("");
  const [togglingPause, setTogglingPause] = useState(false);

  // Shop Edit Form State
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address_line: "",
    city: "",
    opening_time: "",
    closing_time: "",
  });
  const [updatingShop, setUpdatingShop] = useState(false);

  // Catalog State
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [addonGroups, setAddonGroups] = useState<VendorAddonGroup[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Category Modal / Form State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VendorCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
    is_active: true,
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Product Modal / Form State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState({
    category: "",
    name: "",
    description: "",
    base_price: "0.00",
    dietary_type: "VEG" as "VEG" | "NON_VEG" | "EGG" | "VEGAN",
    preparation_time_minutes: 15,
    image_url: "",
    has_variants: false,
    is_available: true,
    is_active: true,
    display_order: 0,
    addon_groups: [] as string[],
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Variant Modal State (for managing variants of a product)
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [activeVariantProduct, setActiveVariantProduct] = useState<VendorProduct | null>(null);
  const [newVariantData, setNewVariantData] = useState({
    name: "",
    price: "",
    is_default: false,
    display_order: 0,
  });
  const [savingVariant, setSavingVariant] = useState(false);

  // Add-on Group Modal State
  const [addonGroupModalOpen, setAddonGroupModalOpen] = useState(false);
  const [editingAddonGroup, setEditingAddonGroup] = useState<VendorAddonGroup | null>(null);
  const [addonGroupFormData, setAddonGroupFormData] = useState({
    name: "",
    min_selections: 0,
    max_selections: 1,
    is_required: false,
    display_order: 0,
    is_active: true,
  });
  const [savingAddonGroup, setSavingAddonGroup] = useState(false);

  // Add-on Item Modal State
  const [addonItemModalOpen, setAddonItemModalOpen] = useState(false);
  const [activeAddonGroupForItems, setActiveAddonGroupForItems] = useState<VendorAddonGroup | null>(null);
  const [newAddonItemData, setNewAddonItemData] = useState({
    name: "",
    price: "0.00",
    display_order: 0,
  });
  const [savingAddonItem, setSavingAddonItem] = useState(false);

  // Menu Card Management State (Increment 2B)
  const [menuCards, setMenuCards] = useState<VendorMenuCard[]>([]);
  const [menuCardsLoading, setMenuCardsLoading] = useState(false);
  const [selectedMenuFile, setSelectedMenuFile] = useState<File | null>(null);
  const [menuCardTitle, setMenuCardTitle] = useState("");
  const [menuCardIsActive, setMenuCardIsActive] = useState(true);
  const [uploadingMenuCard, setUploadingMenuCard] = useState(false);
  const [menuUploadError, setMenuUploadError] = useState<string | null>(null);
  const [previewMenuCard, setPreviewMenuCard] = useState<VendorMenuCard | null>(null);
  const [actionCardId, setActionCardId] = useState<string | null>(null);
  const [isMenuDragOver, setIsMenuDragOver] = useState(false);

  // Customer Complaints & Queries State
  const [complaints, setComplaints] = useState<VendorComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [resolvingComplaintId, setResolvingComplaintId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});



  // =============================================================
  // FETCH SHOP & CATALOG DATA
  // =============================================================

  const fetchMenuCards = useCallback(async () => {
    if (!token) return;
    try {
      setMenuCardsLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/menu-cards/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMenuCards(data);
      } else {
        notifyError("Failed to fetch menu cards.");
      }
    } catch {
      notifyError("Network error fetching menu cards.");
    } finally {
      setMenuCardsLoading(false);
    }
  }, [token]);

  const fetchComplaints = useCallback(async () => {
    if (!token) return;
    try {
      setComplaintsLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/support/tickets/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch {
      //
    } finally {
      setComplaintsLoading(false);
    }
  }, [token]);

  const handleResolveComplaint = async (ticketId: string) => {
    if (!token) return;
    setResolvingComplaintId(ticketId);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/support/tickets/${ticketId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "RESOLVED",
          resolution_notes: resolutionText[ticketId] || "Issue investigated and resolved by kitchen manager.",
        }),
      });
      if (res.ok) {
        notifySuccess("Complaint marked as resolved.");
        fetchComplaints();
      } else {
        notifyError("Failed to update ticket status.");
      }
    } catch {
      notifyError("Network error resolving complaint.");
    } finally {
      setResolvingComplaintId(null);
    }
  };

  const fetchCatalogData = useCallback(async () => {
    if (!token) return;
    try {
      setCatalogLoading(true);
      const [catsRes, prodsRes, addonsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/vendor/categories/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/v1/vendor/products/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/v1/vendor/addon-groups/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      }
      if (prodsRes.ok) {
        const prodsData = await prodsRes.json();
        setProducts(prodsData);
      }
      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        setAddonGroups(addonsData);
      }
    } catch {
      notifyError("Could not refresh catalog data.");
    } finally {
      setCatalogLoading(false);
    }
  }, [token]);

  const fetchOperatingHours = useCallback(async () => {
    if (!token) return;
    try {
      setHoursLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/operating-hours/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: OperatingHourSchedule[] = await res.json();
        setOperatingHours(data);
      }
    } catch {
      notifyError("Could not fetch weekly operating hours.");
    } finally {
      setHoursLoading(false);
    }
  }, [token]);

  const fetchVendorShop = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/v1/vendor/shop/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: VendorShopData = await res.json();
        setShop(data);
        setEditFormData({
          name: data.name,
          description: data.description,
          phone: data.phone,
          address_line: data.address_line,
          city: data.city,
          opening_time: data.opening_time.slice(0, 5),
          closing_time: data.closing_time.slice(0, 5),
        });

        // If approved, also fetch catalog items, operating hours & customer complaints
        if (data.status === "APPROVED") {
          fetchCatalogData();
          fetchOperatingHours();
          fetchMenuCards();
          fetchComplaints();
        }
      } else if (res.status === 404) {
        setShop(null);
      } else {
        notifyError("Failed to fetch shop application status.");
      }
    } catch {
      notifyError("Network error connecting to vendor service.");
    } finally {
      setLoading(false);
    }
  }, [token, fetchCatalogData, fetchOperatingHours, fetchMenuCards, fetchComplaints]);

  const updateHourDay = (weekday: number, updates: Partial<OperatingHourSchedule>) => {
    setOperatingHours((prev) => {
      const exists = prev.some((h) => h.weekday === weekday);
      if (!exists) {
        return [
          ...prev,
          {
            weekday,
            is_closed: false,
            opening_time: "10:00:00",
            closing_time: "23:00:00",
            ...updates,
          },
        ];
      }
      return prev.map((item) => (item.weekday === weekday ? { ...item, ...updates } : item));
    });
  };

  const handleSaveOperatingHours = async () => {
    if (!token) return;
    setHoursSaving(true);
    try {
      const payload = operatingHours.map((h) => ({
        weekday: h.weekday,
        is_closed: h.is_closed,
        opening_time: h.is_closed ? null : h.opening_time ? `${h.opening_time.slice(0, 5)}:00` : null,
        closing_time: h.is_closed ? null : h.closing_time ? `${h.closing_time.slice(0, 5)}:00` : null,
      }));

      const res = await fetch(`${API_BASE_URL}/v1/vendor/operating-hours/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated: OperatingHourSchedule[] = await res.json();
        setOperatingHours(updated);
        notifySuccess("Weekly operating schedule saved successfully!");
        fetchVendorShop();
      } else {
        const errData = await res.json();
        notifyError(errData.detail || "Failed to update operating hours.");
      }
    } catch {
      notifyError("Network error saving operating schedule.");
    } finally {
      setHoursSaving(false);
    }
  };

  const handleToggleOrders = async (targetAccepting: boolean) => {
    if (!token || !shop) return;
    setTogglingPause(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/shop/toggle-orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_accepting_orders: targetAccepting,
          order_pause_reason: targetAccepting ? "" : pauseReasonInput.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShop(data.shop);
        notifySuccess(data.message);
        if (targetAccepting) setPauseReasonInput("");
      } else {
        const err = await res.json();
        notifyError(err.detail || "Failed to change order intake status.");
      }
    } catch {
      notifyError("Network error toggling order status.");
    } finally {
      setTogglingPause(false);
    }
  };


  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/vendor/dashboard");
      } else if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role !== "VENDOR") {
        router.push("/");
      } else {
        queueMicrotask(() => {
          fetchVendorShop();
        });
      }
    }
  }, [user, token, authLoading, router, fetchVendorShop]);

  // =============================================================
  // SHOP PROFILE HANDLERS
  // =============================================================

  const handleToggleAcceptingOrders = async () => {
    if (!shop || !token) return;
    setTogglingAccepting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/shop/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_accepting_orders: !shop.is_accepting_orders,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setShop(updated);
        notifySuccess(
          updated.is_accepting_orders
            ? "Kitchen is now accepting customer orders!"
            : "Kitchen paused. Not taking new orders right now."
        );
      }
    } catch {
      notifyError("Failed to toggle order status.");
    } finally {
      setTogglingAccepting(false);
    }
  };

  // =============================================================
  // MENU CARD HANDLERS (Increment 2B)
  // =============================================================

  const handleUploadMenuCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!selectedMenuFile) {
      setMenuUploadError("Please select a menu card file (PDF, JPEG, or PNG).");
      return;
    }

    // Client-side pre-validation
    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
    if (!allowedExtensions.test(selectedMenuFile.name)) {
      setMenuUploadError("Invalid file type. Only PDF, JPEG, and PNG formats are accepted.");
      return;
    }
    if (selectedMenuFile.size > 10 * 1024 * 1024) {
      setMenuUploadError("File is too large. The maximum permitted file size is 10 MB.");
      return;
    }
    if (selectedMenuFile.size === 0) {
      setMenuUploadError("The selected file is empty (0 bytes). Please upload a valid menu card.");
      return;
    }

    setUploadingMenuCard(true);
    setMenuUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedMenuFile);
    if (menuCardTitle.trim()) {
      formData.append("title", menuCardTitle.trim());
    }
    formData.append("is_active", String(menuCardIsActive));

    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/menu-cards/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        notifySuccess(
          `Menu Card "${data.title || data.original_filename}" uploaded successfully! (Version ${data.version})`
        );
        setSelectedMenuFile(null);
        setMenuCardTitle("");
        setMenuCardIsActive(true);
        fetchMenuCards();
      } else {
        const errMsg =
          data.file?.[0] ||
          data.non_field_errors?.[0] ||
          data.detail ||
          data.error ||
          "Failed to upload menu card. Please check file format and size.";
        setMenuUploadError(errMsg);
        notifyError(errMsg);
      }
    } catch {
      const netErr = "Network error during menu card upload.";
      setMenuUploadError(netErr);
      notifyError(netErr);
    } finally {
      setUploadingMenuCard(false);
    }
  };

  const handleActivateMenuCard = async (cardId: string) => {
    if (!token) return;
    setActionCardId(cardId);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/menu-cards/${cardId}/activate/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        notifySuccess("Menu card version activated! Customers will now view this menu.");
        fetchMenuCards();
      } else {
        const data = await res.json();
        notifyError(data.error || "Failed to activate menu card version.");
      }
    } catch {
      notifyError("Network error activating menu card.");
    } finally {
      setActionCardId(null);
    }
  };

  const handleArchiveMenuCard = async (cardId: string) => {
    if (!token) return;
    setActionCardId(cardId);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/menu-cards/${cardId}/archive/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        notifySuccess("Menu card version archived and hidden from customers.");
        fetchMenuCards();
      } else {
        const data = await res.json();
        notifyError(data.error || "Failed to archive menu card.");
      }
    } catch {
      notifyError("Network error archiving menu card.");
    } finally {
      setActionCardId(null);
    }
  };

  const handleDeleteMenuCard = async (card: VendorMenuCard) => {
    if (!token) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete Version ${card.version} ("${card.title || card.original_filename}")? The file will be removed from storage.`
      )
    ) {
      return;
    }
    setActionCardId(card.id);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/menu-cards/${card.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 204 || res.ok) {
        notifySuccess(`Version ${card.version} permanently removed.`);
        fetchMenuCards();
      } else {
        notifyError("Failed to delete menu card.");
      }
    } catch {
      notifyError("Network error deleting menu card.");
    } finally {
      setActionCardId(null);
    }
  };

  const handleResubmitOrUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUpdatingShop(true);

    const payload = {
      ...editFormData,
      resubmit: shop?.status === "REJECTED",
    };

    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/shop/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setShop(updated);
        setIsEditingShop(false);
        notifySuccess("Kitchen profile updated successfully!");
      } else {
        notifyError("Failed to update kitchen details.");
      }
    } catch {
      notifyError("Network error updating shop.");
    } finally {
      setUpdatingShop(false);
    }
  };

  // =============================================================
  // CATEGORY HANDLERS
  // =============================================================

  const handleOpenCategoryModal = (cat?: VendorCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({
        name: cat.name,
        description: cat.description || "",
        display_order: cat.display_order,
        is_active: cat.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: "",
        description: "",
        display_order: categories.length * 10,
        is_active: true,
      });
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingCategory(true);

    try {
      const url = editingCategory
        ? `${API_BASE_URL}/v1/vendor/categories/${editingCategory.id}/`
        : `${API_BASE_URL}/v1/vendor/categories/`;
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      });

      if (res.ok) {
        notifySuccess(
          editingCategory ? "Category updated successfully." : "New category created."
        );
        setCategoryModalOpen(false);
        fetchCatalogData();
      } else {
        const errData = await res.json();
        notifyError(errData.name?.[0] || "Failed to save category.");
      }
    } catch {
      notifyError("Network error saving category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategoryActive = async (cat: VendorCategory) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/v1/vendor/categories/${cat.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      if (res.ok) {
        notifySuccess(`Category ${!cat.is_active ? "activated" : "deactivated"}.`);
        fetchCatalogData();
      }
    } catch {
      notifyError("Failed to toggle category status.");
    }
  };

  // =============================================================
  // PRODUCT HANDLERS
  // =============================================================

  const handleOpenProductModal = (prod?: VendorProduct) => {
    if (prod) {
      setEditingProduct(prod);
      setProductFormData({
        category: prod.category,
        name: prod.name,
        description: prod.description || "",
        base_price: prod.base_price,
        dietary_type: prod.dietary_type,
        preparation_time_minutes: prod.preparation_time_minutes,
        image_url: prod.image_url || "",
        has_variants: prod.has_variants,
        is_available: prod.is_available,
        is_active: prod.is_active,
        display_order: prod.display_order,
        addon_groups: prod.addon_groups || [],
      });
      setProductImageFile(null);
      setProductImagePreview(prod.image ? getMediaUrl(prod.image) : prod.image_url || null);
    } else {
      setEditingProduct(null);
      setProductFormData({
        category: categories.length > 0 ? categories[0].id : "",
        name: "",
        description: "",
        base_price: "99.00",
        dietary_type: "VEG",
        preparation_time_minutes: 15,
        image_url: "",
        has_variants: false,
        is_available: true,
        is_active: true,
        display_order: products.length * 10,
        addon_groups: [],
      });
      setProductImageFile(null);
      setProductImagePreview(null);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProduct(true);

    try {
      const url = editingProduct
        ? `${API_BASE_URL}/v1/vendor/products/${editingProduct.id}/`
        : `${API_BASE_URL}/v1/vendor/products/`;
      const method = editingProduct ? "PATCH" : "POST";

      let res: Response;

      if (productImageFile) {
        const formData = new FormData();
        formData.append("category", productFormData.category);
        formData.append("name", productFormData.name);
        formData.append("description", productFormData.description);
        formData.append("base_price", productFormData.base_price);
        formData.append("dietary_type", productFormData.dietary_type);
        formData.append("preparation_time_minutes", String(productFormData.preparation_time_minutes));
        formData.append("has_variants", String(productFormData.has_variants));
        formData.append("is_available", String(productFormData.is_available));
        formData.append("is_active", String(productFormData.is_active));
        formData.append("display_order", String(productFormData.display_order));
        if (productFormData.image_url) {
          formData.append("image_url", productFormData.image_url);
        }
        productFormData.addon_groups.forEach((groupId) => {
          formData.append("addon_groups", groupId);
        });
        formData.append("image", productImageFile);

        res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productFormData),
        });
      }

      if (res.ok) {
        notifySuccess(
          editingProduct ? "Product updated successfully." : "New menu item added."
        );
        setProductModalOpen(false);
        fetchCatalogData();
      } else {
        const errData = await res.json();
        const errMessage =
          errData.category?.[0] ||
          errData.base_price?.[0] ||
          errData.name?.[0] ||
          errData.image?.[0] ||
          "Failed to save product.";
        notifyError(errMessage);
      }
    } catch {
      notifyError("Network error saving product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductAvailability = async (prod: VendorProduct) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/vendor/products/${prod.id}/availability/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        notifySuccess(data.detail);
        fetchCatalogData();
      }
    } catch {
      notifyError("Failed to toggle product availability.");
    }
  };

  // =============================================================
  // VARIANT HANDLERS
  // =============================================================

  const handleOpenVariantModal = (prod: VendorProduct) => {
    setActiveVariantProduct(prod);
    setNewVariantData({
      name: "",
      price: prod.base_price,
      is_default: (prod.variants?.length ?? 0) === 0,
      display_order: (prod.variants?.length ?? 0) * 10,
    });
    setVariantModalOpen(true);
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeVariantProduct) return;
    setSavingVariant(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/vendor/products/${activeVariantProduct.id}/variants/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newVariantData),
        }
      );

      if (res.ok) {
        notifySuccess(`Size variant '${newVariantData.name}' created!`);
        setNewVariantData({
          name: "",
          price: activeVariantProduct.base_price,
          is_default: false,
          display_order: ((activeVariantProduct.variants?.length ?? 0) + 1) * 10,
        });
        // Refresh catalog to update variants
        await fetchCatalogData();
        // Update active variant product in modal view
        const refreshed = products.find((p) => p.id === activeVariantProduct.id);
        if (refreshed) setActiveVariantProduct(refreshed);
      } else {
        const errData = await res.json();
        notifyError(errData.price?.[0] || errData.name?.[0] || "Failed to create variant.");
      }
    } catch {
      notifyError("Network error saving variant.");
    } finally {
      setSavingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!token || !activeVariantProduct) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/vendor/products/${activeVariantProduct.id}/variants/${variantId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        notifySuccess("Variant removed.");
        await fetchCatalogData();
        const refreshed = products.find((p) => p.id === activeVariantProduct.id);
        if (refreshed) setActiveVariantProduct(refreshed);
      }
    } catch {
      notifyError("Failed to delete variant.");
    }
  };

  // =============================================================
  // ADD-ON GROUP HANDLERS
  // =============================================================

  const handleOpenAddonGroupModal = (group?: VendorAddonGroup) => {
    if (group) {
      setEditingAddonGroup(group);
      setAddonGroupFormData({
        name: group.name,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        is_required: group.is_required,
        display_order: group.display_order,
        is_active: group.is_active,
      });
    } else {
      setEditingAddonGroup(null);
      setAddonGroupFormData({
        name: "",
        min_selections: 0,
        max_selections: 1,
        is_required: false,
        display_order: addonGroups.length * 10,
        is_active: true,
      });
    }
    setAddonGroupModalOpen(true);
  };

  const handleSaveAddonGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingAddonGroup(true);

    try {
      const url = editingAddonGroup
        ? `${API_BASE_URL}/v1/vendor/addon-groups/${editingAddonGroup.id}/`
        : `${API_BASE_URL}/v1/vendor/addon-groups/`;
      const method = editingAddonGroup ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addonGroupFormData),
      });

      if (res.ok) {
        notifySuccess(
          editingAddonGroup
            ? "Customization group updated."
            : "New add-on group created."
        );
        setAddonGroupModalOpen(false);
        fetchCatalogData();
      } else {
        const errData = await res.json();
        notifyError(
          errData.min_selections?.[0] ||
            errData.max_selections?.[0] ||
            errData.name?.[0] ||
            "Failed to save add-on group."
        );
      }
    } catch {
      notifyError("Network error saving add-on group.");
    } finally {
      setSavingAddonGroup(false);
    }
  };

  // =============================================================
  // ADD-ON ITEM HANDLERS
  // =============================================================

  const handleOpenAddonItemModal = (group: VendorAddonGroup) => {
    setActiveAddonGroupForItems(group);
    setNewAddonItemData({
      name: "",
      price: "30.00",
      display_order: group.items.length * 10,
    });
    setAddonItemModalOpen(true);
  };

  const handleCreateAddonItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeAddonGroupForItems) return;
    setSavingAddonItem(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/vendor/addon-groups/${activeAddonGroupForItems.id}/items/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAddonItemData),
        }
      );

      if (res.ok) {
        notifySuccess(`Add-on item '${newAddonItemData.name}' created!`);
        setNewAddonItemData({
          name: "",
          price: "30.00",
          display_order: (activeAddonGroupForItems.items.length + 1) * 10,
        });
        await fetchCatalogData();
        const refreshed = addonGroups.find(
          (g) => g.id === activeAddonGroupForItems.id
        );
        if (refreshed) setActiveAddonGroupForItems(refreshed);
      } else {
        const errData = await res.json();
        notifyError(errData.price?.[0] || errData.name?.[0] || "Failed to create item.");
      }
    } catch {
      notifyError("Network error saving add-on item.");
    } finally {
      setSavingAddonItem(false);
    }
  };

  const handleDeleteAddonItem = async (groupId: string, itemId: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/vendor/addon-groups/${groupId}/items/${itemId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        notifySuccess("Add-on option removed.");
        await fetchCatalogData();
        const refreshed = addonGroups.find((g) => g.id === groupId);
        if (refreshed) setActiveAddonGroupForItems(refreshed);
      }
    } catch {
      notifyError("Failed to remove item.");
    }
  };

  // =============================================================
  // LOADING / INITIAL STATE
  // =============================================================

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-xs font-bold text-brand-muted">
          Loading vendor workspace...
        </p>
      </div>
    );
  }

  // If vendor has not applied for a shop yet
  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-surface mx-auto flex items-center justify-center text-brand-orange">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-brand-charcoal">
          No Shop Application on File
        </h1>
        <p className="text-sm text-brand-muted max-w-md mx-auto">
          You are signed in as a vendor, but have not yet registered a shop kitchen.
        </p>
        <Link
          href="/vendor/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-charcoal text-white text-xs font-black hover:bg-brand-orange transition-colors"
        >
          <span>Submit Shop Application</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isApproved = shop.status === "APPROVED";

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Toast Notices */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-200" />
          <span className="text-xs font-bold">{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-tomato text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-white" />
          <span className="text-xs font-bold">{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-charcoal tracking-tight">
              {shop.name}
            </h1>
            {shop.status === "APPROVED" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved</span>
              </span>
            )}
            {shop.status === "PENDING" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pending Review</span>
              </span>
            )}
            {shop.status === "REJECTED" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300">
                <XCircle className="w-3.5 h-3.5" />
                <span>Action Required</span>
              </span>
            )}
          </div>
          <p className="text-xs text-brand-muted mt-1">
            Vendor Partner: <strong className="text-brand-charcoal">{user?.username}</strong> • Slug: /{shop.slug}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isApproved && (
            <Link
              href={`/shops/${shop.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-charcoal"
            >
              <span>View Live Menu</span>
              <ExternalLink className="w-3.5 h-3.5 text-brand-orange" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              fetchVendorShop();
              if (isApproved) fetchCatalogData();
            }}
            className="p-2.5 rounded-full border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
            title="Refresh status and catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isApproved && (
            <button
              type="button"
              disabled={togglingAccepting}
              onClick={handleToggleAcceptingOrders}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                shop.is_accepting_orders
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                {shop.is_accepting_orders ? "Accepting Orders" : "Kitchen Paused"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Status Warning Banners for Unapproved Shops */}
      {shop.status === "PENDING" && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Application is under Platform Administrator Review</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-800/90">
            Thank you for registering your kitchen on BHUKKAD VERSE! Operations verifies commercial
            address, kitchen hygiene, and menu setup before publishing your shop to customer search.
            Menu management tools will unlock the moment your kitchen is approved.
          </p>
        </div>
      )}

      {shop.status === "REJECTED" && (
        <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-red-900 space-y-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <XCircle className="w-5 h-5 text-red-600" />
            <span>Application Feedback from Platform Administrator</span>
          </div>
          <div className="p-3 bg-white/80 rounded-2xl border border-red-200 text-xs text-red-950 font-medium">
            &ldquo;{shop.admin_review_notes || "Please update your commercial details and resubmit."}&rdquo;
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab("overview");
              setIsEditingShop(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Information & Resubmit Application</span>
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-brand-border gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Kitchen Overview</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("hours");
            fetchOperatingHours();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "hours"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Hours & Live Status</span>
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("menucard");
            fetchMenuCards();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "menucard"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Original Menu Card</span>
          {menuCards.some((c) => c.is_active) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white inline-block"></span>
          )}
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "categories"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Menu Categories ({categories.length})</span>
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "products"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Food Items & Sizes ({products.length})</span>
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("addons")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "addons"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Customization Add-ons ({addonGroups.length})</span>
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("videos");
            fetchVendorVideos();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "videos"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <Video className="w-4 h-4 text-brand-orange" />
          <span>Kitchen Video Reels ({vendorVideos.length})</span>
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("complaints");
            fetchComplaints();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "complaints"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-brand-muted hover:bg-brand-surface"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Complaints ({complaints.length})</span>
          {complaints.some((c) => c.status === "OPEN") && (
            <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white inline-block"></span>
          )}
          {!isApproved && <span className="text-[10px] text-brand-orange">🔒</span>}
        </button>
      </div>

      {/* =============================================================
          TAB 1: KITCHEN OVERVIEW
         ============================================================= */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Kitchen Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-brand-border space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <h2 className="text-base font-black text-brand-charcoal">
                  Kitchen Profile
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingShop(!isEditingShop)}
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingShop ? "Cancel Edit" : "Edit Details"}</span>
                </button>
              </div>

              {isEditingShop ? (
                <form onSubmit={handleResubmitOrUpdateShop} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.city}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, city: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                      Address Line
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.address_line}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          address_line: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={updatingShop}
                      className="px-6 py-2.5 rounded-full bg-brand-charcoal text-white font-bold text-xs hover:bg-brand-orange disabled:opacity-60 cursor-pointer"
                    >
                      {updatingShop
                        ? "Saving..."
                        : shop.status === "REJECTED"
                        ? "Update & Resubmit"
                        : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingShop(false)}
                      className="px-5 py-2.5 rounded-full border border-brand-border text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="text-brand-muted leading-relaxed">
                    {shop.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-brand-border/60">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-tomato shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-brand-charcoal">
                          Address
                        </p>
                        <p className="text-xs text-brand-muted">
                          {shop.address_line}, {shop.city} - {shop.postal_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-brand-charcoal">
                          Operating Hours
                        </p>
                        <p className="text-xs text-brand-muted">
                          {shop.opening_time.slice(0, 5)} to {shop.closing_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Catalog Summary */}
            <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-orange" />
                <h2 className="text-base font-black text-brand-charcoal">
                  Catalogue & Menu Health
                </h2>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed">
                {isApproved
                  ? `Your kitchen catalog currently has ${categories.length} active categories, ${products.length} menu items, and ${addonGroups.length} add-on customization groups configured.`
                  : "Menu management tools will activate once your shop is verified and approved by the platform team."}
              </p>
            </div>
          </div>

          {/* Right: Operational Statistics */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-brand-border space-y-4 shadow-xs">
              <h2 className="text-base font-black text-brand-charcoal pb-3 border-b border-brand-border">
                Operations & Economics
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-brand-border/60">
                  <span className="text-brand-muted">Delivery Radius:</span>
                  <span className="font-black text-brand-charcoal">
                    {shop.delivery_radius_km} km
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-border/60">
                  <span className="text-brand-muted">Min. Order Value:</span>
                  <span className="font-black text-brand-charcoal">
                    ₹{shop.minimum_order_value}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-border/60">
                  <span className="text-brand-muted">Platform Commission:</span>
                  <span className="font-black text-brand-orange">
                    {shop.commission_rate_percentage}%
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-brand-muted">Tenant Isolation:</span>
                  <span className="font-black text-emerald-600">
                    Active & Enforced
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          TAB: OPERATING HOURS & LIVE STATUS
         ============================================================= */}
      {activeTab === "hours" && (
        <div className="space-y-6">
          {!isApproved ? (
            <div className="bg-white p-8 rounded-3xl border border-brand-border text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">
                Operating Schedule Locked
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Only approved vendor kitchens can customize their weekly schedule and live order status. Your application is currently {shop.status.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
              {/* Section 1: Live Status & Instant Order Pause */}
              <div className="bg-white p-6 rounded-3xl border border-brand-border space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
                  <div>
                    <h2 className="text-base font-black text-brand-charcoal flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-orange" />
                      <span>Live Operational Status</span>
                    </h2>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Evaluated in <strong>{shop.timezone || "Asia/Kolkata"}</strong> local time.
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-muted">Current Customer State:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        shop.is_accepting_orders
                          ? shop.live_status?.status_code === "OPEN"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {shop.live_status?.status_display ||
                        (shop.is_accepting_orders ? "Open For Orders" : "Kitchen Paused")}
                    </span>
                  </div>
                </div>

                {/* Instant Pause / Resume Controls */}
                <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black text-brand-charcoal uppercase tracking-wider">
                        {shop.is_accepting_orders ? "Pause Live Orders" : "Resume Order Intake"}
                      </h3>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {shop.is_accepting_orders
                          ? "Temporarily stop incoming customer orders during rush hours or restocking without altering your weekly hours."
                          : "Your kitchen is currently paused. Resume when you are ready to receive customer orders again."}
                      </p>
                      {!shop.is_accepting_orders && shop.order_pause_reason && (
                        <p className="text-xs text-amber-800 font-bold mt-1">
                          Current Reason: &ldquo;{shop.order_pause_reason}&rdquo;
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={togglingPause}
                      onClick={() => handleToggleOrders(!shop.is_accepting_orders)}
                      className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                        shop.is_accepting_orders
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      {togglingPause ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {shop.is_accepting_orders ? "Pause Orders Now" : "Resume Accepting Orders"}
                      </span>
                    </button>
                  </div>

                  {shop.is_accepting_orders && (
                    <div className="pt-2 border-t border-brand-border/60 flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={pauseReasonInput}
                        onChange={(e) => setPauseReasonInput(e.target.value)}
                        placeholder="Optional pause reason (e.g. Heavy rush, inventory restocking, deep cleaning)"
                        className="w-full text-xs px-3.5 py-2 rounded-xl bg-white border border-brand-border text-brand-charcoal"
                      />
                      <span className="text-[11px] text-brand-muted shrink-0">
                        Shown truthfully to customers while paused.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Weekly Operating Schedule Table */}
              <div className="bg-white p-6 rounded-3xl border border-brand-border space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
                  <div>
                    <h2 className="text-base font-black text-brand-charcoal">
                      Weekly Operating Schedule
                    </h2>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Define daily kitchen opening and closing times. Supports overnight schedules that close past midnight.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={hoursSaving || hoursLoading}
                    onClick={handleSaveOperatingHours}
                    className="px-6 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {hoursSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Schedule...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Save Weekly Schedule</span>
                      </>
                    )}
                  </button>
                </div>

                {hoursLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                    <span className="text-xs font-bold text-brand-muted">Loading weekly schedule...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border/60">
                    {WEEKDAY_LABELS.map((dayLabel, index) => {
                      const daySchedule = operatingHours.find((h) => h.weekday === index) || {
                        weekday: index,
                        is_closed: false,
                        opening_time: "10:00:00",
                        closing_time: "23:00:00",
                      };

                      const openTimeStr = daySchedule.opening_time
                        ? daySchedule.opening_time.slice(0, 5)
                        : "10:00";
                      const closeTimeStr = daySchedule.closing_time
                        ? daySchedule.closing_time.slice(0, 5)
                        : "23:00";
                      const isOvernight = !daySchedule.is_closed && closeTimeStr < openTimeStr;

                      return (
                        <div
                          key={index}
                          className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="w-32 shrink-0">
                            <span className="text-xs font-black text-brand-charcoal block">
                              {dayLabel}
                            </span>
                            <span className="text-[11px] text-brand-muted">
                              {daySchedule.is_closed
                                ? "Closed All Day"
                                : isOvernight
                                ? "Overnight"
                                : "Regular Hours"}
                            </span>
                          </div>

                          {/* Closed Toggle Switch */}
                          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-brand-charcoal">
                            <input
                              type="checkbox"
                              checked={!daySchedule.is_closed}
                              onChange={(e) =>
                                updateHourDay(index, { is_closed: !e.target.checked })
                              }
                              className="rounded text-brand-orange focus:ring-brand-orange"
                            />
                            <span>{daySchedule.is_closed ? "Marked as Closed" : "Open for Business"}</span>
                          </label>

                          {/* Time Selectors */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-brand-muted uppercase">Opens:</span>
                              <input
                                type="time"
                                disabled={daySchedule.is_closed}
                                value={openTimeStr}
                                onChange={(e) =>
                                  updateHourDay(index, { opening_time: `${e.target.value}:00` })
                                }
                                className="px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs text-brand-charcoal disabled:opacity-40 disabled:bg-gray-100"
                              />
                            </div>

                            <span className="text-brand-muted font-bold">—</span>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-brand-muted uppercase">Closes:</span>
                              <input
                                type="time"
                                disabled={daySchedule.is_closed}
                                value={closeTimeStr}
                                onChange={(e) =>
                                  updateHourDay(index, { closing_time: `${e.target.value}:00` })
                                }
                                className="px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs text-brand-charcoal disabled:opacity-40 disabled:bg-gray-100"
                              />
                            </div>
                          </div>

                          {/* Overnight / Closed Badge */}
                          <div className="w-48 text-right shrink-0">
                            {daySchedule.is_closed ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-600">
                                Closed
                              </span>
                            ) : isOvernight ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200">
                                🌙 Closes Next Morning
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                ✓ Standard Day Slot
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}


      {/* =============================================================
          TAB 2B: ORIGINAL MENU CARD (Increment 2B)
         ============================================================= */}
      {activeTab === "menucard" && (
        <div className="space-y-6">
          {!isApproved ? (
            <div className="bg-white p-8 rounded-3xl border border-brand-border text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">
                Menu Card Management Locked
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Only approved vendor kitchens can upload and publish original menu cards. Your application is currently {shop.status.toLowerCase()}.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-brand-charcoal">
                    Original Menu Card Upload & Versioning
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Upload your printed dine-in menu (PDF, JPEG, PNG). Customers can view and zoom in on your official printed menu directly on your store page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchMenuCards}
                    disabled={menuCardsLoading}
                    className="p-2 rounded-full border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
                    title="Refresh menu cards"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${menuCardsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Active Menu Card Banner */}
              {(() => {
                const activeCard = menuCards.find((c) => c.is_active);
                if (activeCard) {
                  return (
                    <div className="bg-emerald-50/80 border border-emerald-300 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                              Live on Storefront
                            </span>
                            <span className="text-xs font-black text-emerald-950">
                              Version {activeCard.version}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-md border border-emerald-200">
                              {activeCard.file_type} • {activeCard.file_size_display}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-emerald-950 mt-1">
                            {activeCard.title || activeCard.original_filename}
                          </h3>
                          <p className="text-[11px] text-emerald-800/80 mt-0.5">
                            Original file: <span className="font-mono">{activeCard.original_filename}</span> • Uploaded on {new Date(activeCard.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewMenuCard(activeCard)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={activeCard.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={activeCard.original_filename}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                        <button
                          type="button"
                          disabled={actionCardId === activeCard.id}
                          onClick={() => handleArchiveMenuCard(activeCard.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-amber-50/80 border border-amber-300 rounded-3xl p-5 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-amber-950">
                          No Active Menu Card on Customer Storefront
                        </h4>
                        <p className="text-[11px] text-amber-800/90 mt-0.5">
                          Customers cannot see the &ldquo;View Original Menu&rdquo; button yet. Upload a menu card below or activate an archived version to showcase your printed menu to diners.
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Upload Form Card */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-brand-border space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div>
                    <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-wider">
                      Upload New Menu Card Version
                    </h3>
                    <p className="text-xs text-brand-muted">
                      Every upload automatically creates a distinct version and safely secures the file on server storage.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-brand-muted bg-brand-surface px-2.5 py-1 rounded-full border border-brand-border">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Virus & signature checked</span>
                  </span>
                </div>

                {menuUploadError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="font-semibold">{menuUploadError}</span>
                  </div>
                )}

                <form onSubmit={handleUploadMenuCard} className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsMenuDragOver(true);
                    }}
                    onDragLeave={() => setIsMenuDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsMenuDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        setSelectedMenuFile(e.dataTransfer.files[0]);
                        setMenuUploadError(null);
                      }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                      isMenuDragOver
                        ? "border-brand-orange bg-brand-orange/5 scale-[1.01]"
                        : "border-brand-border bg-brand-cream/40 hover:bg-brand-cream/70"
                    }`}
                    onClick={() => {
                      const input = document.getElementById("menu-file-input");
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="menu-file-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedMenuFile(e.target.files[0]);
                          setMenuUploadError(null);
                        }
                      }}
                    />

                    {selectedMenuFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-2xl bg-brand-orange text-white">
                          <FileCheck className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-black text-brand-charcoal">
                          {selectedMenuFile.name}
                        </span>
                        <span className="text-[11px] font-bold text-brand-muted">
                          {(selectedMenuFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedMenuFile.type || "Document"}
                        </span>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedMenuFile(null);
                          }}
                          className="mt-1 px-3 py-1 rounded-full bg-brand-surface hover:bg-red-50 text-red-600 text-xs font-bold border border-brand-border cursor-pointer inline-flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Change file</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-2xl bg-brand-charcoal text-white shadow-sm">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black text-brand-charcoal mt-1">
                          Click to browse or drag and drop your menu card file here
                        </p>
                        <p className="text-[11px] text-brand-muted max-w-sm">
                          Supported formats: <strong className="text-brand-charcoal">PDF, JPEG, JPG, PNG</strong> • Max file size: <strong className="text-brand-charcoal">10 MB</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Form Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-brand-charcoal uppercase mb-1">
                        Descriptive Label / Title (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Summer 2026 Dine-In & Takeaway Menu"
                        value={menuCardTitle}
                        onChange={(e) => setMenuCardTitle(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-xs text-brand-charcoal focus:ring-1 focus:ring-brand-orange outline-hidden"
                      />
                      <span className="text-[10px] text-brand-muted block mt-1">
                        Defaults to the original filename if left blank.
                      </span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:bg-brand-cream/40 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={menuCardIsActive}
                          onChange={(e) => setMenuCardIsActive(e.target.checked)}
                          className="w-4 h-4 text-brand-orange rounded border-brand-border focus:ring-brand-orange cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black text-brand-charcoal block">
                            Set as Active Menu immediately
                          </span>
                          <span className="text-[11px] text-brand-muted">
                            Automatically replaces any previously active menu card safely.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={uploadingMenuCard || !selectedMenuFile}
                      className="px-6 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingMenuCard ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading & Validating Menu Card...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-brand-cream" />
                          <span>Upload Menu Card</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Version History & Management Table */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-brand-border space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div>
                    <h3 className="text-sm font-black text-brand-charcoal uppercase tracking-wider">
                      Menu Card Version History ({menuCards.length})
                    </h3>
                    <p className="text-xs text-brand-muted">
                      All uploaded versions for {shop.name}. Archived versions are safely stored but hidden from customers.
                    </p>
                  </div>
                </div>

                {menuCardsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                    <span className="text-xs font-bold text-brand-muted">Loading version history...</span>
                  </div>
                ) : menuCards.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <FileText className="w-8 h-8 text-brand-muted mx-auto" />
                    <h4 className="text-xs font-black text-brand-charcoal">No menu cards uploaded yet</h4>
                    <p className="text-[11px] text-brand-muted max-w-sm mx-auto">
                      Use the upload box above to add your first physical menu card version.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-brand-border/60 text-brand-muted font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Ver</th>
                          <th className="py-2.5 px-3">Title / Filename</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">Uploaded</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/50">
                        {menuCards.map((card) => (
                          <tr key={card.id} className="hover:bg-brand-cream/30 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-brand-charcoal">
                              v{card.version}
                            </td>
                            <td className="py-3 px-3 font-bold text-brand-charcoal">
                              <div>{card.title || card.original_filename}</div>
                              <span className="text-[10px] font-normal text-brand-muted font-mono">
                                {card.original_filename}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-surface border border-brand-border text-brand-charcoal">
                                {card.file_type}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-brand-muted">
                              {card.file_size_display}
                            </td>
                            <td className="py-3 px-3 text-brand-muted">
                              {new Date(card.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3">
                              {card.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-200 text-gray-700">
                                  <span>Archived</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewMenuCard(card)}
                                  className="p-1.5 rounded-lg border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
                                  title="Preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={card.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={card.original_filename}
                                  className="p-1.5 rounded-lg border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>

                                {card.is_active ? (
                                  <button
                                    type="button"
                                    disabled={actionCardId === card.id}
                                    onClick={() => handleArchiveMenuCard(card.id)}
                                    className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                    title="Archive this version"
                                  >
                                    Archive
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={actionCardId === card.id}
                                    onClick={() => handleActivateMenuCard(card.id)}
                                    className="px-2.5 py-1 rounded-lg border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                    title="Make this version active on store"
                                  >
                                    Set Active
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={actionCardId === card.id}
                                  onClick={() => handleDeleteMenuCard(card)}
                                  className="p-1.5 rounded-lg border border-brand-border hover:bg-red-50 text-red-600 cursor-pointer disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* =============================================================
          TAB 3: MENU CATEGORIES
         ============================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {!isApproved ? (
            <div className="bg-white p-8 rounded-3xl border border-brand-border text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">
                Category Management Locked
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Only approved vendor kitchens can configure custom categories. Your application is currently {shop.status.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-brand-charcoal">
                    Menu Categories
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Organize your kitchen offerings (e.g. Burgers, Veg Pizzas, Shakes, French Fries).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCategoryModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-3">
                  <FolderPlus className="w-10 h-10 text-brand-muted mx-auto" />
                  <h3 className="text-base font-black text-brand-charcoal">
                    No Categories Created Yet
                  </h3>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    Create your first category to start adding dishes and drinks to your menu.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenCategoryModal()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Category</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white p-5 rounded-3xl border border-brand-border space-y-3 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-black text-brand-charcoal">
                              {cat.name}
                            </h3>
                            <span className="text-[10px] text-brand-muted">
                              Slug: /{cat.slug} • Order: {cat.display_order}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              cat.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {cat.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-brand-muted mt-2 line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-charcoal">
                          {cat.product_count} {cat.product_count === 1 ? "Product" : "Products"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat)}
                            className="text-xs font-bold text-brand-muted hover:text-brand-charcoal cursor-pointer"
                          >
                            {cat.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="p-1.5 rounded-lg border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* =============================================================
          TAB 3: FOOD ITEMS & VARIANTS
         ============================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {!isApproved ? (
            <div className="bg-white p-8 rounded-3xl border border-brand-border text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">
                Product Catalog Locked
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Only approved vendor kitchens can publish dishes. Your application is currently {shop.status.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-brand-charcoal">
                    Food Items & Pricing
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Manage food recipes, base pricing, size variants (Regular, Medium, Large), and in-stock status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenProductModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Food Item</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-3">
                  <Utensils className="w-10 h-10 text-brand-muted mx-auto" />
                  <h3 className="text-base font-black text-brand-charcoal">
                    No Food Items Yet
                  </h3>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    Add signature pizzas, burgers, shakes, and sides to your storefront menu.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenProductModal()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white p-5 rounded-3xl border border-brand-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-lg">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                              prod.dietary_type === "VEG"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-red-50 text-red-700 border-red-300"
                            }`}
                          >
                            {prod.dietary_type}
                          </span>
                          <span className="text-[11px] font-bold text-brand-orange uppercase">
                            {prod.category_name}
                          </span>
                          <span className="text-[10px] text-brand-muted">
                            • {prod.preparation_time_minutes} mins prep
                          </span>
                        </div>

                        <h3 className="text-base font-black text-brand-charcoal">
                          {prod.name}
                        </h3>

                        {prod.description && (
                          <p className="text-xs text-brand-muted line-clamp-1">
                            {prod.description}
                          </p>
                        )}

                        {/* Variants pill list */}
                        {prod.has_variants && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-bold text-brand-muted">
                              Variants ({prod.variants?.length || 0}):
                            </span>
                            {prod.variants?.map((v) => (
                              <span
                                key={v.id}
                                className="text-[10px] font-semibold bg-brand-surface border border-brand-border px-2 py-0.5 rounded-md"
                              >
                                {v.name}: ₹{v.price}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-brand-border">
                        <div className="text-right">
                          <span className="text-base font-black text-brand-charcoal block">
                            ₹{prod.base_price}
                          </span>
                          <span className="text-[10px] text-brand-muted">
                            {prod.has_variants ? "Base Starting" : "Direct Price"}
                          </span>
                        </div>

                        {/* In-Stock / Sold-out toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleProductAvailability(prod)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            prod.is_available
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {prod.is_available ? "In Stock" : "Sold Out"}
                        </button>

                        {/* Manage Variants Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenVariantModal(prod)}
                          className="px-3 py-1.5 rounded-full border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-charcoal cursor-pointer flex items-center gap-1"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-orange" />
                          <span>Sizes ({prod.variants?.length || 0})</span>
                        </button>

                        {/* Edit Product Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenProductModal(prod)}
                          className="p-2 rounded-xl border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
                          title="Edit Dish"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Dish Button */}
                        <button
                          type="button"
                          disabled={deletingProductId === prod.id}
                          onClick={() => handleDeleteProduct(prod)}
                          className="p-2 rounded-xl border border-brand-border hover:bg-red-50 text-red-600 cursor-pointer disabled:opacity-50 transition-colors"
                          title="Delete Dish Permanently"
                        >
                          {deletingProductId === prod.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}


      {/* =============================================================
          TAB 4: ADD-ON GROUPS & CUSTOMIZATIONS
         ============================================================= */}
      {activeTab === "addons" && (
        <div className="space-y-6">
          {!isApproved ? (
            <div className="bg-white p-8 rounded-3xl border border-brand-border text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">
                Customizations Locked
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Only approved vendor kitchens can configure add-on groups.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-brand-charcoal">
                    Add-on Groups & Customizations
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Configure optional and required add-on choices (e.g. Extra Cheese, Cheese Burst, Extra Toppings).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddonGroupModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Add-on Group</span>
                </button>
              </div>

              {addonGroups.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-3">
                  <SlidersHorizontal className="w-10 h-10 text-brand-muted mx-auto" />
                  <h3 className="text-base font-black text-brand-charcoal">
                    No Add-on Groups Yet
                  </h3>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    Create groups like &apos;Choose Crust&apos; or &apos;Extra Cheese&apos; and link them to your dishes.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddonGroupModal()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Add-on Group</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addonGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white p-5 rounded-3xl border border-brand-border space-y-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-brand-charcoal">
                              {group.name}
                            </h3>
                            {group.is_required && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-tomato/10 text-brand-tomato uppercase">
                                Required
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-brand-muted">
                            Min: {group.min_selections} • Max: {group.max_selections} selections
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAddonGroupModal(group)}
                            className="p-1.5 rounded-lg border border-brand-border hover:bg-brand-surface text-brand-charcoal cursor-pointer"
                            title="Edit Group"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddonItemModal(group)}
                            className="px-3 py-1 rounded-full bg-brand-surface hover:bg-brand-border text-xs font-bold text-brand-charcoal cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Choice</span>
                          </button>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 pt-2 border-t border-brand-border/60">
                        <span className="text-[11px] font-bold uppercase text-brand-muted block">
                          Choices in this group ({group.items.length})
                        </span>
                        {group.items.length === 0 ? (
                          <p className="text-xs text-brand-muted italic py-1">
                            No options in this group yet. Click &apos;Add Choice&apos; above.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-brand-surface/60 border border-brand-border text-xs"
                              >
                                <span className="font-semibold text-brand-charcoal">
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-brand-muted">
                                    +₹{item.price}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteAddonItem(group.id, item.id)
                                    }
                                    className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                                    title="Delete choice"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =============================================================
          TAB 6: CUSTOMER COMPLAINTS & QUERIES
         ============================================================= */}
      {activeTab === "complaints" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-brand-charcoal">
                  Customer Complaints &amp; Resolution
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-black">
                  {complaints.filter((c) => c.status === "OPEN").length} Open
                </span>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">
                Inquiries and quality feedback submitted by customers specifically for your kitchen.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchComplaints}
              disabled={complaintsLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-charcoal transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${complaintsLoading ? "animate-spin" : ""}`} />
              <span>Refresh Complaints</span>
            </button>
          </div>

          {complaintsLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto mb-2" />
              <p className="text-xs text-brand-muted font-bold">Loading kitchen complaints...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-black text-brand-charcoal">
                Zero Customer Complaints
              </h3>
              <p className="text-xs text-brand-muted max-w-sm mx-auto">
                Outstanding work! Your kitchen has no active disputes or complaints from customers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`bg-white p-6 rounded-3xl border transition-all space-y-4 shadow-xs ${
                    ticket.status === "OPEN"
                      ? "border-amber-300 ring-1 ring-amber-100"
                      : "border-brand-border opacity-90"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-border">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-brand-charcoal bg-brand-surface px-3 py-1 rounded-full border border-brand-border">
                        #{ticket.ticket_number}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          ticket.status === "OPEN"
                            ? "bg-red-100 text-red-800"
                            : ticket.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ticket.status_display || ticket.status}
                      </span>
                      <span className="text-xs font-bold text-brand-orange">
                        {ticket.category_display || ticket.category}
                      </span>
                    </div>

                    <span className="text-[11px] text-brand-muted">
                      {new Date(ticket.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-brand-charcoal">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-brand-muted leading-relaxed whitespace-pre-wrap bg-brand-cream/40 p-3.5 rounded-2xl border border-brand-border/60">
                      {ticket.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted pt-1">
                    <span>
                      Customer: <strong className="text-brand-charcoal">{ticket.customer_name}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Phone:{" "}
                      <a
                        href={`tel:${ticket.customer_phone}`}
                        className="text-brand-orange font-bold hover:underline"
                      >
                        {ticket.customer_phone}
                      </a>
                    </span>
                    {ticket.order_id && (
                      <>
                        <span>•</span>
                        <span>
                          Order: <strong className="text-brand-charcoal">{ticket.order_id}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {ticket.status === "RESOLVED" ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Resolved by Kitchen Manager</span>
                      </div>
                      {ticket.resolution_notes && (
                        <p className="text-[11px] text-emerald-800 italic">
                          &ldquo;{ticket.resolution_notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-brand-border space-y-2">
                      <label className="text-[11px] font-black uppercase text-brand-charcoal block">
                        Provide Resolution / Action Taken:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Apologized to customer, dispatched fresh replacement with dessert."
                          value={resolutionText[ticket.id] || ""}
                          onChange={(e) =>
                            setResolutionText({
                              ...resolutionText,
                              [ticket.id]: e.target.value,
                            })
                          }
                          className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-brand-cream/60 border border-brand-border"
                        />
                        <button
                          type="button"
                          disabled={resolvingComplaintId === ticket.id}
                          onClick={() => handleResolveComplaint(ticket.id)}
                          className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase cursor-pointer transition-colors shadow-2xs whitespace-nowrap disabled:opacity-50"
                        >
                          {resolvingComplaintId === ticket.id ? "Resolving..." : "Mark as Resolved"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          MODAL 1: CATEGORY CREATE / EDIT
         ============================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-black text-brand-charcoal">
                {editingCategory ? "Edit Category" : "New Menu Category"}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-brand-muted hover:text-brand-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Veg Pizzas, Burgers, Shakes"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Fresh hand-tossed dough with signature sauces..."
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={categoryFormData.display_order}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Status
                  </label>
                  <select
                    value={categoryFormData.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        is_active: e.target.value === "true",
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-brand-border">
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex-1 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingCategory ? "Saving..." : "Save Category"}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-brand-border text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 2: PRODUCT CREATE / EDIT
         ============================================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-black text-brand-charcoal">
                {editingProduct ? "Edit Food Item" : "New Food Item"}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-brand-muted hover:text-brand-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Category
                </label>
                <select
                  required
                  value={productFormData.category}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Dish / Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farmhouse Veggie Pizza"
                  value={productFormData.name}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Fresh mozzarella, capsicum, mushroom, and tomato slices..."
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productFormData.base_price}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        base_price: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Dietary
                  </label>
                  <select
                    value={productFormData.dietary_type}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        dietary_type: e.target.value as "VEG" | "NON_VEG" | "EGG" | "VEGAN",
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  >
                    <option value="VEG">VEG</option>
                    <option value="NON_VEG">NON-VEG</option>
                    <option value="EGG">CONTAINS EGG</option>
                    <option value="VEGAN">VEGAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Prep (Mins)
                  </label>
                  <input
                    type="number"
                    value={productFormData.preparation_time_minutes}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        preparation_time_minutes: parseInt(e.target.value) || 15,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  />
                </div>
              </div>

              {/* Dish Photo / Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Dish Photo (Upload Image or Paste URL)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Image Preview Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface/60 overflow-hidden flex items-center justify-center shrink-0">
                    {productImagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={productImagePreview}
                        alt="Dish Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Utensils className="w-6 h-6 text-brand-muted" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-charcoal cursor-pointer shadow-2xs transition-colors">
                      <Plus className="w-3.5 h-3.5 text-brand-orange" />
                      <span>{productImageFile ? productImageFile.name : "Choose Food Image File"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProductImageFile(file);
                            setProductImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>

                    <input
                      type="url"
                      placeholder="Or paste image URL (https://... or Google Drive link)"
                      value={productFormData.image_url}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val.includes("drive.google.com/file/d/")) {
                          val = val.replace(/.*\/d\/([a-zA-Z0-9_-]+).*/, "https://drive.google.com/uc?export=view&id=$1");
                        }
                        setProductFormData({
                          ...productFormData,
                          image_url: val,
                        });
                        if (!productImageFile && val) {
                          setProductImagePreview(val);
                        }
                      }}
                      className="w-full px-4 py-1.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Has Variants Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface border border-brand-border">
                <input
                  type="checkbox"
                  id="has_variants"
                  checked={productFormData.has_variants}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      has_variants: e.target.checked,
                    })
                  }
                  className="accent-brand-orange w-4 h-4"
                />
                <label
                  htmlFor="has_variants"
                  className="text-xs font-bold text-brand-charcoal cursor-pointer"
                >
                  This dish has multiple size options (Regular, Medium, Large)
                </label>
              </div>

              {/* Add-on Groups Multi-select */}
              {addonGroups.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-2">
                    Available Customization Groups for this Dish
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-3 rounded-2xl bg-brand-cream/60 border border-brand-border">
                    {addonGroups.map((group) => {
                      const isChecked = productFormData.addon_groups.includes(group.id);
                      return (
                        <label
                          key={group.id}
                          className="flex items-center gap-2 text-xs font-medium text-brand-charcoal cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setProductFormData({
                                ...productFormData,
                                addon_groups: checked
                                  ? [...productFormData.addon_groups, group.id]
                                  : productFormData.addon_groups.filter(
                                      (id) => id !== group.id
                                    ),
                              });
                            }}
                            className="accent-brand-orange w-4 h-4"
                          />
                          <span>{group.name}</span>
                          <span className="text-[10px] text-brand-muted">
                            ({group.items.length} choices)
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-brand-border">
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingProduct ? "Saving..." : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-brand-border text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 3: PRODUCT VARIANTS MANAGEMENT
         ============================================================= */}
      {variantModalOpen && activeVariantProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-brand-orange uppercase">
                  Size & Price Configurator
                </span>
                <h3 className="text-base font-black text-brand-charcoal">
                  {activeVariantProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVariantModalOpen(false)}
                className="p-1 text-brand-muted hover:text-brand-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Variants Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-charcoal uppercase block">
                Existing Size Options
              </span>
              {(activeVariantProduct.variants?.length || 0) === 0 ? (
                <p className="text-xs text-brand-muted italic py-2">
                  No size variants added yet. Add sizes below (e.g. Regular, Medium, Large).
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeVariantProduct.variants?.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-brand-surface/60 border border-brand-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-charcoal">{v.name}</span>
                        {v.is_default && (
                          <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-brand-charcoal">₹{v.price}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(v.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Delete size"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Variant Form */}
            <form onSubmit={handleCreateVariant} className="space-y-3 pt-3 border-t border-brand-border">
              <span className="text-xs font-bold text-brand-charcoal uppercase block">
                Add Size Variant
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-brand-muted mb-1">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medium (10 inch)"
                    value={newVariantData.name}
                    onChange={(e) =>
                      setNewVariantData({ ...newVariantData, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-brand-muted mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="249.00"
                    value={newVariantData.price}
                    onChange={(e) =>
                      setNewVariantData({ ...newVariantData, price: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="variant_default"
                  checked={newVariantData.is_default}
                  onChange={(e) =>
                    setNewVariantData({
                      ...newVariantData,
                      is_default: e.target.checked,
                    })
                  }
                  className="accent-brand-orange w-3.5 h-3.5"
                />
                <label
                  htmlFor="variant_default"
                  className="text-xs text-brand-muted cursor-pointer"
                >
                  Set as default selected size
                </label>
              </div>

              <button
                type="submit"
                disabled={savingVariant}
                className="w-full py-2 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-60"
              >
                {savingVariant ? "Adding..." : "Add Size Option"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 4: ADD-ON GROUP CREATE / EDIT
         ============================================================= */}
      {addonGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-black text-brand-charcoal">
                {editingAddonGroup ? "Edit Add-on Group" : "New Add-on Group"}
              </h3>
              <button
                type="button"
                onClick={() => setAddonGroupModalOpen(false)}
                className="p-1 text-brand-muted hover:text-brand-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddonGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Choose Crust, Extra Toppings"
                  value={addonGroupFormData.name}
                  onChange={(e) =>
                    setAddonGroupFormData({
                      ...addonGroupFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Min Selections
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addonGroupFormData.min_selections}
                    onChange={(e) =>
                      setAddonGroupFormData({
                        ...addonGroupFormData,
                        min_selections: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                    Max Selections
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addonGroupFormData.max_selections}
                    onChange={(e) =>
                      setAddonGroupFormData({
                        ...addonGroupFormData,
                        max_selections: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-brand-surface border border-brand-border">
                <input
                  type="checkbox"
                  id="is_required_group"
                  checked={addonGroupFormData.is_required}
                  onChange={(e) =>
                    setAddonGroupFormData({
                      ...addonGroupFormData,
                      is_required: e.target.checked,
                    })
                  }
                  className="accent-brand-orange w-4 h-4"
                />
                <label
                  htmlFor="is_required_group"
                  className="text-xs font-bold text-brand-charcoal cursor-pointer"
                >
                  Customer selection is mandatory
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-brand-border">
                <button
                  type="submit"
                  disabled={savingAddonGroup}
                  className="flex-1 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingAddonGroup ? "Saving..." : "Save Group"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddonGroupModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-brand-border text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 5: ADD-ON ITEM / CHOICE CREATE
         ============================================================= */}
      {addonItemModalOpen && activeAddonGroupForItems && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-brand-orange uppercase">
                  Add Choice to Group
                </span>
                <h3 className="text-base font-black text-brand-charcoal">
                  {activeAddonGroupForItems.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddonItemModalOpen(false)}
                className="p-1 text-brand-muted hover:text-brand-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAddonItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Choice Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cheese Burst Crust, Extra Olives"
                  value={newAddonItemData.name}
                  onChange={(e) =>
                    setNewAddonItemData({
                      ...newAddonItemData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-brand-charcoal mb-1">
                  Additional Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50.00"
                  value={newAddonItemData.price}
                  onChange={(e) =>
                    setNewAddonItemData({
                      ...newAddonItemData,
                      price: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-brand-cream/60 border border-brand-border text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-brand-border">
                <button
                  type="submit"
                  disabled={savingAddonItem}
                  className="flex-1 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingAddonItem ? "Adding..." : "Add Choice"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddonItemModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-brand-border text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =============================================================
          MODAL 6: VENDOR MENU CARD PREVIEW MODAL (Increment 2B)
         ============================================================= */}
      {previewMenuCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-brand-border overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-border bg-brand-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-charcoal text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-brand-charcoal">
                      {previewMenuCard.title || previewMenuCard.original_filename}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-charcoal text-white">
                      v{previewMenuCard.version}
                    </span>
                    {previewMenuCard.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    {previewMenuCard.original_filename} • {previewMenuCard.file_type} • {previewMenuCard.file_size_display}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getMediaUrl(previewMenuCard.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewMenuCard.original_filename}
                  className="p-2 rounded-full border border-brand-border hover:bg-white text-brand-charcoal cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMenuCard(null)}
                  className="p-2 rounded-full border border-brand-border hover:bg-white text-brand-charcoal cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-gray-50 min-h-[50vh]">
              {previewMenuCard.file_type === "PDF" ? (
                <div className="w-full h-[70vh] flex flex-col gap-2">
                  <iframe
                    src={getMediaUrl(previewMenuCard.file_url)}
                    title="Menu Card PDF Preview"
                    className="w-full flex-1 rounded-2xl border border-brand-border shadow-xs bg-white"
                  />
                  <div className="text-center text-[11px] text-brand-muted">
                    Browser preview not rendering?{" "}
                    <a
                      href={getMediaUrl(previewMenuCard.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-orange underline font-bold"
                    >
                      Open PDF in a new window
                    </a>
                  </div>
                </div>
              ) : (
                <div className="max-h-[70vh] max-w-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={getMediaUrl(previewMenuCard.file_url)}
                    alt={previewMenuCard.title || "Menu Card"}
                    className="max-h-[68vh] max-w-full object-contain rounded-2xl border border-brand-border shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          TAB 8: SHOWCASE VIDEOS (FRONT-PAGE REELS)
         ============================================================= */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-border shadow-xs">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-brand-charcoal flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-orange" />
                <span>Front-Page Showcase Videos & Reels</span>
              </h2>
              <p className="text-xs text-brand-muted">
                Upload behind-the-scenes food preparation clips and sizzling signature dishes featured on the BHUKKAD VERSE homepage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddVideoModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Showcase Video</span>
            </button>
          </div>

          {vendorVideosLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange mx-auto mb-2" />
              <p className="text-xs text-brand-muted">Loading your kitchen videos...</p>
            </div>
          ) : vendorVideos.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-4">
              <Video className="w-12 h-12 text-brand-muted mx-auto opacity-40" />
              <h3 className="text-base font-black text-brand-charcoal">
                No Showcase Videos Uploaded Yet
              </h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Promote your kitchen by uploading short video clips of your dishes being cooked, garnished, or served.
              </p>
              <button
                type="button"
                onClick={() => setIsAddVideoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-brand-charcoal text-white text-xs font-bold hover:bg-brand-orange cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Video</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <video
                      src={getMediaUrl(vid.effective_video_url)}
                      poster={vid.thumbnail_url || undefined}
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                    />
                    {vid.is_featured && (
                      <span className="absolute top-2 left-2 bg-brand-orange text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Featured on Home
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-sm text-brand-charcoal line-clamp-1">
                        {vid.title}
                      </h4>
                      {vid.caption && (
                        <p className="text-xs text-brand-muted line-clamp-2 mt-1">
                          {vid.caption}
                        </p>
                      )}
                      {vid.product_name && (
                        <div className="mt-2 text-[11px] font-bold text-brand-orange flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Linked Dish: {vid.product_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        {new Date(vid.created_at).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        disabled={deletingVideoId === vid.id}
                        onClick={() => handleDeleteVideo(vid.id, vid.title)}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 p-1.5 rounded-xl hover:bg-red-50 cursor-pointer disabled:opacity-50"
                      >
                        {deletingVideoId === vid.id ? (
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

          {/* Add Video Modal */}
          {isAddVideoModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-lg w-full p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <h3 className="text-base font-black text-brand-charcoal flex items-center gap-2">
                    <Video className="w-5 h-5 text-brand-orange" />
                    <span>Upload Front-Page Showcase Video</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddVideoModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-brand-surface text-brand-muted cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateVideo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sizzling Tandoor Live Grill"
                      value={newVideoForm.title}
                      onChange={(e) => setNewVideoForm({ ...newVideoForm, title: e.target.value })}
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
                      onChange={(e) => setNewVideoFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-brand-charcoal file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-charcoal file:text-white hover:file:bg-brand-orange file:cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted mt-1 block">
                      Choose an MP4/WebM video file from your phone or PC.
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
                      required
                      placeholder="https://.../video.mp4 or Google Drive sharing link"
                      value={newVideoForm.video_url}
                      onChange={(e) => setNewVideoForm({ ...newVideoForm, video_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                    <span className="text-[10px] text-brand-muted mt-1 block">
                      Google Drive sharing links will be converted to direct video streams automatically.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Preview Poster / Thumbnail URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://.../thumbnail.jpg"
                      value={newVideoForm.thumbnail_url}
                      onChange={(e) => setNewVideoForm({ ...newVideoForm, thumbnail_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-charcoal mb-1">
                      Link Specific Dish (Optional)
                    </label>
                    <select
                      value={newVideoForm.product}
                      onChange={(e) => setNewVideoForm({ ...newVideoForm, product: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange bg-white"
                    >
                      <option value="">-- No specific dish (Kitchen General) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.base_price})
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
                      placeholder="Describe what makes this dish or prep special..."
                      value={newVideoForm.caption}
                      onChange={(e) => setNewVideoForm({ ...newVideoForm, caption: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-2xl border border-brand-border text-xs focus:outline-brand-orange"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddVideoModalOpen(false)}
                      className="px-4 py-2 rounded-full border border-brand-border text-xs font-bold text-brand-muted hover:bg-brand-surface cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={videoSubmitting}
                      className="px-6 py-2 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {videoSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>Publish Video</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Auto-Generate Food Cards from Menu Modal */}
      {isAutoGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div>
                <h3 className="text-lg font-black text-brand-charcoal flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-orange" />
                  <span>Auto-Generate Food Cards from Menu</span>
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Extracted items from your menu card. Online food photos are automatically matched. You can edit names, prices, or change images.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoGenerateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-brand-surface text-brand-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Custom Dish Line */}
            <div className="bg-brand-surface/60 p-4 rounded-2xl border border-brand-border/80 space-y-3">
              <span className="text-xs font-black uppercase text-brand-charcoal block">
                + Add or Detect Another Dish
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Dish Name (e.g. Kadai Paneer)"
                  value={newParsedItem.name}
                  onChange={(e) => setNewParsedItem({ ...newParsedItem, name: e.target.value })}
                  className="sm:col-span-4 px-3 py-2 rounded-xl border border-brand-border text-xs bg-white focus:outline-brand-orange"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Main Course)"
                  value={newParsedItem.category}
                  onChange={(e) => setNewParsedItem({ ...newParsedItem, category: e.target.value })}
                  className="sm:col-span-3 px-3 py-2 rounded-xl border border-brand-border text-xs bg-white focus:outline-brand-orange"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newParsedItem.price}
                  onChange={(e) => setNewParsedItem({ ...newParsedItem, price: parseFloat(e.target.value) || 0 })}
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-brand-border text-xs bg-white focus:outline-brand-orange"
                />
                <select
                  value={newParsedItem.dietary_type}
                  onChange={(e: any) => setNewParsedItem({ ...newParsedItem, dietary_type: e.target.value })}
                  className="sm:col-span-2 px-2 py-2 rounded-xl border border-brand-border text-xs bg-white focus:outline-brand-orange"
                >
                  <option value="VEG">VEG</option>
                  <option value="NON_VEG">NON-VEG</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddDishToAutoGenList}
                  className="sm:col-span-1 p-2 rounded-xl bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black flex items-center justify-center cursor-pointer transition-colors"
                  title="Add to list"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Generated Dish Cards Preview Grid */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-brand-charcoal block">
                Detected Menu Cards ({autoGenDishesList.length} items ready to create)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {autoGenDishesList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-brand-border bg-white shadow-xs flex items-center gap-3 relative group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-brand-surface border border-brand-border">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.dietary_type === "VEG" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-brand-orange uppercase truncate">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-black text-xs text-brand-charcoal truncate">{item.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-brand-charcoal">₹{item.price}</span>
                        <input
                          type="url"
                          placeholder="Change Image URL..."
                          value={item.image_url}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            setAutoGenDishesList((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, image_url: newUrl } : d))
                            );
                          }}
                          className="w-36 text-[10px] px-2 py-0.5 rounded-lg border border-brand-border focus:outline-brand-orange"
                          title="Click to paste custom photo URL"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoGenDishesList((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-brand-muted">
                These cards will be created in your storefront and appear in the Homepage Continuous Slider immediately.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAutoGenerateModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-brand-border text-xs font-bold text-brand-muted hover:bg-brand-surface cursor-pointer w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={autoGenSubmitting || autoGenDishesList.length === 0}
                  onClick={handleExecuteAutoGenDishes}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-brand-orange to-brand-tomato hover:from-brand-amber hover:to-brand-orange text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {autoGenSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Food Cards...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create All {autoGenDishesList.length} Cards</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


{/* TAB: LIVE ORDERS & EARNINGS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-orange tracking-wider block">
                  Kitchen Live Order Dispatch
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-brand-charcoal mt-1">
                  Incoming Orders &amp; Chef Earnings
                </h2>
                <p className="text-xs text-brand-muted mt-1">
                  Manage live preparation pipeline and track your net 90% bank payout.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchVendorOrders}
                disabled={vendorOrdersLoading}
                className="px-4 py-2 rounded-xl bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${vendorOrdersLoading ? "animate-spin" : ""}`} />
                <span>Refresh Orders</span>
              </button>
            </div>

            {/* Financials Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                  Net Bank Payout Earned
                </span>
                <div className="text-2xl font-black text-emerald-900">
                  ₹{vendorFinancials?.net_vendor_payout?.toFixed(2) || "0.00"}
                </div>
                <p className="text-[10px] text-emerald-700">90% of total dish sales (Disbursed weekly)</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-1">
                <span className="text-[10px] font-black uppercase text-brand-muted tracking-wider block">
                  Gross Dish Sales
                </span>
                <div className="text-2xl font-black text-brand-charcoal">
                  ₹{vendorFinancials?.gross_dish_sales?.toFixed(2) || "0.00"}
                </div>
                <p className="text-[10px] text-brand-muted">Total food items sold to customers</p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider block">
                  Platform Commission (10%)
                </span>
                <div className="text-2xl font-black text-purple-900">
                  ₹{vendorFinancials?.total_commission_paid?.toFixed(2) || "0.00"}
                </div>
                <p className="text-[10px] text-purple-700">Governance &amp; app marketplace fee</p>
              </div>
            </div>

            {/* Orders Pipeline List */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-charcoal">
                Active Order Queue ({vendorOrders.length})
              </h3>

              {vendorOrdersLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-xs font-bold text-brand-muted">
                  <Loader2 className="w-4 h-4 text-brand-orange animate-spin" />
                  <span>Loading kitchen orders...</span>
                </div>
              ) : vendorOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-muted bg-brand-surface rounded-2xl border border-brand-border">
                  No orders currently waiting. When customers place orders, they will appear here in real time!
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl border border-brand-border bg-white shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-brand-charcoal">
                              Order #{ord.order_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ord.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : ord.status === "OUT_FOR_DELIVERY"
                                ? "bg-blue-100 text-blue-800"
                                : ord.status === "PREPARING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-muted mt-0.5">
                            Customer: <strong>{ord.customer_name}</strong> ({ord.customer_phone}) • {ord.delivery_address_line}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-brand-muted block">
                            Your Payout
                          </span>
                          <span className="text-lg font-black text-emerald-700">
                            ₹{ord.vendor_payout_amount}
                          </span>
                        </div>
                      </div>

                      {/* Dishes in this order */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase text-brand-muted">Items to Cook:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ord.items?.map((it: any) => (
                            <div key={it.id || it.dish_name} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between">
                              <span className="font-bold text-brand-charcoal">
                                {it.quantity}x {it.dish_name}
                              </span>
                              <span className="font-mono text-brand-muted text-[11px]">
                                ₹{it.total_price}
                              </span>
                            </div>
                          ))}
                        </div>
                        {ord.cooking_instructions && (
                          <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                            <strong>Chef Note:</strong> {ord.cooking_instructions}
                          </p>
                        )}
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-brand-border/60">
                        <div className="text-xs text-brand-muted">
                          Payment: <strong className="text-brand-charcoal">{ord.payment_status} ({ord.payment_method})</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.status === "PLACED" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.order_number, "CONFIRMED")}
                              disabled={updatingOrderId === ord.order_number}
                              className="px-3.5 py-1.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors"
                            >
                              Accept Order
                            </button>
                          )}
                          {(ord.status === "CONFIRMED" || ord.status === "PLACED") && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.order_number, "PREPARING")}
                              disabled={updatingOrderId === ord.order_number}
                              className="px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-colors"
                            >
                              Start Cooking
                            </button>
                          )}
                          {ord.status === "PREPARING" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.order_number, "OUT_FOR_DELIVERY")}
                              disabled={updatingOrderId === ord.order_number}
                              className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-colors"
                            >
                              Hand to Delivery Rider
                            </button>
                          )}
                          {ord.status === "OUT_FOR_DELIVERY" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.order_number, "DELIVERED")}
                              disabled={updatingOrderId === ord.order_number}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
