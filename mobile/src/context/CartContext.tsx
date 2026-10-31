import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Product, ProductVariant, AddonOption } from '../api/types';
import { APP_CONFIG } from '../constants/config';

export interface CartItem {
  id: string; // unique item composite key
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  selectedAddons?: AddonOption[];
  itemPrice: number; // base + variant + addons
}

interface CartContextType {
  items: CartItem[];
  shopId: string | null;
  shopName: string | null;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  gstAmount: number;
  totalAmount: number;
  itemCount: number;
  addItem: (
    product: Product,
    variant?: ProductVariant,
    addons?: AddonOption[]
  ) => boolean; // returns false if different vendor
  updateQuantity: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = '@bhukkad_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedCart = async () => {
      try {
        const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setItems(parsed.items || []);
          setShopId(parsed.shopId || null);
          setShopName(parsed.shopName || null);
        }
      } catch {
        // Failed to load
      }
    };
    loadSavedCart();
  }, []);

  const saveCart = async (newItems: CartItem[], newShopId: string | null, newShopName: string | null) => {
    try {
      await AsyncStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ items: newItems, shopId: newShopId, shopName: newShopName })
      );
    } catch {
      // ignore
    }
  };

  const calculateUnitCost = (
    product: Product,
    variant?: ProductVariant,
    addons?: AddonOption[]
  ): number => {
    let cost = product.discounted_price || product.base_price;
    if (variant) {
      cost += variant.price_adjustment;
    }
    if (addons && addons.length > 0) {
      cost += addons.reduce((sum, a) => sum + a.price, 0);
    }
    return cost;
  };

  const addItem = (
    product: Product,
    variant?: ProductVariant,
    addons?: AddonOption[]
  ): boolean => {
    // Single-vendor cart enforcement
    if (shopId && shopId !== product.shop_id && items.length > 0) {
      return false; // Denied: conflict with active vendor
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }

    const unitCost = calculateUnitCost(product, variant, addons);
    const compositeKey = `${product.id}_${variant?.id || 'base'}_${(addons || []).map((a) => a.id).sort().join('-')}`;

    const existingIdx = items.findIndex((it) => it.id === compositeKey);
    let nextItems: CartItem[];

    if (existingIdx > -1) {
      nextItems = [...items];
      nextItems[existingIdx].quantity += 1;
    } else {
      const newItem: CartItem = {
        id: compositeKey,
        product,
        quantity: 1,
        selectedVariant: variant,
        selectedAddons: addons,
        itemPrice: unitCost,
      };
      nextItems = [...items, newItem];
    }

    const newShopId = product.shop_id;
    const newShopName = product.shop_name;

    setItems(nextItems);
    setShopId(newShopId);
    setShopName(newShopName);
    saveCart(nextItems, newShopId, newShopName);
    return true;
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const existing = items.find((i) => i.id === itemId);
    if (!existing) return;

    try {
      Haptics.selectionAsync();
    } catch {
      // ignore
    }

    let nextItems: CartItem[];
    if (existing.quantity + delta <= 0) {
      nextItems = items.filter((i) => i.id !== itemId);
    } else {
      nextItems = items.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity + delta } : i
      );
    }

    const nextShopId = nextItems.length === 0 ? null : shopId;
    const nextShopName = nextItems.length === 0 ? null : shopName;

    setItems(nextItems);
    setShopId(nextShopId);
    setShopName(nextShopName);
    saveCart(nextItems, nextShopId, nextShopName);
  };

  const removeItem = (itemId: string) => {
    updateQuantity(itemId, -9999);
  };

  const clearCart = () => {
    setItems([]);
    setShopId(null);
    setShopName(null);
    saveCart([], null, null);
  };

  // Inviolable 4-way economics math
  const subtotal = items.reduce((sum, item) => sum + item.itemPrice * item.quantity, 0);
  const deliveryFee =
    items.length === 0
      ? 0
      : subtotal >= APP_CONFIG.FREE_DELIVERY_THRESHOLD
      ? 0
      : APP_CONFIG.STANDARD_DELIVERY_FEE;
  const platformFee = items.length === 0 ? 0 : APP_CONFIG.PLATFORM_FEE;
  const gstAmount = parseFloat((subtotal * APP_CONFIG.GST_RATE).toFixed(2));
  const totalAmount = parseFloat((subtotal + deliveryFee + platformFee + gstAmount).toFixed(2));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        shopId,
        shopName,
        subtotal,
        deliveryFee,
        platformFee,
        gstAmount,
        totalAmount,
        itemCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
