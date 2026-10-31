import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { APP_CONFIG } from '../constants/config';

interface EconomicBreakdownProps {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  gstAmount: number;
  totalAmount: number;
  discount?: number;
}

export const EconomicBreakdownCard: React.FC<EconomicBreakdownProps> = ({
  subtotal,
  deliveryFee,
  platformFee,
  gstAmount,
  totalAmount,
  discount = 0,
}) => {
  const isFreeDelivery = subtotal >= APP_CONFIG.FREE_DELIVERY_THRESHOLD;

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>FAIR BILL BREAKDOWN (NO SURGE PRICING)</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Item Subtotal</Text>
        <Text style={styles.value}>₹{subtotal.toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.labelWithBadge}>
          <Text style={styles.label}>Delivery Partner Wage</Text>
          {isFreeDelivery && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE OVER ₹99</Text>
            </View>
          )}
        </View>
        <Text style={[styles.value, isFreeDelivery && styles.strikethrough]}>
          {isFreeDelivery ? '₹0.00' : `₹${deliveryFee.toFixed(2)}`}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Transparent Platform Fee</Text>
        <Text style={styles.value}>₹{platformFee.toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>GST (5% Government Food Tax)</Text>
        <Text style={styles.value}>₹{gstAmount.toFixed(2)}</Text>
      </View>

      {discount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.success }]}>Coupon Savings</Text>
          <Text style={[styles.value, { color: colors.success }]}>-₹{discount.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>To Pay</Text>
        <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
      </View>

      <View style={styles.fairEconomicsPledge}>
        <Text style={styles.pledgeText}>
          🤝 <Text style={{ fontWeight: '700', color: colors.text }}>90%</Text> goes to the kitchen.
          Guaranteed <Text style={{ fontWeight: '700', color: colors.text }}>₹35</Text> to your rider.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  freeBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  strikethrough: {
    color: colors.success,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  fairEconomicsPledge: {
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  pledgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
