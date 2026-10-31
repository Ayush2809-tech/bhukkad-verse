export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'RIDER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: UserRole;
  shop_id?: string;
}

export type CulinaryTier = 'STREET_FOOD' | 'HERITAGE_LUXURY' | 'CLOUD_KITCHEN';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  tier: CulinaryTier;
  tagline?: string;
  description?: string;
  address_line1?: string;
  city?: string;
  latitude: number;
  longitude: number;
  delivery_radius_km: number;
  rating: number;
  banner_image?: string;
  is_active: boolean;
  distance_km?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price_adjustment: number;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface AddonGroup {
  id: string;
  title: string;
  is_required: boolean;
  max_selectable: number;
  options: AddonOption[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  discounted_price?: number;
  is_vegetarian: boolean;
  spice_level?: 'MILD' | 'MEDIUM' | 'EXTRA_SPICY';
  is_available: boolean;
  image?: string;
  shop_id: string;
  shop_name: string;
  category_name?: string;
  variants?: ProductVariant[];
  addon_groups?: AddonGroup[];
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'ONLINE';

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  variant_name?: string;
  selected_addons?: string[];
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shop_name: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address: string;
  items: OrderItem[];
  created_at: string;
  estimated_delivery_minutes?: number;
  rider_name?: string;
  rider_phone?: string;
}

export interface RiderWalletSummary {
  current_cash_in_hand: number;
  virtual_float_locked: boolean;
  max_float_limit: number;
  today_completed_orders: number;
  today_earnings: number;
  total_wages_earned: number;
}
