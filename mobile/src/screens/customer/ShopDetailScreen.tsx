import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { colors } from '../../constants/colors';
import { Product, Shop } from '../../api/types';
import { ArrowLeft, Star, Clock, MapPin, Plus, ShoppingBag } from 'lucide-react-native';

const SHOP_PRODUCTS: Record<string, Product[]> = {
  'shop-street-1': [
    {
      id: 'dish-st-1',
      name: 'Desi Ghee Golgappa Feast (6 Pcs)',
      slug: 'desi-ghee-golgappa',
      description: 'Crispy semolina puris filled with spicy hing jaljeera and sweet sonth.',
      base_price: 80,
      is_vegetarian: true,
      spice_level: 'EXTRA_SPICY',
      is_available: true,
      shop_id: 'shop-street-1',
      shop_name: 'Purani Dilli Chaat Bhandar',
      category_name: 'Signature Chaat',
    },
    {
      id: 'dish-st-2',
      name: 'Kurkuri Desi Ghee Aloo Tikki',
      slug: 'kurkuri-aloo-tikki',
      description: 'Slow-fried on giant tawa, layered with thick dahi and pomegranate seeds.',
      base_price: 120,
      is_vegetarian: true,
      spice_level: 'MEDIUM',
      is_available: true,
      shop_id: 'shop-street-1',
      shop_name: 'Purani Dilli Chaat Bhandar',
      category_name: 'Signature Chaat',
    },
    {
      id: 'dish-st-3',
      name: 'Dahi Papdi Chaat Royale',
      slug: 'dahi-papdi-chaat',
      description: 'Handcrafted flour crisps, boiled chickpeas, and spiced yogurt.',
      base_price: 110,
      is_vegetarian: true,
      spice_level: 'MILD',
      is_available: true,
      shop_id: 'shop-street-1',
      shop_name: 'Purani Dilli Chaat Bhandar',
      category_name: 'Signature Chaat',
    },
  ],
  'shop-heritage-1': [
    {
      id: 'dish-hg-1',
      name: 'Shahi Awadhi Handi Dum Biryani',
      slug: 'shahi-awadhi-handi-dum-biryani',
      description: 'Slow-dum mutton in sealed clay pot with saffron & secret potli masala.',
      base_price: 450,
      discounted_price: 399,
      is_vegetarian: false,
      spice_level: 'MEDIUM',
      is_available: true,
      shop_id: 'shop-heritage-1',
      shop_name: 'Dastarkhwan Heritage Palace',
      category_name: 'Royal Handi Rice',
    },
    {
      id: 'dish-hg-2',
      name: 'Galouti Kebab with Taftan (4 Pcs)',
      slug: 'galouti-kebab-taftan',
      description: 'Melt-in-mouth minced meat infused with 160 royal heritage spices.',
      base_price: 360,
      is_vegetarian: false,
      spice_level: 'MILD',
      is_available: true,
      shop_id: 'shop-heritage-1',
      shop_name: 'Dastarkhwan Heritage Palace',
      category_name: 'Royal Kebabs',
    },
  ],
  'shop-cloud-1': [
    {
      id: 'dish-ck-1',
      name: 'Homestyle Paneer Butter Masala Thali',
      slug: 'paneer-thali',
      description: 'Paneer gravy, 3 fresh phulkas, jeera basmati rice, yellow dal and kheer.',
      base_price: 199,
      is_vegetarian: true,
      spice_level: 'MILD',
      is_available: true,
      shop_id: 'shop-cloud-1',
      shop_name: 'Rasoi Express Cloud Kitchen',
      category_name: 'Comfort Thalis',
    },
    {
      id: 'dish-ck-2',
      name: 'Dal Makhani & Garlic Naan Combo',
      slug: 'dal-makhani-combo',
      description: '24-hour slow simmered black urad dal with churned white butter.',
      base_price: 180,
      is_vegetarian: true,
      spice_level: 'MEDIUM',
      is_available: true,
      shop_id: 'shop-cloud-1',
      shop_name: 'Rasoi Express Cloud Kitchen',
      category_name: 'Daily Combos',
    },
  ],
};

interface ShopDetailScreenProps {
  route: any;
  navigation: any;
}

