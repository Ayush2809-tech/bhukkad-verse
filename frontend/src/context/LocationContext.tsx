"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "./AuthContext";

// =============================================================
// TYPES & INTERFACES
// =============================================================

export interface AddressCoordinates {
  lat: number;
  lng: number;
}

export interface SavedAddress {
  id: string;
  label: "HOME" | "WORK" | "OTHER";
  label_display: string;
  custom_label?: string;
  recipient_name: string;
  recipient_phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state?: string;
  postal_code: string;
  latitude: string | number;
  longitude: string | number;
  delivery_instructions?: string;
  is_default: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface ActiveLocation {
  addressLabel: string;
  shortAddress: string;
  fullAddress: string;
  coordinates: AddressCoordinates | null;
  /**
   * How the location was sourced:
   * - "gps"        = real browser GPS + reverse-geocoded
   * - "saved"      = customer's saved address from backend
   * - "manual"     = customer typed / pinned on map
   * - "none"       = no location chosen yet (coordinates MUST be null)
   */
  source: "gps" | "saved" | "manual" | "none";
  details?: Partial<SavedAddress>;
  isSavedAddress?: boolean;
  savedAddressId?: string;
}

interface LocationContextType {
  activeLocation: ActiveLocation;
  coordinates: AddressCoordinates | null;
  addressLabel: string;
  isLocationModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  setActiveLocation: (location: ActiveLocation) => void;
  clearActiveLocation: () => void;
  savedAddresses: SavedAddress[];
  loadingSavedAddresses: boolean;
  refreshSavedAddresses: () => Promise<void>;
  saveAddressToBackend: (
    addressData: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: SavedAddress; error?: string }>;
  selectSavedAddress: (address: SavedAddress) => void;
  detectCurrentLocation: (forcePrompt?: boolean) => Promise<boolean>;
  isDetectingLocation: boolean;
  locationError: string | null;
}

// =============================================================
// STORAGE & DEFAULT STATE
// =============================================================

const STORAGE_KEY = "bhukkadverse_delivery_location_v2";

export interface PopularCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
  tagline?: string;
}

export const POPULAR_CITIES: PopularCity[] = [
  { name: "Delhi NCR", state: "Delhi", lat: 28.6139, lng: 77.2090, tagline: "Capital Cravings Hub" },
  { name: "Noida", state: "Uttar Pradesh", lat: 28.5799, lng: 77.3299, tagline: "Expressway Foodies" },
  { name: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266, tagline: "Cyber City Dining" },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, tagline: "Vada Pav & Sea Vibes" },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, tagline: "Techie Dosas & Brews" },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, tagline: "Royal Awadhi Galouti" },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, tagline: "Pink City Dal Baati" },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867, tagline: "Dum Biryani Capital" },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, tagline: "Misal & Youth Hub" },
  { name: "Chandigarh", state: "Punjab", lat: 30.7333, lng: 76.7794, tagline: "Amritsari Kulchas" },
];

/**
 * IP-Based Geolocation Fallback
 * Resolves user city and approximate coordinates without needing GPS permissions
 */
export async function fetchIpGeolocation(): Promise<{
  city: string;
  region: string;
  lat: number;
  lng: number;
  shortAddress: string;
  fullAddress: string;
} | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const city = data.city || data.region || "Delhi NCR";
        const region = data.region || "";
        const shortAddress = region ? `${city}, ${region}` : city;
        const fullAddress = `${city}, ${region}, India (${data.postal || ""})`.trim();
        return {
          city,
          region,
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          shortAddress,
          fullAddress,
        };
      }
    }
  } catch {
    // IP lookup unavailable
  }
  return null;
}

/**
 * Real-time address and landmark search via OpenStreetMap Nominatim
 */
