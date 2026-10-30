export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export const BACKEND_ROOT_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

export interface BackendHealthResponse {
  status: "healthy" | "unhealthy";
  brand: string;
  tagline: string;
  timestamp: string;
  database: {
    connected: boolean;
    engine: string;
    error: string | null;
  };
  version: string;
}

export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    // If it's a media path from backend e.g. /media/...
    if (path.startsWith("/media/")) {
      return `${BACKEND_ROOT_URL}${path}`;
    }
    return path;
  }
  return `${BACKEND_ROOT_URL}/media/${path}`;
}
