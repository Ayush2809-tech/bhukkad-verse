import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RiderOrdersScreen } from '../screens/rider/RiderOrdersScreen';
import { RiderTelemetryScreen } from '../screens/rider/RiderTelemetryScreen';
import { RiderFloatWalletScreen } from '../screens/rider/RiderFloatWalletScreen';
import { colors } from '../constants/colors';
import { Bike, Radio, Wallet } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const RiderNavigator: React.FC = () => {
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
        tabBarActiveTintColor: colors.cloudKitchen,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="RiderTasks"
        component={RiderOrdersScreen}
        options={{
          tabBarLabel: 'Deliveries',
          tabBarIcon: ({ color, size }) => <Bike size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="RiderTelemetry"
        component={RiderTelemetryScreen}
        options={{
          tabBarLabel: 'GPS Telemetry',
          tabBarIcon: ({ color, size }) => <Radio size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="RiderFloat"
        component={RiderFloatWalletScreen}
        options={{
          tabBarLabel: 'COD Float & ₹35 Wage',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
