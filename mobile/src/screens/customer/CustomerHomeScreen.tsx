import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { colors } from '../../constants/colors';
import { CulinaryTier, Shop, Product } from '../../api/types';
import { MapPin, Search, Star, Clock, ShoppingBag } from 'lucide-react-native';

const SAMPLE_SHOPS: Shop[] = [
  {
    id: 'shop-street-1',
    name: 'Purani Dilli Chaat Bhandar',
    slug: 'purani-dilli-chaat-bhandar',
    tier: 'STREET_FOOD',
    tagline: 'Crispy Golgappas & Butter Tikki since 1968',
    address_line1: 'Chandni Chowk, Old Delhi',
    city: 'New Delhi',
    latitude: 28.6506,
    longitude: 77.2304,
    delivery_radius_km: 7.5,
    rating: 4.8,
    is_active: true,
  },
  {
    id: 'shop-heritage-1',
    name: 'Dastarkhwan Heritage Palace',
    slug: 'dastarkhwan-heritage-palace',
    tier: 'HERITAGE_LUXURY',
    tagline: 'Authentic Slow-Dum Awadhi Handi Biryani',
    address_line1: 'Near Nizamuddin Dargah',
    city: 'New Delhi',
    latitude: 28.5912,
    longitude: 77.2428,
    delivery_radius_km: 12.0,
    rating: 4.9,
    is_active: true,
  },
  {
    id: 'shop-cloud-1',
    name: 'Rasoi Express Cloud Kitchen',
    slug: 'rasoi-express-cloud-kitchen',
    tier: 'CLOUD_KITCHEN',
    tagline: 'Hygienic Ghar-jaisa Thali & Whole Spices',
    address_line1: 'Kailash Colony, South Delhi',
    city: 'New Delhi',
    latitude: 28.5528,
    longitude: 77.2415,
    delivery_radius_km: 8.0,
    rating: 4.7,
    is_active: true,
  },
];

const POPULAR_DISHES: Product[] = [
  {
    id: 'dish-1',
    name: 'Special Lucknowi Dum Biryani',
    slug: 'lucknowi-dum-biryani',
    description: 'Slow-cooked aromatic basmati rice layered with fragrant saffron & kewra.',
    base_price: 349,
    discounted_price: 299,
    is_vegetarian: false,
    spice_level: 'MEDIUM',
    is_available: true,
    shop_id: 'shop-heritage-1',
    shop_name: 'Dastarkhwan Heritage Palace',
    category_name: 'Biryanis',
  },
  {
    id: 'dish-2',
    name: 'Crispy Kurkuri Aloo Tikki (Desi Ghee)',
    slug: 'crispy-aloo-tikki',
    description: 'Golden fried double-spiced potato patties with tamarind & mint chutneys.',
    base_price: 120,
    is_vegetarian: true,
    spice_level: 'MEDIUM',
    is_available: true,
    shop_id: 'shop-street-1',
    shop_name: 'Purani Dilli Chaat Bhandar',
    category_name: 'Street Chaat',
  },
  {
    id: 'dish-3',
    name: 'Homestyle Paneer Butter Masala Thali',
    slug: 'paneer-thali',
    description: 'Fresh paneer gravy served with 3 butter rotis, jeera rice, and dal tadka.',
    base_price: 199,
    is_vegetarian: true,
    spice_level: 'MILD',
    is_available: true,
    shop_id: 'shop-cloud-1',
    shop_name: 'Rasoi Express Cloud Kitchen',
    category_name: 'Daily Thalis',
  },
];

interface CustomerHomeScreenProps {
  navigation: any;
}

