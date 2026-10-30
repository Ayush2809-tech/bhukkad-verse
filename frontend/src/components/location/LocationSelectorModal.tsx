"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  MapPin,
  Crosshair,
  Home,
  Briefcase,
  Bookmark,
  Check,
  AlertCircle,
  Loader2,
  Navigation,
  Compass,
  Search,
  Building2,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useLocation, ActiveLocation, POPULAR_CITIES, searchAddressSuggestions } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

const InteractiveMapPicker = dynamic(
  () => import("./InteractiveMapPicker").then((mod) => mod.InteractiveMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 sm:h-64 rounded-2xl bg-brand-surface border border-brand-border flex flex-col items-center justify-center gap-2 text-xs font-bold text-brand-muted">
        <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />
        <span>Loading map interface...</span>
      </div>
    ),
  }
);


export const LocationSelectorModal: React.FC = () => {
  const {
    isLocationModalOpen,
    closeLocationModal,
    activeLocation,
    setActiveLocation,
    savedAddresses,
    loadingSavedAddresses,
    selectSavedAddress,
    saveAddressToBackend,
    detectCurrentLocation,
  } = useLocation();

  const { user } = useAuth();

  // Active sub-tab when user is logged in
  const [activeTab, setActiveTab] = useState<"map" | "saved">("map");

  // Coordinates state (Default to existing active coordinates or central New Delhi)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    if (activeLocation.coordinates) {
      return activeLocation.coordinates;
    }
    return { lat: 28.6139, lng: 77.209 };
  });

  // Real-time place & address search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    short_name: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Form Fields
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [state, setState] = useState("Delhi");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [recipientName, setRecipientName] = useState(
    user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : ""
  );
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || "");
  const [addressLabel, setAddressLabel] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [customLabel, setCustomLabel] = useState("");
  const [saveToAccount, setSaveToAccount] = useState(false);

  // Statuses
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Geocoding debounce ref
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync recipient name/phone when user updates
  useEffect(() => {
    queueMicrotask(() => {
      if (user?.first_name && !recipientName) {
        setRecipientName(`${user.first_name} ${user.last_name || ""}`.trim());
      }
      if (user?.phone && !recipientPhone) {
        setRecipientPhone(user.phone);
      }
    });
  }, [user, recipientName, recipientPhone]);

  // Sync existing active coordinates when modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      queueMicrotask(() => {
        if (activeLocation.coordinates) {
          setCoords(activeLocation.coordinates);
        }
        setGpsError(null);
        setSubmitError(null);

        // If user has saved addresses, show saved tab by default if authenticated
        if (user && savedAddresses.length > 0) {
          setActiveTab("saved");
        } else {
          setActiveTab("map");
        }
      });
    }
  }, [isLocationModalOpen, activeLocation.coordinates, user, savedAddresses.length]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLocationModalOpen) {
        closeLocationModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocationModalOpen, closeLocationModal]);

  // Reverse Geocoding helper with Nominatim
  const performReverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      setGeocodingLoading(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "BhukkadVerse-App/1.0 (delivery-location-selector)",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const extractedCity =
          addr.city || addr.town || addr.village || addr.suburb || addr.state_district || "New Delhi";
        const extractedState = addr.state || "Delhi";
        const extractedPin = addr.postcode || "";
        const extractedLine1 = [addr.house_number, addr.building, addr.road]
          .filter(Boolean)
          .join(", ") || data.name || "";
        const extractedLine2 = [addr.suburb, addr.neighbourhood, addr.residential]
          .filter(Boolean)
          .join(", ");

        if (extractedLine1 && !addressLine1) setAddressLine1(extractedLine1);
        if (extractedLine2 && !addressLine2) setAddressLine2(extractedLine2);
        if (extractedCity) setCity(extractedCity);
        if (extractedState) setState(extractedState);
        if (extractedPin) setPostalCode(extractedPin);
      }
    } catch {
      // Nominatim lookup failed or rate-limited; user can enter manually
    } finally {
      setGeocodingLoading(false);
    }
  }, [addressLine1, addressLine2]);

  // Handle coordinate updates from map pin drag / click
  const handleCoordinatesChange = useCallback(
    (newCoords: { lat: number; lng: number }) => {
      setCoords(newCoords);
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      geocodeTimeoutRef.current = setTimeout(() => {
        performReverseGeocode(newCoords.lat, newCoords.lng);
      }, 700);
    },
    [performReverseGeocode]
  );

  // Handle place/address search autocomplete
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchAddressSuggestions(q);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  };

  const handleSelectSearchResult = (result: {
    display_name: string;
    short_name: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
  }) => {
    const newCoords = { lat: result.lat, lng: result.lng };
    setCoords(newCoords);
    if (result.short_name) setAddressLine1(result.short_name);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    setSearchQuery(result.short_name);
    setSearchResults([]);
    performReverseGeocode(result.lat, result.lng);
  };

  const handleSelectPopularCity = (cityItem: typeof POPULAR_CITIES[0]) => {
    const newCoords = { lat: cityItem.lat, lng: cityItem.lng };
    setCoords(newCoords);
    setCity(cityItem.name);
    setState(cityItem.state);
    setAddressLine1(`Central, ${cityItem.name}`);
    performReverseGeocode(cityItem.lat, cityItem.lng);
  };

  // Handle "Use Current Location" GPS + IP fallback button
  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const success = await detectCurrentLocation(true);
      if (success) {
        // Re-read activeLocation from context
        const stored = localStorage.getItem("bhukkadverse_delivery_location_v2");
        if (stored) {
          const parsed = JSON.parse(stored) as ActiveLocation;
          if (parsed && parsed.coordinates) {
            setCoords(parsed.coordinates);
            if (parsed.shortAddress) {
              setAddressLine1(parsed.shortAddress);
            }
          }
        }
      } else {
        setGpsError("Unable to acquire precise GPS signal. You can pick your city below.");
      }
    } catch {
      setGpsError("Location detection failed. Please choose a city below or search.");
    } finally {
      setGpsLoading(false);
    }
  };

  // Submit manual address or confirmed coordinates
  const handleConfirmAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    const cleanLine1 = addressLine1.trim();
    const cleanCity = city.trim();
    const cleanPin = postalCode.trim();

    if (!cleanLine1) {
      setSubmitError("Please provide your House/Flat/Street details.");
      return;
    }

    if (!cleanCity) {
      setSubmitError("Please provide your city.");
      return;
    }

    const short = `${cleanLine1}, ${cleanCity}`;
    const full = [cleanLine1, addressLine2.trim(), landmark.trim(), `${cleanCity} - ${cleanPin}`]
      .filter(Boolean)
      .join(", ");

    const labelTitle =
      addressLabel === "OTHER" && customLabel.trim()
        ? customLabel.trim()
        : addressLabel === "HOME"
        ? "Home"
        : addressLabel === "WORK"
        ? "Work"
        : "Delivery Location";

    // If user is authenticated and wants to save address to backend
    if (user && saveToAccount) {
      try {
        setSubmitting(true);
        const payload = {
          label: addressLabel,
          custom_label: customLabel.trim() || undefined,
          recipient_name: recipientName.trim() || user.first_name || user.username,
          recipient_phone: recipientPhone.trim() || "9999999999",
          address_line1: cleanLine1,
          address_line2: addressLine2.trim() || undefined,
          landmark: landmark.trim() || undefined,
          city: cleanCity,
          state: state.trim() || undefined,
          postal_code: cleanPin || "110001",
          latitude: coords.lat,
          longitude: coords.lng,
          delivery_instructions: deliveryInstructions.trim() || undefined,
          is_default: true,
        };

        const result = await saveAddressToBackend(payload);
        if (!result.success) {
          setSubmitError(result.error || "Failed to save address to your account.");
          setSubmitting(false);
          return;
        }

        // Successfully saved and set via saveAddressToBackend
        closeLocationModal();
        return;
      } catch {
        setSubmitError("An unexpected error occurred while saving address.");
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    // Otherwise, set as active guest / session location (manually entered or map-pinned)
    const active: ActiveLocation = {
      addressLabel: labelTitle,
      shortAddress: short,
      fullAddress: full,
      coordinates: coords,
      source: "manual",
      details: {
        address_line1: cleanLine1,
        address_line2: addressLine2.trim() || undefined,
        city: cleanCity,
        state: state.trim() || undefined,
        postal_code: cleanPin,
        delivery_instructions: deliveryInstructions.trim() || undefined,
      },
    };

    setActiveLocation(active);
    closeLocationModal();
  };

  if (!isLocationModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-brand-charcoal/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 id="location-modal-title" className="text-base font-black text-brand-charcoal">
                Choose Delivery Location
              </h2>
              <p className="text-[11px] text-brand-muted">
                Find restaurants delivering directly to your exact doorstep.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLocationModal}
            className="p-1.5 rounded-full text-brand-muted hover:text-brand-charcoal hover:bg-brand-surface transition-colors"
            aria-label="Close location selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation for Logged-In Users */}
        {user && savedAddresses.length > 0 && (
          <div className="flex border-b border-brand-border px-6 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "saved"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-brand-muted hover:text-brand-charcoal"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Addresses ({savedAddresses.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("map")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "map"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-brand-muted hover:text-brand-charcoal"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Map & New Address</span>
            </button>
          </div>
        )}

        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {/* TAB 1: SAVED ADDRESSES */}
          {user && activeTab === "saved" && savedAddresses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                  Select a saved destination
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("map")}
                  className="text-xs font-bold text-brand-orange hover:underline"
                >
                  + Add / Pin New Address
                </button>
              </div>

              {loadingSavedAddresses ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs font-bold text-brand-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                  <span>Loading saved addresses...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = activeLocation.savedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => selectSavedAddress(addr)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 text-left ${
                          isSelected
                            ? "border-brand-orange bg-brand-orange/5 shadow-xs"
                            : "border-brand-border hover:border-brand-charcoal bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {addr.label === "HOME" ? (
                              <Home className="w-4 h-4 text-brand-orange" />
                            ) : addr.label === "WORK" ? (
                              <Briefcase className="w-4 h-4 text-brand-charcoal" />
                            ) : (
                              <Bookmark className="w-4 h-4 text-brand-muted" />
                            )}
                            <span className="text-xs font-black text-brand-charcoal">
                              {addr.label_display || addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="text-[9px] font-extrabold uppercase bg-brand-amber/20 text-brand-charcoal px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand-orange text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-brand-charcoal">
                            {addr.recipient_name} ({addr.recipient_phone})
                          </p>
                          <p className="text-xs text-brand-muted line-clamp-2 mt-0.5">
                            {addr.address_line1}, {addr.address_line2 || ""}, {addr.city} - {addr.postal_code}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="w-full text-center py-1.5 rounded-full bg-brand-surface text-brand-charcoal text-[11px] font-black hover:bg-brand-orange hover:text-white transition-colors"
                        >
                          Deliver Here
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GPS + INTERACTIVE MAP + MANUAL ENTRY */}
          {(!user || activeTab === "map" || savedAddresses.length === 0) && (
            <div className="space-y-6">
              {/* GPS Button & Permission Information */}
              <div className="p-4 rounded-2xl bg-brand-surface/70 border border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-brand-orange" />
                    <span className="text-xs font-black text-brand-charcoal">
                      Detect My Current Location
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted">
                    Click to request browser GPS coordinates and locate nearby kitchens.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gpsLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-brand-orange hover:bg-brand-tomato text-white text-xs font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Locating GPS...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Use Current Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* GPS / Geocoding Error Message */}
              {gpsError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Real-time Address & Area Search Bar */}
              <div className="relative space-y-1.5">
                <label className="block text-xs font-bold text-brand-charcoal">
                  Search Locality, Area or Landmark
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="e.g. Connaught Place, Sector 62 Noida, Bandra West, Indiranagar..."
                    className="w-full text-xs pl-10 pr-10 py-2.5 rounded-2xl border border-brand-border bg-white text-brand-charcoal placeholder:text-brand-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange shadow-xs"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 text-brand-orange animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  {searchQuery && !isSearching && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-charcoal text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-brand-border rounded-2xl shadow-xl overflow-hidden divide-y divide-brand-border/60 max-h-56 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.lat}-${item.lng}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left p-3 hover:bg-brand-surface/70 flex items-start gap-2.5 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="text-xs font-bold text-brand-charcoal truncate">
                            {item.short_name}
                          </p>
                          <p className="text-[10px] text-brand-muted line-clamp-1">
                            {item.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Indian Foodie Cities Quick Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-brand-muted tracking-wider block">
                  Quick Select Major Foodie Hubs
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((c) => {
                    const isSelected = city.toLowerCase().includes(c.name.toLowerCase());
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSelectPopularCity(c)}
                        className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border ${
                          isSelected
                            ? "bg-brand-charcoal text-white border-brand-charcoal shadow-xs scale-105"
                            : "bg-white text-brand-charcoal border-brand-border hover:border-brand-orange hover:bg-brand-orange/5"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Leaflet Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-charcoal">
                    Pin Location on Map
                  </span>
                  <div className="flex items-center gap-1.5 text-brand-muted text-[11px]">
                    {geocodingLoading ? (
                      <span className="flex items-center gap-1 text-brand-orange font-bold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
                      </span>
                    ) : (
                      <span>
                        Coords: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>

                <InteractiveMapPicker
                  latitude={coords.lat}
                  longitude={coords.lng}
                  onCoordinatesChange={handleCoordinatesChange}
                />
              </div>

              {/* Manual Address Form */}
              <form onSubmit={handleConfirmAddress} className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
                  <span className="text-xs font-black text-brand-charcoal uppercase tracking-wider">
                    Delivery Address Details
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Recipient Details for Orders */}
                {user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                      />
                    </div>
                  </div>
                )}

                {/* Address Line 1 */}
                <div>
                  <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                    House / Flat / Building / Floor <span className="text-brand-tomato">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Flat 402, Sunshine Apartments"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                  />
                </div>

                {/* Address Line 2 & Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                      Street / Sector / Area
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="e.g. Sector 18, Block B"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                      Nearby Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Metro Station Gate 2"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                    />
                  </div>
                </div>

                {/* City, State, Postal Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                      City <span className="text-brand-tomato">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 110001"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                    />
                  </div>
                </div>

                {/* Delivery Instructions */}
                <div>
                  <label className="block text-[11px] font-bold text-brand-charcoal mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Leave with security, call when outside"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                  />
                </div>

                {/* Address Label Choice (Home, Work, Other) */}
                <div>
                  <label className="block text-[11px] font-bold text-brand-charcoal mb-1.5">
                    Save As / Label
                  </label>
                  <div className="flex items-center gap-2">
                    {(["HOME", "WORK", "OTHER"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setAddressLabel(l)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                          addressLabel === l
                            ? "bg-brand-charcoal text-white shadow-xs"
                            : "bg-brand-surface text-brand-charcoal border border-brand-border hover:bg-brand-border/40"
                        }`}
                      >
                        {l === "HOME" ? (
                          <Home className="w-3 h-3" />
                        ) : l === "WORK" ? (
                          <Briefcase className="w-3 h-3" />
                        ) : (
                          <Bookmark className="w-3 h-3" />
                        )}
                        <span>{l === "HOME" ? "Home" : l === "WORK" ? "Work" : "Other"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {addressLabel === "OTHER" && (
                  <div>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Custom label (e.g. Friend's Place, Studio)"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-brand-charcoal"
                    />
                  </div>
                )}

                {/* Authenticated user option to persist in backend database */}
                {user && (
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-charcoal">
                      <input
                        type="checkbox"
                        checked={saveToAccount}
                        onChange={(e) => setSaveToAccount(e.target.checked)}
                        className="rounded text-brand-orange focus:ring-brand-orange"
                      />
                      <span>Save this address to my profile for future orders</span>
                    </label>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={closeLocationModal}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-brand-charcoal hover:bg-brand-surface transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-brand-charcoal hover:bg-brand-orange text-white text-xs font-black shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Confirm & Set Delivery Location</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
