import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Order, OrderStatus } from '../../api/types';
import { StatusBadge } from '../../components/StatusBadge';
import { ArrowLeft, Clock, MapPin, Phone, CheckCircle2, Circle } from 'lucide-react-native';

interface OrderTrackingScreenProps {
  route: any;
  navigation: any;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ route, navigation }) => {
  const order: Order = route.params?.order || {
    id: 'ord-mock',
    order_number: 'BV-782914',
    status: 'CONFIRMED',
    payment_method: 'COD',
    payment_status: 'PENDING',
    subtotal: 399,
    delivery_fee: 0,
    platform_fee: 5,
    tax_amount: 19.95,
    discount_amount: 0,
    total_amount: 423.95,
    shop_name: 'Dastarkhwan Heritage Palace',
    delivery_address: 'Connaught Place, Central Delhi, 110001',
    items: [
      {
        id: '1',
        product_name: 'Special Lucknowi Dum Biryani',
        quantity: 1,
        unit_price: 399,
        total_price: 399,
      },
    ],
    created_at: new Date().toISOString(),
    estimated_delivery_minutes: 24,
    rider_name: 'Vikram Singh',
    rider_phone: '+91 98111 22334',
  };

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Simulate progress transition for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(2);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    { title: 'Order Placed & Confirmed', desc: 'Received by kitchen' },
    { title: 'Kitchen Preparing Your Meal', desc: 'Fresh ingredients on the tawa/dum' },
    { title: 'Rider Out for Delivery', desc: 'En route with hot food insulation bag' },
    { title: 'Delivered to Doorstep', desc: 'Enjoy your Bhukkad feast!' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('CustomerHome')}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRACKING #{order.order_number}</Text>
        <StatusBadge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ETA Hero Card */}
        <View style={styles.etaCard}>
          <View style={styles.etaHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.etaSub}>ESTIMATED ARRIVAL</Text>
          </View>
          <Text style={styles.etaTime}>{order.estimated_delivery_minutes || 25} MINS</Text>
          <Text style={styles.etaStatus}>
            {currentStep === 1
              ? 'Kitchen is preparing fresh ingredients...'
              : 'Dishes are simmering to golden perfection!'}
          </Text>
        </View>

        {/* Live Stepper */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>LIVE ORDER TIMELINE</Text>
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} color={colors.success} fill={colors.successBg} />
                  ) : (
                    <Circle size={20} color={colors.surfaceBorder} />
                  )}
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepConnector,
                        { backgroundColor: isCompleted ? colors.success : colors.surfaceBorder },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, isCurrent && { color: colors.primary, fontWeight: '800' }]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Assigned Rider Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>DELIVERY FLEET PARTNER</Text>
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Text style={styles.riderAvatarText}>🛵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{order.rider_name || 'Assigned Fleet Rider'}</Text>
              <Text style={styles.riderRole}>Bhukkad Delivery Partner • ₹35 Fair Wage Guaranteed</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
              <Phone size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.addressHeader}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.sectionHeader}>DESTINATION</Text>
          </View>
          <Text style={styles.addressText}>{order.delivery_address}</Text>
        </View>

        {/* Back to Home CTA */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('CustomerHome')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>Back to Storefront</Text>
        </TouchableOpacity>
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  etaCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 0, 0.3)',
    marginBottom: 14,
    alignItems: 'center',
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  etaSub: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  etaTime: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 4,
  },
  etaStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 24,
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderAvatarText: {
    fontSize: 20,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  riderRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  homeBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
});