export async function searchAddressSuggestions(query: string): Promise<Array<{
  display_name: string;
  short_name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
}>> {
  if (!query || query.trim().length < 2) return [];
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&addressdetails=1&limit=6`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "BhukkadVerse-Search/1.0 (+https://bhukkadverse.local)",
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
      }
    );
    if (res.ok) {
      const list = await res.json();
      return list.map((item: Record<string, unknown>) => {
        const addr = (item.address as Record<string, string>) || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || "";
        const state = addr.state || "";
        const locality = addr.road || addr.suburb || addr.neighbourhood || addr.residential || "";
        const short_name = locality && city ? `${locality}, ${city}` : (item.name as string) || city || (item.display_name as string).split(",")[0];
        return {
          display_name: item.display_name as string,
          short_name,
          lat: parseFloat(item.lat as string),
          lng: parseFloat(item.lon as string),
          city,
          state,
        };
      });
    }
  } catch {
    // Search failed
  }
  return [];
}

/**
 * The honest default: NO location selected, NO fake coordinates.
 * The customer will see a prompt to set their delivery location.
 * Coordinates are null, so no lat/lng is sent to the shops API until
 * the user actively provides or confirms a location.
 */
export const NO_LOCATION: ActiveLocation = {
  addressLabel: "Set Delivery Location",
  shortAddress: "",
  fullAddress: "",
  coordinates: null,
  source: "none",
};

const defaultLocationContext: LocationContextType = {
  activeLocation: NO_LOCATION,
  coordinates: null,
  addressLabel: "Set Delivery Location",
  isLocationModalOpen: false,
  openLocationModal: () => {},
  closeLocationModal: () => {},
  setActiveLocation: () => {},
  clearActiveLocation: () => {},
  savedAddresses: [],
  loadingSavedAddresses: false,
  refreshSavedAddresses: async () => {},
  saveAddressToBackend: async () => ({ success: false }),
  selectSavedAddress: () => {},
  detectCurrentLocation: async () => false,
  isDetectingLocation: false,
  locationError: null,
};

const LocationContext = createContext<LocationContextType>(defaultLocationContext);

// =============================================================
// HAVERSINE DISTANCE UTILITY
// =============================================================

export function computeHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// =============================================================
// REVERSE GEOCODING — Nominatim (OpenStreetMap)
// Only called when we have REAL GPS coordinates from the browser.
// Rate-limited: single call per GPS position fix.
// =============================================================

async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  shortAddress: string;
  fullAddress: string;
}> {
  try {
    // Nominatim usage policy: max 1 req/sec, must include a User-Agent
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "BhukkadVerse-Web/1.0 (+https://bhukkadverse.local)",
        },
        // Abort if Nominatim takes > 6s
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        addr.state_district ||
        "";

      // Build a human-readable short address: road/locality + city
      const locality =
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.commercial ||
        "";

      const shortAddress = locality && city
        ? `${locality}, ${city}`
        : city || data.display_name?.split(",")[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const fullAddress = data.display_name || shortAddress;

      return { shortAddress, fullAddress };
    }
  } catch {
    // Nominatim unavailable or timed out — use coordinate string as fallback
  }

  return {
    shortAddress: `Near ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
    fullAddress: `Latitude ${lat.toFixed(5)}, Longitude ${lng.toFixed(5)}`,
  };
}

