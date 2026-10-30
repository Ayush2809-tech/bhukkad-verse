"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { API_BASE_URL } from "@/lib/api";
import {
  User,
  MapPin,
  Home,
  Briefcase,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Store,
  ShieldCheck,
  LogOut,
  Edit3,
  Phone,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();
  const {
    savedAddresses,
    loadingSavedAddresses,
    refreshSavedAddresses,
    selectSavedAddress,
    openLocationModal,
    activeLocation,
  } = useLocation();

  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "account">("profile");

  // Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Address Actions State
  const [addressActionId, setAddressActionId] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync user details to form
  useEffect(() => {
    queueMicrotask(() => {
      if (user) {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setPhone(user.phone || "");
      }
    });
  }, [user]);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-xs font-bold text-brand-muted">Loading your account profile...</p>
      </div>
    );
  }

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        }),
      });

      if (res.ok) {
        setProfileSuccess("Profile details updated successfully!");
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        const data = await res.json();
        setProfileError(data.phone?.[0] || data.detail || "Failed to update profile.");
      }
    } catch {
      setProfileError("Network error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Set Address as Default
  const handleSetDefaultAddress = async (addrId: string) => {
    setAddressActionId(addrId);
    setAddressMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/customer/addresses/${addrId}/set-default/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setAddressMessage({ type: "success", text: "Default delivery address updated." });
        await refreshSavedAddresses();
      } else {
        setAddressMessage({ type: "error", text: "Could not set address as default." });
      }
    } catch {
      setAddressMessage({ type: "error", text: "Network error setting default address." });
    } finally {
      setAddressActionId(null);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addrId: string) => {
    if (!confirm("Are you sure you want to remove this saved address?")) return;

    setAddressActionId(addrId);
    setAddressMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/customer/addresses/${addrId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok || res.status === 204) {
        setAddressMessage({ type: "success", text: "Address removed successfully." });
        await refreshSavedAddresses();
      } else {
        setAddressMessage({ type: "error", text: "Could not delete address." });
      }
    } catch {
      setAddressMessage({ type: "error", text: "Network error deleting address." });
    } finally {
      setAddressActionId(null);
    }
  };

  const getAddressIcon = (label: string) => {
    switch (label) {
      case "HOME":
        return <Home className="w-4 h-4 text-brand-orange" />;
      case "WORK":
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      default:
        return <MapPin className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Header Banner */}
        <div className="bg-white rounded-3xl border border-brand-border/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-brand-charcoal to-zinc-700 text-white flex items-center justify-center text-3xl font-black shadow-md border-2 border-white">
              {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-brand-charcoal">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.username}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-brand-muted font-medium flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>{user.email}</span>
                {user.phone && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-zinc-400">
                BHUKKAD VERSE Account • Active Session
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {user.role === "VENDOR" && (
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-2xs"
              >
                <Store className="w-4 h-4" />
                <span>Vendor Dashboard</span>
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Portal</span>
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-tomato hover:border-brand-tomato/40 text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-brand-border pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-brand-charcoal text-white shadow-xs"
                : "text-brand-muted hover:text-brand-charcoal hover:bg-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "addresses"
                ? "bg-brand-charcoal text-white shadow-xs"
                : "text-brand-muted hover:text-brand-charcoal hover:bg-white"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Delivery Addresses ({savedAddresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "account"
                ? "bg-brand-charcoal text-white shadow-xs"
                : "text-brand-muted hover:text-brand-charcoal hover:bg-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Account Security</span>
          </button>
        </div>

        {/* TAB 1: Profile Details Form */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-brand-border/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-black text-brand-charcoal">Personal Information</h2>
              <p className="text-xs text-brand-muted">
                Update your contact details for smooth food deliveries and receipts.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-charcoal">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none font-medium text-brand-charcoal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-brand-charcoal">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none font-medium text-brand-charcoal"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-charcoal">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border/60 bg-brand-surface text-brand-muted cursor-not-allowed font-medium"
                />
                <p className="text-[10px] text-brand-muted">
                  Account email address cannot be modified directly.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-charcoal">Contact Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none font-medium text-brand-charcoal"
                />
                <p className="text-[10px] text-brand-muted">
                  Used by delivery drivers to contact you when arriving at your address.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Saved Delivery Addresses */}
        {activeTab === "addresses" && (
          <div className="bg-white rounded-3xl border border-brand-border/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-brand-charcoal">Saved Delivery Addresses</h2>
                <p className="text-xs text-brand-muted">
                  Manage your home, office, and preferred addresses for lightning-fast checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={openLocationModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {addressMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  addressMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {addressMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{addressMessage.text}</span>
              </div>
            )}

            {loadingSavedAddresses ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs font-bold text-brand-muted">
                <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
                <span>Fetching your saved delivery addresses...</span>
              </div>
            ) : savedAddresses.length === 0 ? (
              <div className="py-12 px-4 rounded-3xl border border-dashed border-brand-border text-center space-y-3 bg-brand-surface/30">
                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-charcoal">No Saved Addresses Yet</h3>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto mt-0.5">
                    Save your home or work address once, and order in one tap whenever hunger strikes!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => {
                  const isCurrentlyActive =
                    activeLocation.isSavedAddress && activeLocation.savedAddressId === addr.id;

                  return (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-3xl border transition-all space-y-3 flex flex-col justify-between ${
                        isCurrentlyActive
                          ? "border-brand-orange bg-brand-orange/5 ring-1 ring-brand-orange"
                          : "border-brand-border bg-white hover:border-brand-border/90"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-white border border-brand-border shadow-2xs">
                              {getAddressIcon(addr.label)}
                            </span>
                            <span className="text-xs font-black text-brand-charcoal uppercase">
                              {addr.label_display || addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-brand-orange border border-amber-200 flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-brand-amber text-brand-amber" />
                                <span>Default</span>
                              </span>
                            )}
                          </div>

                          {isCurrentlyActive && (
                            <span className="text-[10px] font-black text-brand-orange uppercase bg-white px-2 py-0.5 rounded-full border border-brand-orange/30">
                              Active
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-brand-charcoal">
                            {addr.recipient_name}{" "}
                            <span className="text-brand-muted font-normal">• {addr.recipient_phone}</span>
                          </p>
                          <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                            {addr.address_line1}
                            {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                            {addr.landmark ? ` (Landmark: ${addr.landmark})` : ""}
                            <br />
                            {addr.city} {addr.postal_code ? `- ${addr.postal_code}` : ""}
                          </p>
                          {addr.delivery_instructions && (
                            <p className="text-[11px] text-zinc-500 italic mt-1 bg-brand-surface/60 p-2 rounded-xl border border-brand-border/60">
                              Note: {addr.delivery_instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Address Card Actions */}
                      <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => selectSavedAddress(addr)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-brand-charcoal hover:bg-brand-orange text-white transition-colors cursor-pointer"
                          >
                            Deliver Here
                          </button>

                          {!addr.is_default && (
                            <button
                              type="button"
                              disabled={addressActionId === addr.id}
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-brand-charcoal hover:bg-brand-surface border border-brand-border transition-colors cursor-pointer"
                            >
                              Make Default
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={addressActionId === addr.id}
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 rounded-xl text-brand-muted hover:text-brand-tomato hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Account Security */}
        {activeTab === "account" && (
          <div className="bg-white rounded-3xl border border-brand-border/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-black text-brand-charcoal">Account Security & Access</h2>
              <p className="text-xs text-brand-muted">
                Review your role permissions, connected session, and security controls.
              </p>
            </div>

            <div className="divide-y divide-brand-border border border-brand-border rounded-2xl overflow-hidden bg-brand-surface/30">
              <div className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-brand-charcoal block">Registered Username</span>
                  <span className="text-brand-muted">{user.username}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500 bg-white px-2 py-1 rounded-lg border border-brand-border">
                  ID: {user.id ? String(user.id).slice(0, 8) : "N/A"}...
                </span>
              </div>

              <div className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-brand-charcoal block">Assigned Platform Role</span>
                  <span className="text-brand-muted">Determines access privileges and dashboard features</span>
                </div>
                <span className="font-black text-xs uppercase px-2.5 py-1 rounded-full bg-brand-charcoal text-white">
                  {user.role}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-brand-charcoal block">Account Status</span>
                  <span className="text-brand-muted">Active and authorized to place orders</span>
                </div>
                <span className="font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified & Active
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/shops"
                className="text-xs font-bold text-brand-orange hover:text-brand-tomato flex items-center gap-1"
              >
                <span>Back to Food Discovery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of All Devices</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

