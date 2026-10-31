import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../api/types';
import { colors } from '../constants/colors';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: colors.successBg, color: colors.success, label: 'CONFIRMED' };
      case 'PREPARING':
        return { bg: colors.warningBg, color: colors.warning, label: 'PREPARING' };
      case 'OUT_FOR_DELIVERY':
        return { bg: colors.cloudKitchenBg, color: colors.cloudKitchen, label: 'ON THE WAY' };
      case 'DELIVERED':
        return { bg: colors.successBg, color: colors.success, label: 'DELIVERED' };
      case 'CANCELLED':
        return { bg: colors.dangerBg, color: colors.danger, label: 'CANCELLED' };
      default:
        return { bg: colors.surfaceLight, color: colors.textSecondary, label: 'PENDING' };
    }
  };

  const style = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.color }]}>
      <View style={[styles.dot, { backgroundColor: style.color }]} />
      <Text style={[styles.label, { color: style.color }]}>{style.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
