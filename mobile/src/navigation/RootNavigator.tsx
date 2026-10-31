import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { BrandHeader } from '../components/BrandHeader';
import { RoleSwitcherBanner } from '../components/RoleSwitcherBanner';
import { CustomerNavigator } from './CustomerNavigator';
import { VendorNavigator } from './VendorNavigator';
import { RiderNavigator } from './RiderNavigator';
import { colors } from '../constants/colors';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.surfaceBorder,
    primary: colors.primary,
  },
};

export const RootNavigator: React.FC = () => {
  const { activeRole } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandHeader />
      <RoleSwitcherBanner />

      <View style={styles.content}>
        <NavigationContainer theme={navigationTheme}>
          {activeRole === 'VENDOR' && <VendorNavigator />}
          {activeRole === 'RIDER' && <RiderNavigator />}
          {activeRole === 'CUSTOMER' && <CustomerNavigator />}
        </NavigationContainer>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