export const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = ({ navigation }) => {
  const { location, calculateDistance, isShopServiceable } = useLocation();
  const { itemCount, totalAmount } = useCart();
  const [selectedTier, setSelectedTier] = useState<CulinaryTier | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const tiers: { key: CulinaryTier | 'ALL'; label: string; icon: string; color: string }[] = [
    { key: 'ALL', label: 'All Cravings', icon: '✨', color: colors.primary },
    { key: 'STREET_FOOD', label: 'Street Legends', icon: '🍢', color: colors.streetFood },
    { key: 'HERITAGE_LUXURY', label: 'Heritage Dining', icon: '👑', color: colors.heritageLuxury },
    { key: 'CLOUD_KITCHEN', label: 'Cloud Kitchens', icon: '🍳', color: colors.cloudKitchen },
  ];

  const filteredShops = SAMPLE_SHOPS.filter((shop) => {
    const matchesTier = selectedTier === 'ALL' || shop.tier === selectedTier;
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.tagline?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Geolocation Address Header */}
        <View style={styles.locationBar}>
          <MapPin size={18} color={colors.primary} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.deliverToLabel}>DELIVERING TO</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {location.address}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search restaurants, biryani, chaat, thalis..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Theatrical Cinematic Entrance Banner */}
        <View style={styles.theatreBanner}>
          <View style={styles.theatreOverlay}>
            <Text style={styles.theatreBadge}>CINEMATIC HYPERLOCAL MARKETPLACE</Text>
            <Text style={styles.theatreTitle}>Your Cravings.{'\n'}Your Universe.</Text>
            <Text style={styles.theatreDesc}>
              Flat 10% platform fee for kitchens • Zero bill-shock • Free delivery over ₹99
            </Text>
          </View>
        </View>

        {/* 3 Culinary Tiers Filter Pills */}
        <View style={styles.tierSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierRow}>
            {tiers.map((t) => {
              const active = selectedTier === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.tierPill,
                    active && { backgroundColor: t.color, borderColor: t.color },
                  ]}
                  onPress={() => setSelectedTier(t.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.tierIcon}>{t.icon}</Text>
                  <Text style={[styles.tierLabel, active && styles.activeTierLabel]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Popular Dishes Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGENDARY CRAVINGS (ROUND-ROBIN)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishCarousel}>
            {POPULAR_DISHES.map((dish) => {
              const isVeg = dish.is_vegetarian;
              return (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.dishCard}
                  onPress={() => navigation.navigate('ShopDetail', { shopId: dish.shop_id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.dishCardTop}>
                    <View style={[styles.vegBadge, { borderColor: isVeg ? colors.veg : colors.nonVeg }]}>
                      <View style={[styles.vegDot, { backgroundColor: isVeg ? colors.veg : colors.nonVeg }]} />
                    </View>
                    <Text style={styles.dishShopName} numberOfLines={1}>
                      {dish.shop_name}
                    </Text>
                  </View>
                  <Text style={styles.dishName} numberOfLines={2}>
                    {dish.name}
                  </Text>
                  <Text style={styles.dishDesc} numberOfLines={2}>
                    {dish.description}
                  </Text>
                  <View style={styles.dishPriceRow}>
                    <Text style={styles.dishPrice}>₹{dish.discounted_price || dish.base_price}</Text>
                    {dish.discounted_price && (
                      <Text style={styles.dishDiscount}>₹{dish.base_price}</Text>
                    )}
                    <View style={styles.viewMenuBtn}>
                      <Text style={styles.viewMenuBtnText}>Order</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Kitchen Shops */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HYPERLOCAL KITCHENS ({filteredShops.length})</Text>
          {filteredShops.map((shop) => {
            const distance = calculateDistance(shop.latitude, shop.longitude);
            const serviceable = isShopServiceable(shop.latitude, shop.longitude, shop.delivery_radius_km);

            const getTierBadge = (tier: CulinaryTier) => {
              switch (tier) {
                case 'HERITAGE_LUXURY':
                  return { label: 'HERITAGE LUXURY', color: colors.heritageLuxury, bg: colors.heritageLuxuryBg };
                case 'CLOUD_KITCHEN':
                  return { label: 'CLOUD KITCHEN', color: colors.cloudKitchen, bg: colors.cloudKitchenBg };
                default:
                  return { label: 'ICONIC STREET FOOD', color: colors.streetFood, bg: colors.streetFoodBg };
              }
            };
            const tierBadge = getTierBadge(shop.tier);

            return (
              <TouchableOpacity
                key={shop.id}
                style={styles.shopCard}
                onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id, shop })}
                activeOpacity={0.85}
              >
                <View style={styles.shopCardHeader}>
                  <View style={[styles.shopTierBadge, { backgroundColor: tierBadge.bg, borderColor: tierBadge.color }]}>
                    <Text style={[styles.shopTierText, { color: tierBadge.color }]}>{tierBadge.label}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.ratingText}>{shop.rating}</Text>
                  </View>
                </View>

                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopTagline}>{shop.tagline}</Text>

                <View style={styles.shopMetaRow}>
                  <View style={styles.metaItem}>
                    <Clock size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>25-35 mins</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{distance} km away</Text>
                  </View>
                  <View style={styles.serviceableTag}>
                    <Text style={[styles.serviceableText, { color: serviceable ? colors.success : colors.danger }]}>
                      {serviceable ? 'Serviceable' : 'Out of Radius'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Cart Bar if cart has items */}
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
  scrollContent: {
    paddingBottom: 90,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  deliverToLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  theatreBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#1E140F',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 0, 0.3)',
    overflow: 'hidden',
  },
  theatreOverlay: {
    padding: 16,
  },
  theatreBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  theatreTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  theatreDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  tierSelector: {
    marginTop: 14,
  },
  tierRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tierIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTierLabel: {
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  dishCarousel: {
    gap: 12,
  },
  dishCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dishCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishShopName: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  dishName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  dishDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginBottom: 10,
  },
  dishPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  dishDiscount: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  viewMenuBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewMenuBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  shopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  shopTierText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  shopTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  serviceableTag: {
    marginLeft: 'auto',
  },
  serviceableText: {
    fontSize: 11,
    fontWeight: '700',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
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
