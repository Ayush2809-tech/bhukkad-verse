import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import { UserRole } from '../api/types';

export const RoleSwitcherBanner: React.FC = () => {
  const { activeRole, switchRole } = useAuth();

  const roles: { key: UserRole; label: string; icon: string }[] = [
    { key: 'CUSTOMER', label: 'Customer', icon: '🍢' },
    { key: 'VENDOR', label: 'Vendor Kitchen', icon: '🍳' },
    { key: 'RIDER', label: 'Rider Fleet', icon: '🛵' },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>SWITCH APP CONSOLE</Text>
      <View style={styles.tabsRow}>
        {roles.map((r) => {
          const isActive = activeRole === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleTab, isActive && styles.activeTab]}
              onPress={() => switchRole(r.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, isActive && styles.activeRoleLabel]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  title: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  roleIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeRoleLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
});
