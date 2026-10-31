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
import { Order, OrderStatus } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { Bell, ChefHat, Check, Clock, Bike, Phone } from 'lucide-react-native';

const INITIAL_VENDOR_ORDERS: Order[] = [
  {
    id: 'vo-1',
    order_number: 'BV-901428',
    status: 'CONFIRMED',
    payment_method: 'COD',
    payment_status: 'PENDING',
    subtotal: 580,
    delivery_fee: 0,
    platform_fee: 5,
    tax_amount: 29,
    discount_amount: 0,
    total_amount: 614,
    shop_name: 'Purani Dilli Chaat Bhandar',
    customer_name: 'Rahul Verma',
    customer_phone: '+91 98991 12233',
    delivery_address: 'Flat 402, Block C, Mayur Vihar Phase 1, Delhi',
    items: [
      { id: '1', product_name: 'Desi Ghee Golgappa Feast (6 Pcs)', quantity: 2, unit_price: 80, total_price: 160 },
      { id: '2', product_name: 'Kurkuri Desi Ghee Aloo Tikki', quantity: 3, unit_price: 120, total_price: 360 },
      { id: '3', product_name: 'Dahi Papdi Chaat Royale', quantity: 1, unit_price: 110, total_price: 110 },
    ],
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    estimated_delivery_minutes: 20,
    rider_name: 'Amit Kumar',
    rider_phone: '+91 98711 00998',
  },
  {
    id: 'vo-2',
    order_number: 'BV-892110',
    status: 'PREPARING',
    payment_method: 'ONLINE',
    payment_status: 'PAID',
    subtotal: 360,
    delivery_fee: 0,
    platform_fee: 5,
    tax_amount: 18,
    discount_amount: 0,
    total_amount: 383,
    shop_name: 'Purani Dilli Chaat Bhandar',
    customer_name: 'Priya Sharma',
    customer_phone: '+91 99100 44556',
    delivery_address: 'B-14, Swasthya Vihar, Vikas Marg, Delhi',
    items: [
      { id: '4', product_name: 'Kurkuri Desi Ghee Aloo Tikki', quantity: 3, unit_price: 120, total_price: 360 },
    ],
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    estimated_delivery_minutes: 15,
    rider_name: 'Vikram Singh',
    rider_phone: '+91 98111 22334',
  },
];

export const VendorOrdersHubScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_VENDOR_ORDERS);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  const advanceOrderStatus = (orderNumber: string, nextStatus: OrderStatus) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }

    setOrders((prev) =>
      prev.map((o) => (o.order_number === orderNumber ? { ...o, status: nextStatus } : o))
    );

    Alert.alert(
      'Kitchen Status Updated',
      `Order #${orderNumber} is now marked as ${nextStatus.replace(/_/g, ' ')}.`
    );
  };

  const pendingCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;

  return (
    <View style={styles.container}>
      {/* Live Kitchen Status Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ChefHat size={22} color={colors.heritageLuxury} />
          <View>
            <Text style={styles.headerTitle}>KITCHEN ORDER QUEUE</Text>
            <Text style={styles.headerSub}>Live auto-polling active • 10% platform fee</Text>
          </View>
        </View>
        <View style={styles.pulseBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.pulseText}>LIVE</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>{pendingCount}</Text>
          <Text style={styles.metricLabel}>New Orders</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: colors.warning }]}>{preparingCount}</Text>
          <Text style={styles.metricLabel}>On Tawa / Dum</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: colors.success }]}>
            ₹{(orders.reduce((sum, o) => sum + o.subtotal * 0.9, 0)).toFixed(0)}
          </Text>
          <Text style={styles.metricLabel}>90% Net Today</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {orders.map((order) => {
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderTime}>
                    {order.payment_method === 'COD' ? '💵 Cash on Delivery' : '💳 Paid Online'} •{' '}
                    {order.items.length} items
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              {/* Items Breakdown */}
              <View style={styles.itemsList}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{item.quantity}x</Text>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemPrice}>₹{item.total_price}</Text>
                  </View>
                ))}
              </View>

              {/* Customer & Destination */}
              <View style={styles.customerBox}>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>{order.customer_name}</Text>
                  <Text style={styles.customerAddress} numberOfLines={1}>
                    {order.delivery_address}
                  </Text>
                </View>
                <View style={styles.riderCall}>
                  <Bike size={14} color={colors.cloudKitchen} />
                  <Text style={styles.riderNameText}>
                    {order.rider_name ? order.rider_name.split(' ')[0] : 'Fleet Rider'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons based on status */}
              <View style={styles.actionRow}>
                {order.status === 'CONFIRMED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                    onPress={() => advanceOrderStatus(order.order_number, 'PREPARING')}
                    activeOpacity={0.8}
                  >
                    <ChefHat size={16} color="#000000" />
                    <Text style={[styles.actionBtnText, { color: '#000000' }]}>
                      Accept & Start Preparing
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === 'PREPARING' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.cloudKitchen }]}
                    onPress={() => advanceOrderStatus(order.order_number, 'OUT_FOR_DELIVERY')}
                    activeOpacity={0.8}
                  >
                    <Bike size={16} color="#000000" />
                    <Text style={[styles.actionBtnText, { color: '#000000' }]}>
                      Hand Over to Rider
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <View style={styles.handedOverBox}>
                    <Check size={16} color={colors.success} />
                    <Text style={styles.handedOverText}>Handed to Rider • On Route</Text>
                  </View>
                )}
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
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  pulseText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.danger,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  orderTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemsList: {
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    width: 24,
  },
  itemName: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  customerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerDetails: {
    flex: 1,
    paddingRight: 8,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  customerAddress: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  riderCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cloudKitchenBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riderNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cloudKitchen,
  },
  actionRow: {
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  handedOverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: colors.successBg,
    borderRadius: 8,
    gap: 6,
  },
  handedOverText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});
