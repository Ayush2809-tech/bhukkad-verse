import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { Order } from '../../api/types';
import { APP_CONFIG } from '../../constants/config';
import { Bike, MapPin, Phone, CheckCircle, AlertTriangle } from 'lucide-react-native';

const INITIAL_RIDER_TASKS: Order[] = [
  {
    id: 'ro-1',
    order_number: 'BV-782914',
    status: 'OUT_FOR_DELIVERY',
    payment_method: 'COD',
    payment_status: 'PENDING',
    subtotal: 399,
    delivery_fee: 0,
    platform_fee: 5,
    tax_amount: 19.95,
    discount_amount: 0,
    total_amount: 423.95,
    shop_name: 'Dastarkhwan Heritage Palace',
    customer_name: 'Ayush Bhukkad',
    customer_phone: '+91 98765 43210',
    delivery_address: 'Flat 12, Barakhamba Road, Connaught Place, New Delhi',
    items: [
      { id: '1', product_name: 'Shahi Awadhi Handi Dum Biryani', quantity: 1, unit_price: 399, total_price: 399 },
    ],
    created_at: new Date().toISOString(),
    estimated_delivery_minutes: 12,
  },
  {
    id: 'ro-2',
    order_number: 'BV-881230',
    status: 'OUT_FOR_DELIVERY',
    payment_method: 'ONLINE',
    payment_status: 'PAID',
    subtotal: 199,
    delivery_fee: 0,
    platform_fee: 5,
    tax_amount: 9.95,
    discount_amount: 0,
    total_amount: 213.95,
    shop_name: 'Rasoi Express Cloud Kitchen',
    customer_name: 'Sneha Patel',
    customer_phone: '+91 98200 11223',
    delivery_address: 'A-22, Defence Colony, New Delhi',
    items: [
      { id: '2', product_name: 'Homestyle Paneer Butter Masala Thali', quantity: 1, unit_price: 199, total_price: 199 },
    ],
    created_at: new Date().toISOString(),
    estimated_delivery_minutes: 25,
  },
];

export const RiderOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Order[]>(INITIAL_RIDER_TASKS);
  const [cashInHand, setCashInHand] = useState<number>(650.0);

  const isFloatLocked = cashInHand >= APP_CONFIG.MAX_RIDER_COD_CASH_FLOAT;

  const handleCompleteDelivery = (task: Order) => {
    if (task.payment_method === 'COD') {
      const nextCash = cashInHand + task.total_amount;
      if (nextCash > APP_CONFIG.MAX_RIDER_COD_CASH_FLOAT) {
        Alert.alert(
          'Float Limit Exceeded!',
          `Collecting ₹${task.total_amount.toFixed(2)} will exceed your ₹${APP_CONFIG.MAX_RIDER_COD_CASH_FLOAT} cash float limit. Please deposit cash via UPI before taking next deliveries.`,
          [{ text: 'View Float Wallet', onPress: () => navigation.navigate('RiderFloat') }]
        );
      }
      setCashInHand(nextCash);
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }

    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    Alert.alert(
      'Delivery Completed! 🎉',
      `Order #${task.order_number} marked delivered. Guaranteed ₹${APP_CONFIG.RIDER_WAGE_PER_DELIVERY} credited to your wage wallet!`
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bike size={22} color={colors.cloudKitchen} />
          <View>
            <Text style={styles.headerTitle}>ACTIVE DELIVERY TASKS</Text>
            <Text style={styles.headerSub}>₹35 guaranteed wage per delivery</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Float Status Ribbon */}
        <TouchableOpacity
          style={[
            styles.floatRibbon,
            isFloatLocked ? styles.floatRibbonLocked : styles.floatRibbonOk,
          ]}
          onPress={() => navigation.navigate('RiderFloat')}
          activeOpacity={0.8}
        >
          {isFloatLocked ? (
            <AlertTriangle size={18} color={colors.danger} />
          ) : (
            <Bike size={18} color={colors.primary} />
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.floatRibbonTitle}>
              CASH IN HAND: ₹{cashInHand.toFixed(2)} / ₹{APP_CONFIG.MAX_RIDER_COD_CASH_FLOAT}
            </Text>
            <Text style={styles.floatRibbonSub}>
              {isFloatLocked
                ? 'FLOAT LOCKED — Deposit cash to accept new orders'
                : 'Safe float level • Tap to deposit or view ledger'}
            </Text>
          </View>
        </TouchableOpacity>

        {tasks.length === 0 ? (
          <View style={styles.emptyTasks}>
            <CheckCircle size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>All Deliveries Completed!</Text>
            <Text style={styles.emptySub}>
              Waiting for new orders from nearby kitchen hubs...
            </Text>
          </View>
        ) : (
          tasks.map((task) => {
            const isCOD = task.payment_method === 'COD';

            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskCardHeader}>
                  <Text style={styles.taskOrderNumber}>#{task.order_number}</Text>
                  <View
                    style={[
                      styles.paymentBadge,
                      { backgroundColor: isCOD ? colors.warningBg : colors.successBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentBadgeText,
                        { color: isCOD ? colors.warning : colors.success },
                      ]}
                    >
                      {isCOD ? `COLLECT CASH: ₹${task.total_amount.toFixed(2)}` : 'PREPAID ONLINE'}
                    </Text>
                  </View>
                </View>

                {/* Pickup Kitchen */}
                <View style={styles.routeStop}>
                  <View style={[styles.stopDot, { backgroundColor: colors.heritageLuxury }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopLabel}>PICKUP KITCHEN</Text>
                    <Text style={styles.stopName}>{task.shop_name}</Text>
                  </View>
                </View>

                {/* Dropoff Customer */}
                <View style={styles.routeStop}>
                  <View style={[styles.stopDot, { backgroundColor: colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopLabel}>DELIVERY ADDRESS</Text>
                    <Text style={styles.stopName}>{task.delivery_address}</Text>
                    <Text style={styles.customerLine}>
                      {task.customer_name} • {task.customer_phone}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.callCustomerBtn}
                    activeOpacity={0.8}
                  >
                    <Phone size={15} color={colors.text} />
                    <Text style={styles.callCustomerText}>Call Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleCompleteDelivery(task)}
                    activeOpacity={0.85}
                  >
                    <CheckCircle size={15} color="#FFFFFF" />
                    <Text style={styles.completeBtnText}>
                      {isCOD ? 'Cash Collected & Delivered' : 'Mark Delivered'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  floatRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  floatRibbonOk: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.surfaceBorder,
  },
  floatRibbonLocked: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
  },
  floatRibbonTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  floatRibbonSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyTasks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskOrderNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  routeStop: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  stopLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  customerLine: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  callCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  callCustomerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
