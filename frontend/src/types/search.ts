export interface SearchDishItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  compare_at_price: string | null;
  image: string | null;
  image_url: string;
  dietary_type: "VEG" | "NON_VEG" | "VEGAN";
  preparation_time_minutes: number;
  is_available: boolean;
  has_variants: boolean;
  category_name: string;
  category_slug: string;
  variants?: Array<{
    id: string;
    name: string;
    price: string;
    is_default: boolean;
    is_available: boolean;
  }>;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_city: string;
  shop_address: string;
  shop_logo: string | null;
  is_shop_accepting_orders: boolean;
  distance_km?: number | null;
  is_deliverable?: boolean | null;
}

export interface SearchShopItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  banner: string | null;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  opening_time: string;
  closing_time: string;
  delivery_radius_km: string;
  minimum_order_value: string;
  is_accepting_orders: boolean;
  created_at: string;
  distance_km?: number | null;
  is_deliverable?: boolean | null;
}

