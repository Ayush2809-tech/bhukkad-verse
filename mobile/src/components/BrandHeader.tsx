import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { UserRole } from '../api/types';

interface BrandHeaderProps {
  onPressRole?: () => void;
  showRoleBadge?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  onPressRole,
  showRoleBadge = true,
}) => {
  const { activeRole } = useAuth();

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'VENDOR':
        return { title: 'Vendor Kitchen Hub', color: colors.heritageLuxury, bg: colors.heritageLuxuryBg };
      case 'RIDER':
        return { title: 'Rider Fleet & Float', color: colors.cloudKitchen, bg: colors.cloudKitchenBg };
      default:
        return { title: 'Foodie Storefront', color: colors.primary, bg: colors.primaryLight };
    }
  };

  const badgeInfo = getRoleLabel(activeRole);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoIcon}
          resizeMode="contain"
        />
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle}>BHUKKADVERSE</Text>
          <Text style={styles.brandSubtitle}>YOUR CRAVINGS, YOUR UNIVERSE</Text>
        </View>
      </View>

      {showRoleBadge && (
        <TouchableOpacity
          style={[styles.roleBadge, { backgroundColor: badgeInfo.bg, borderColor: badgeInfo.color }]}
          onPress={onPressRole}
          activeOpacity={0.7}
        >
          <View style={[styles.roleDot, { backgroundColor: badgeInfo.color }]} />
          <Text style={[styles.roleText, { color: badgeInfo.color }]}>{badgeInfo.title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: colors.text,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
