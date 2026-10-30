"use client";

import React, { useEffect, useState } from "react";
import { checkBackendHealth, BackendHealthResponse } from "@/lib/api";

export const BackendStatusBar: React.FC = () => {
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((res) => {
      if (isMounted) {
        setHealth(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isHealthy = health?.status === "healthy";

  return (
    <section className="bg-white border-b border-brand-border py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-medium text-brand-charcoal">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              loading
                ? "bg-amber-400 animate-pulse"
                : isHealthy
                ? "bg-emerald-500 animate-pulse"
                : "bg-gray-400"
            }`}
          />
          <span>
            Backend API:{" "}
            <strong className="font-bold">
              {loading
                ? "Connecting to Django 5 service..."
                : isHealthy
                ? "Connected & Live (Django REST Framework)"
                : "Local Mock / Standby Mode"}
            </strong>
          </span>
        </div>
        <div className="text-brand-muted">
          Database Engine:{" "}
          <span className="font-mono text-brand-charcoal font-semibold">
            {health?.database?.engine || "SQLite / PostgreSQL Ready"}
          </span>
        </div>
      </div>
    </section>
  );
};