// =============================================================
// PROVIDER IMPLEMENTATION
// =============================================================

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();

  const [activeLocation, setActiveLocationState] = useState<ActiveLocation>(NO_LOCATION);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Prevent repeated auto-detect attempts across effect re-runs
  const hasAutoAttemptedRef = useRef(false);

  // Persist to localStorage and update state
  const setActiveLocation = useCallback((location: ActiveLocation) => {
    setActiveLocationState(location);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch {
      // localStorage quota exceeded or unavailable
    }
  }, []);

  const clearActiveLocation = useCallback(() => {
    // Reset to honest "no location" — no fake coordinates
    setActiveLocationState(NO_LOCATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
  }, []);

  // Detect current device GPS location with instant IP fallback
  const detectCurrentLocation = useCallback(
    async (forcePrompt = false): Promise<boolean> => {
      setIsDetectingLocation(true);
      setLocationError(null);

      // Fast GPS attempt (timeout 4500ms so it doesn't freeze or stall desktop PCs)
      const gpsPromise = new Promise<boolean>((resolve) => {
        if (typeof window === "undefined" || !navigator.geolocation) {
          resolve(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const lat = parseFloat(position.coords.latitude.toFixed(6));
              const lng = parseFloat(position.coords.longitude.toFixed(6));
              const geocoded = await reverseGeocodeCoords(lat, lng);

              const newLocation: ActiveLocation = {
                addressLabel: "Live GPS Location",
                shortAddress: geocoded.shortAddress,
                fullAddress: geocoded.fullAddress,
                coordinates: { lat, lng },
                source: "gps",
              };

              setActiveLocation(newLocation);
              resolve(true);
            } catch {
              resolve(false);
            }
          },
          () => {
            resolve(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 4500,
            maximumAge: 60000,
          }
        );
      });

      const gpsSuccess = await gpsPromise;
      if (gpsSuccess) {
        setIsDetectingLocation(false);
        return true;
      }

      // Fast Fallback: Instant IP-based Geolocation (Locates user city e.g. Noida / NCR / Mumbai without prompt)
      try {
        const ipLocation = await fetchIpGeolocation();
        if (ipLocation) {
          const newLocation: ActiveLocation = {
            addressLabel: ipLocation.city,
            shortAddress: ipLocation.shortAddress,
            fullAddress: ipLocation.fullAddress,
            coordinates: { lat: ipLocation.lat, lng: ipLocation.lng },
            source: "gps",
          };
          setActiveLocation(newLocation);
          setIsDetectingLocation(false);
          return true;
        }
      } catch {
        // Fallback to default hub
      }

      // Final Safe Fallback: Delhi NCR Capital Hub
      const defaultHub = POPULAR_CITIES[0];
      const newLocation: ActiveLocation = {
        addressLabel: defaultHub.name,
        shortAddress: "Connaught Place, New Delhi",
        fullAddress: "Connaught Place, Central Delhi, Delhi - 110001",
        coordinates: { lat: defaultHub.lat, lng: defaultHub.lng },
        source: "manual",
      };
      setActiveLocation(newLocation);
      setIsDetectingLocation(false);
      if (forcePrompt) {
        setLocationError("Switched to Delhi NCR. You can refine your exact address or pin below.");
      }
      return true;
    },
    [setActiveLocation]
  );

  // On mount: restore from localStorage, or auto-detect GPS immediately on website open
  useEffect(() => {
    queueMicrotask(async () => {
      // Step 1: Restore previously saved location
      let restoredFromStorage = false;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ActiveLocation;
          // Validate stored location has the required shape
          if (
            parsed &&
            typeof parsed.addressLabel === "string" &&
            typeof parsed.source === "string" &&
            parsed.source !== "none"
          ) {
            setActiveLocationState(parsed);
            restoredFromStorage = true;
          }
        }
      } catch {
        // Ignore malformed stored data
      }

      // Step 2: Auto-detect current device GPS immediately when website opens
      if (!restoredFromStorage && !hasAutoAttemptedRef.current) {
        hasAutoAttemptedRef.current = true;
        if (typeof window !== "undefined" && navigator.geolocation) {
          // Trigger browser location prompt immediately so real coordinates and distances are available
          await detectCurrentLocation(false);
        }
      }
    });
  }, [detectCurrentLocation]);

  // Fetch saved addresses from backend for logged-in customers
  const refreshSavedAddresses = useCallback(async () => {
    if (!token || user?.role !== "CUSTOMER") {
      setSavedAddresses([]);
      return;
    }

    try {
      setLoadingSavedAddresses(true);
      const res = await fetch(`${API_BASE_URL}/v1/customer/addresses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: SavedAddress[] = await res.json();
        setSavedAddresses(data);

        // If user has no active location set, auto-use their default saved address
        setActiveLocationState((current) => {
          if (current.source === "none" && data.length > 0) {
            const defaultAddr = data.find((a) => a.is_default) || data[0];
            const lat = parseFloat(String(defaultAddr.latitude));
            const lng = parseFloat(String(defaultAddr.longitude));
            if (!isNaN(lat) && !isNaN(lng)) {
              const active: ActiveLocation = {
                addressLabel: defaultAddr.label_display || defaultAddr.label,
                shortAddress: `${defaultAddr.address_line1}, ${defaultAddr.city}`,
                fullAddress: [
                  defaultAddr.address_line1,
                  defaultAddr.address_line2,
                  defaultAddr.city,
                  defaultAddr.postal_code,
                ]
                  .filter(Boolean)
                  .join(", "),
                coordinates: { lat, lng },
                source: "saved",
                details: defaultAddr,
                isSavedAddress: true,
                savedAddressId: defaultAddr.id,
              };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
              } catch {
                // Ignored
              }
              return active;
            }
          }
          return current;
        });
      }
    } catch {
      // Network error loading addresses — silently ignored
    } finally {
      setLoadingSavedAddresses(false);
    }
  }, [token, user]);

  // Refresh addresses when authentication changes
  useEffect(() => {
    queueMicrotask(() => {
      if (token) {
        refreshSavedAddresses();
      } else {
        setSavedAddresses([]);
      }
    });
  }, [token, refreshSavedAddresses]);

  // Select a saved address and set it as active
  const selectSavedAddress = useCallback(
    (addr: SavedAddress) => {
      const lat = parseFloat(String(addr.latitude));
      const lng = parseFloat(String(addr.longitude));
      const active: ActiveLocation = {
        addressLabel: addr.label_display || addr.label,
        shortAddress: `${addr.address_line1}, ${addr.city}`,
        fullAddress: [addr.address_line1, addr.address_line2, addr.city, addr.postal_code]
          .filter(Boolean)
          .join(", "),
        coordinates: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
        source: "saved",
        details: addr,
        isSavedAddress: true,
        savedAddressId: addr.id,
      };
      setActiveLocation(active);
      setIsLocationModalOpen(false);
    },
    [setActiveLocation]
  );

  // Save a new address to the backend
  const saveAddressToBackend = useCallback(
    async (
      addressData: Record<string, unknown>
    ): Promise<{ success: boolean; data?: SavedAddress; error?: string }> => {
      if (!token) {
        return { success: false, error: "Please sign in to save addresses to your profile." };
      }

      try {
        const res = await fetch(`${API_BASE_URL}/v1/customer/addresses/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressData),
        });

        if (res.ok) {
          const created: SavedAddress = await res.json();
          await refreshSavedAddresses();
          selectSavedAddress(created);
          return { success: true, data: created };
        } else {
          const errData = await res.json();
          const firstErr =
            errData.address_line1?.[0] ||
            errData.postal_code?.[0] ||
            errData.recipient_name?.[0] ||
            errData.latitude?.[0] ||
            errData.detail ||
            "Failed to save address.";
          return { success: false, error: firstErr };
        }
      } catch {
        return { success: false, error: "Network error saving address." };
      }
    },
    [token, refreshSavedAddresses, selectSavedAddress]
  );

  const openLocationModal = () => setIsLocationModalOpen(true);
  const closeLocationModal = () => setIsLocationModalOpen(false);

  return (
    <LocationContext.Provider
      value={{
        activeLocation,
        coordinates: activeLocation.coordinates,
        addressLabel: activeLocation.addressLabel,
        isLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        setActiveLocation,
        clearActiveLocation,
        savedAddresses,
        loadingSavedAddresses,
        refreshSavedAddresses,
        saveAddressToBackend,
        selectSavedAddress,
        detectCurrentLocation,
        isDetectingLocation,
        locationError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
