"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  role_display: string;
  phone: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  bio: string | null;
  date_joined: string;
  has_shop?: boolean;
  shop_status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null;
  shop_slug?: string | null;
  shop_id?: string | null;
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  role?: "CUSTOMER" | "VENDOR" | "ADMIN";
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isCustomer: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  register: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  registerVendor: (data: Record<string, unknown>) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<UserProfile | null>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  loading: true,
  isCustomer: false,
  isVendor: false,
  isAdmin: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  registerVendor: async () => ({ success: false }),
  logout: () => {},
  refreshProfile: async () => null,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

const TOKEN_KEY = "bhukkadverse_access_token";
const REFRESH_KEY = "bhukkadverse_refresh_token";

// Helper for tab-isolated session storage (prevents Admin/User session leaking across browser tabs)
const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

// Safe clear of any legacy cross-tab localStorage token leakage
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Ignore in non-browser environments
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (accessToken: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        return (await res.json()) as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  };

  const attemptTokenRefresh = async (
    refreshToken: string
  ): Promise<{ access: string; refresh?: string } | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        const storage = getSessionStorage();
        if (data.access && storage) {
          storage.setItem(TOKEN_KEY, data.access);
          if (data.refresh) {
            storage.setItem(REFRESH_KEY, data.refresh);
          }
          return data;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storage = getSessionStorage();
      const storedToken = storage?.getItem(TOKEN_KEY) || null;
      const storedRefresh = storage?.getItem(REFRESH_KEY) || null;

      if (storedToken) {
        let profile = await fetchProfile(storedToken);

        // If access token expired, try silent refresh
        if (!profile && storedRefresh) {
          const refreshed = await attemptTokenRefresh(storedRefresh);
          if (refreshed?.access) {
            profile = await fetchProfile(refreshed.access);
          }
        }

        if (isMounted) {
          if (profile) {
            setToken(storage?.getItem(TOKEN_KEY) || null);
            setUser(profile);
          } else {
            storage?.removeItem(TOKEN_KEY);
            storage?.removeItem(REFRESH_KEY);
            setToken(null);
            setUser(null);
          }
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          data.detail ||
          data.non_field_errors?.[0] ||
          "Invalid credentials. Please verify your username/email and password.";
        return { success: false, error: errorMsg };
      }

      const accessToken = data.access;
      const refreshToken = data.refresh;
      const storage = getSessionStorage();
      if (storage) {
        storage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) {
          storage.setItem(REFRESH_KEY, refreshToken);
        }
      }

      setToken(accessToken);
      setUser(data.user);

      return {
        success: true,
        user: data.user,
        role: data.user?.role,
      };
    } catch {
      return { success: false, error: "Network error connecting to authentication server." };
    }
  };

  const register = async (formData: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsgs: string[] = [];
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val)) {
            errorMsgs.push(`${key}: ${val.join(", ")}`);
          } else if (typeof val === "string") {
            errorMsgs.push(val);
          }
        }
        return { success: false, error: errorMsgs.join(" | ") || "Registration failed." };
      }

      const accessToken = data.tokens?.access;
      const refreshToken = data.tokens?.refresh;
      const storage = getSessionStorage();
      if (accessToken && storage) {
        storage.setItem(TOKEN_KEY, accessToken);
        setToken(accessToken);
      }
      if (refreshToken && storage) {
        storage.setItem(REFRESH_KEY, refreshToken);
      }
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Network error connecting to registration server." };
    }
  };

  const registerVendor = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/vendor-register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        const errorMsgs: string[] = [];
        for (const [key, val] of Object.entries(resData)) {
          if (Array.isArray(val)) {
            errorMsgs.push(`${key}: ${val.join(", ")}`);
          } else if (typeof val === "string") {
            errorMsgs.push(val);
          }
        }
        return {
          success: false,
          error: errorMsgs.join(" | ") || "Vendor registration failed. Please review the details.",
        };
      }

      const accessToken = resData.tokens?.access;
      const refreshToken = resData.tokens?.refresh;
      const storage = getSessionStorage();
      if (accessToken && storage) {
        storage.setItem(TOKEN_KEY, accessToken);
        setToken(accessToken);
      }
      if (refreshToken && storage) {
        storage.setItem(REFRESH_KEY, refreshToken);
      }
      setUser(resData.user);
      return { success: true, user: resData.user };
    } catch {
      return { success: false, error: "Network error submitting vendor registration." };
    }
  };

  const logout = () => {
    const storage = getSessionStorage();
    const refreshToken = storage?.getItem(REFRESH_KEY) || null;
    if (token) {
      fetch(`${API_BASE_URL}/v1/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }).catch(() => {});
    }
    if (storage) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(REFRESH_KEY);
    }
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (token) {
      const profile = await fetchProfile(token);
      if (profile) {
        setUser(profile);
        return profile;
      }
    }
    return null;
  };

  const isCustomer = user?.role === "CUSTOMER";
  const isVendor = user?.role === "VENDOR";
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isCustomer,
        isVendor,
        isAdmin,
        login,
        register,
        registerVendor,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
