import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { colors } from '../../constants/colors';
import { EconomicBreakdownCard } from '../../components/EconomicBreakdownCard';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';

interface CartScreenProps {
  navigation: any;
}

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const {
    items,
    shopName,
    subtotal,
    deliveryFee,
    platformFee,
    gstAmount,
    totalAmount,
    updateQuantity,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color={colors.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>Your Bhukkad Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Explore legendary street chaat, royal biryanis, and comforting thalis!
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate('CustomerHome')}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreBtnText}>Discover Kitchens</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR BASKET</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Trash2 size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Kitchen Banner */}
        <View style={styles.shopBanner}>
          <Text style={styles.orderingFromLabel}>ORDERING DIRECTLY FROM</Text>
          <Text style={styles.shopBannerName}>{shopName || 'Selected Kitchen'}</Text>
          <Text style={styles.vendorEconomicsNotice}>
            ⚡ Flat 10% platform fee: 90% goes directly to this kitchen.
          </Text>
        </View>

        {/* Item List */}
        <View style={styles.itemsCard}>
          {items.map((item) => {
            const isVeg = item.product.is_vegetarian;
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <View style={[styles.vegBadge, { borderColor: isVeg ? colors.veg : colors.nonVeg }]}>
                    <View style={[styles.vegDot, { backgroundColor: isVeg ? colors.veg : colors.nonVeg }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.product.name}</Text>
                    <Text style={styles.itemPriceText}>₹{item.itemPrice.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.id, -1)}
                    activeOpacity={0.7}
                  >
                    <Minus size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(item.id, 1)}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Transparent Economic Breakdown Card */}
        <EconomicBreakdownCard
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          platformFee={platformFee}
          gstAmount={gstAmount}
          totalAmount={totalAmount}
        />
      </ScrollView>

      {/* Bottom Sticky Checkout Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.bottomTotalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1.2,
  },
  clearBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  shopBanner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  orderingFromLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  shopBannerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  vendorEconomicsNotice: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  vegBadge: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  bottomTotalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  bottomTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
