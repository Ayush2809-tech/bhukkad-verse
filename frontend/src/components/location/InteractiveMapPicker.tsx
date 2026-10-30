"use client";

import React, { useEffect, useRef } from "react";
import type * as LeafletType from "leaflet";
import "leaflet/dist/leaflet.css";

interface InteractiveMapPickerProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  latitude,
  longitude,
  onCoordinatesChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically load leaflet on client only
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #E63946;
            color: white;
            box-shadow: 0 4px 12px rgba(230, 57, 70, 0.4);
            border: 2px solid white;
            transform: translate(-50%, -100%);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Initialize map instance if not existing
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 14,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onCoordinatesChange({
            lat: parseFloat(position.lat.toFixed(6)),
            lng: parseFloat(position.lng.toFixed(6)),
          });
        });

        map.on("click", (e: LeafletType.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          onCoordinatesChange({
            lat: parseFloat(e.latlng.lat.toFixed(6)),
            lng: parseFloat(e.latlng.lng.toFixed(6)),
          });
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      } else {
        const currentPos = markerRef.current?.getLatLng();
        if (
          !currentPos ||
          Math.abs(currentPos.lat - latitude) > 0.0001 ||
          Math.abs(currentPos.lng - longitude) > 0.0001
        ) {
          mapInstanceRef.current.setView([latitude, longitude], 14);
          markerRef.current?.setLatLng([latitude, longitude]);
        }
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Run on mount

  // Watch for coordinate prop changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        mapInstanceRef.current.setView([latitude, longitude], 14);
        markerRef.current.setLatLng([latitude, longitude]);
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-brand-border z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 z-1000 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-brand-border text-[10px] font-bold text-brand-charcoal shadow-xs pointer-events-none">
        Drag pin or tap map to adjust location
      </div>
    </div>
  );
};
