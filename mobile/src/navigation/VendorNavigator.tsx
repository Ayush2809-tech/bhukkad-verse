import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { VendorOrdersHubScreen } from '../screens/vendor/VendorOrdersHubScreen';
import { VendorMenuScreen } from '../screens/vendor/VendorMenuScreen';
import { VendorEarningsScreen } from '../screens/vendor/VendorEarningsScreen';
import { colors } from '../constants/colors';
import { ChefHat, Utensils, TrendingUp } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const VendorNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.heritageLuxury,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="OrdersHub"
        component={VendorOrdersHubScreen}
        options={{
          tabBarLabel: 'Kitchen Queue',
          tabBarIcon: ({ color, size }) => <ChefHat size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="VendorMenu"
        component={VendorMenuScreen}
        options={{
          tabBarLabel: 'Menu & Stock',
          tabBarIcon: ({ color, size }) => <Utensils size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="VendorEarnings"
        component={VendorEarningsScreen}
        options={{
          tabBarLabel: '90% Payouts',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