export const ShopDetailScreen: React.FC<ShopDetailScreenProps> = ({ route, navigation }) => {
  const { shopId } = route.params || { shopId: 'shop-street-1' };
  const { calculateDistance } = useLocation();
  const { items, shopId: activeCartShopId, shopName: activeCartShopName, addItem, clearCart, totalAmount, itemCount } = useCart();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const shop: Shop = route.params?.shop || {
    id: shopId,
    name: shopId === 'shop-heritage-1' ? 'Dastarkhwan Heritage Palace' : shopId === 'shop-cloud-1' ? 'Rasoi Express Cloud Kitchen' : 'Purani Dilli Chaat Bhandar',
    slug: 'shop-slug',
    tier: shopId === 'shop-heritage-1' ? 'HERITAGE_LUXURY' : shopId === 'shop-cloud-1' ? 'CLOUD_KITCHEN' : 'STREET_FOOD',
    tagline: 'Authentic hyperlocal culinary masters',
    address_line1: 'Near Central Circle, New Delhi',
    city: 'New Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    delivery_radius_km: 10,
    rating: 4.8,
    is_active: true,
  };

  const distance = calculateDistance(shop.latitude, shop.longitude);
  const dishes = SHOP_PRODUCTS[shopId] || SHOP_PRODUCTS['shop-street-1'];

  const categories = ['ALL', ...Array.from(new Set(dishes.map((d) => d.category_name || 'Specialties')))];

  const filteredDishes = activeCategory === 'ALL'
    ? dishes
    : dishes.filter((d) => (d.category_name || 'Specialties') === activeCategory);

  const handleAddDish = (dish: Product) => {
    // If cart has items from another vendor, enforce single-vendor rule
    if (activeCartShopId && activeCartShopId !== dish.shop_id && items.length > 0) {
      Alert.alert(
        'Replace Cart Items?',
        `Your cart contains items from "${activeCartShopName}". Would you like to clear it and order from "${dish.shop_name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem(dish);
            },
          },
        ]
      );
    } else {
      addItem(dish);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {shop.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shop Info Card */}
        <View style={styles.shopInfoCard}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopTagline}>{shop.tagline}</Text>

          <View style={styles.shopMetrics}>
            <View style={styles.metricItem}>
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.metricText}>{shop.rating} (350+ reviews)</Text>
            </View>
            <View style={styles.metricItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>30 mins</Text>
            </View>
            <View style={styles.metricItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.metricText}>{distance} km</Text>
            </View>
          </View>
        </View>

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catTab, activeCategory === cat && styles.activeCatTab]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.activeCatText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Dishes List */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeading}>FRESH KITCHEN DISHES ({filteredDishes.length})</Text>

          {filteredDishes.map((dish) => {
            const isVeg = dish.is_vegetarian;
            const price = dish.discounted_price || dish.base_price;

            return (
              <View key={dish.id} style={styles.dishRow}>
                <View style={styles.dishLeft}>
                  <View style={[styles.vegBadge, { borderColor: isVeg ? colors.veg : colors.nonVeg }]}>
                    <View style={[styles.vegDot, { backgroundColor: isVeg ? colors.veg : colors.nonVeg }]} />
                  </View>
                  <Text style={styles.dishTitle}>{dish.name}</Text>
                  <Text style={styles.dishPriceText}>₹{price}</Text>
                  {dish.discounted_price && (
                    <Text style={styles.dishOrigPrice}>₹{dish.base_price}</Text>
                  )}
                  <Text style={styles.dishDescription} numberOfLines={2}>
                    {dish.description}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddDish(dish)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartIconCircle}>
              <ShoppingBag size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.cartItemCount}>{itemCount} item{itemCount > 1 ? 's' : ''} in cart</Text>
              <Text style={styles.cartSubtotal}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.viewCartBtn}>
            <Text style={styles.viewCartBtnText}>View Cart →</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  shopInfoCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  shopTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  shopMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  activeCatTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeCatText: {
    color: '#FFFFFF',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  menuHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dishLeft: {
    flex: 1,
    paddingRight: 12,
  },
  vegBadge: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  dishPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  dishOrigPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  dishDescription: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartSubtotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  viewCartBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewCartBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});
