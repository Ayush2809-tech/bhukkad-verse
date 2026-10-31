import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationContextType {
  location: UserLocation;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
  calculateDistance: (lat: number, lon: number) => number;
  isShopServiceable: (lat: number, lon: number, radiusKm: number) => boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Default coordinates: Connaught Place, New Delhi (hyperlocal test benchmark)
const DEFAULT_LOCATION: UserLocation = {
  latitude: 28.6315,
  longitude: 77.2167,
  address: 'Connaught Place, Central Delhi, 110001',
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(false);

  const refreshLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        let readable = 'Current Location';
        if (reverseGeocode.length > 0) {
          const item = reverseGeocode[0];
          readable = [item.name, item.street, item.city, item.postalCode].filter(Boolean).join(', ') || readable;
        }

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address: readable,
        });
      }
    } catch {
      // Keep default location if permission denied or offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  // Server-authoritative Haversine formula mirror
  const calculateDistance = (shopLat: number, shopLon: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((shopLat - location.latitude) * Math.PI) / 180;
    const dLon = ((shopLon - location.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((location.latitude * Math.PI) / 180) *
        Math.cos((shopLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const isShopServiceable = (shopLat: number, shopLon: number, radiusKm: number): boolean => {
    const dist = calculateDistance(shopLat, shopLon);
    return dist <= radiusKm;
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        refreshLocation,
        calculateDistance,
        isShopServiceable,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
