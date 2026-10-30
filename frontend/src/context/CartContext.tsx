"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string; // unique key combining dishId and variantId
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  dietaryType: "VEG" | "NON_VEG" | "VEGAN";
  categoryName?: string;
  variantId?: string;
  variantName?: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: {
    dishId: string;
    name: string;
    price: number | string;
    dietaryType: "VEG" | "NON_VEG" | "VEGAN";
    categoryName?: string;
    variantId?: string;
    variantName?: string;
    shopId: string;
    shopName: string;
    shopSlug: string;
    imageUrl?: string;
  }) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  platformFee: number;
  grandTotal: number;
  freeDeliveryThreshold: number;
  isFreeDeliveryUnlocked: boolean;
  shopInfo: { id: string; name: string; slug: string } | null;
}

const STORAGE_KEY = "bhukkadverse_cart_v2";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore cart on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore storage errors
      }
    }
  }, [items, isInitialized]);

  const addItem = useCallback(
    (newItem: {
      dishId: string;
      name: string;
      price: number | string;
      dietaryType: "VEG" | "NON_VEG" | "VEGAN";
      categoryName?: string;
      variantId?: string;
      variantName?: string;
      shopId: string;
      shopName: string;
      shopSlug: string;
      imageUrl?: string;
    }) => {
      const priceNum = typeof newItem.price === "string" ? parseFloat(newItem.price) : newItem.price;
      const itemId = newItem.variantId
        ? `${newItem.dishId}_${newItem.variantId}`
        : `${newItem.dishId}_base`;

      setItems((prev) => {
        // Multi-restaurant conflict check: If adding from a different shop, prompt or reset
        const existingShopId = prev.length > 0 ? prev[0].shopId : null;
        if (existingShopId && existingShopId !== newItem.shopId) {
          const proceed = window.confirm(
            `Your cart already contains delicious food from "${prev[0].shopName}". Starting a new order from "${newItem.shopName}" will reset your previous cart. Continue?`
          );
          if (!proceed) return prev;
          return [
            {
              id: itemId,
              dishId: newItem.dishId,
              name: newItem.name,
              price: isNaN(priceNum) ? 0 : priceNum,
              quantity: 1,
              dietaryType: newItem.dietaryType,
              categoryName: newItem.categoryName,
              variantId: newItem.variantId,
              variantName: newItem.variantName,
              shopId: newItem.shopId,
              shopName: newItem.shopName,
              shopSlug: newItem.shopSlug,
              imageUrl: newItem.imageUrl,
            },
          ];
        }

        const existingIndex = prev.findIndex((i) => i.id === itemId);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        }

        return [
          ...prev,
          {
            id: itemId,
            dishId: newItem.dishId,
            name: newItem.name,
            price: isNaN(priceNum) ? 0 : priceNum,
            quantity: 1,
            dietaryType: newItem.dietaryType,
            categoryName: newItem.categoryName,
            variantId: newItem.variantId,
            variantName: newItem.variantName,
            shopId: newItem.shopId,
            shopName: newItem.shopName,
            shopSlug: newItem.shopSlug,
            imageUrl: newItem.imageUrl,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const FREE_DELIVERY_THRESHOLD = 99;
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeDeliveryUnlocked = subtotal >= FREE_DELIVERY_THRESHOLD;
  const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% GST
  const deliveryFee = subtotal > 0 ? (isFreeDeliveryUnlocked ? 0 : 25) : 0;
  const platformFee = subtotal > 0 ? 5 : 0;
  const grandTotal = parseFloat((subtotal + tax + deliveryFee + platformFee).toFixed(2));

  const shopInfo =
    items.length > 0
      ? {
          id: items[0].shopId,
          name: items[0].shopName,
          slug: items[0].shopSlug,
        }
      : null;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        tax,
        deliveryFee,
        platformFee,
        grandTotal,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        isFreeDeliveryUnlocked,
        shopInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

