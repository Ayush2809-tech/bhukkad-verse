import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { Utensils } from 'lucide-react-native';

interface VendorDishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  isVegetarian: boolean;
}

const INITIAL_MENU: VendorDishItem[] = [
  {
    id: 'm-1',
    name: 'Desi Ghee Golgappa Feast (6 Pcs)',
    category: 'Chaat',
    price: 80,
    isAvailable: true,
    isVegetarian: true,
  },
  {
    id: 'm-2',
    name: 'Kurkuri Desi Ghee Aloo Tikki',
    category: 'Chaat',
    price: 120,
    isAvailable: true,
    isVegetarian: true,
  },
  {
    id: 'm-3',
    name: 'Dahi Papdi Chaat Royale',
    category: 'Chaat',
    price: 110,
    isAvailable: true,
    isVegetarian: true,
  },
  {
    id: 'm-4',
    name: 'Desi Ghee Bhalla Papdi Mixed',
    category: 'Chaat',
    price: 130,
    isAvailable: false,
    isVegetarian: true,
  },
  {
    id: 'm-5',
    name: 'Special Kesar Kulfi Falooda',
    category: 'Desserts',
    price: 90,
    isAvailable: true,
    isVegetarian: true,
  },
];

export const VendorMenuScreen: React.FC = () => {
  const [menu, setMenu] = useState<VendorDishItem[]>(INITIAL_MENU);

  const toggleAvailability = (dishId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    setMenu((prev) =>
      prev.map((item) =>
        item.id === dishId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const inStockCount = menu.filter((d) => d.isAvailable).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Utensils size={20} color={colors.primary} />
          <View>
            <Text style={styles.headerTitle}>MENU & STOCK CONTROLS</Text>
            <Text style={styles.headerSub}>
              {inStockCount} of {menu.length} items live for ordering
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.menuNotice}>
          <Text style={styles.menuNoticeText}>
            💡 Toggle items off when running low on ingredients to prevent order cancellations.
          </Text>
        </View>

        {menu.map((dish) => {
          return (
            <View key={dish.id} style={styles.dishCard}>
              <View style={styles.dishInfo}>
                <View style={styles.dishMetaRow}>
                  <View
                    style={[
                      styles.vegBadge,
                      { borderColor: dish.isVegetarian ? colors.veg : colors.nonVeg },
                    ]}
                  >
                    <View
                      style={[
                        styles.vegDot,
                        { backgroundColor: dish.isVegetarian ? colors.veg : colors.nonVeg },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryTag}>{dish.category}</Text>
                </View>

                <Text style={styles.dishTitle}>{dish.name}</Text>
                <Text style={styles.dishPrice}>₹{dish.price}</Text>
              </View>

              <View style={styles.switchBox}>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: dish.isAvailable ? colors.success : colors.danger },
                  ]}
                >
                  {dish.isAvailable ? 'In Stock' : 'Sold Out'}
                </Text>
                <Switch
                  value={dish.isAvailable}
                  onValueChange={() => toggleAvailability(dish.id)}
                  trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  menuNotice: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
  },
  menuNoticeText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dishInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegBadge: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  categoryTag: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  switchBox: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
});
