import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { colors } from '../../constants/colors';
import { PaymentMethod, Order } from '../../api/types';
import { ArrowLeft, MapPin, CheckCircle, CreditCard, Banknote } from 'lucide-react-native';

interface CheckoutScreenProps {
  navigation: any;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { items, shopId, shopName, subtotal, deliveryFee, platformFee, gstAmount, totalAmount, clearCart } = useCart();
  const { location } = useLocation();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderNumber = 'BV-' + Math.floor(100000 + Math.random() * 900000);
      const newOrder: Order = {
        id: 'ord-' + Date.now(),
        order_number: orderNumber,
        status: 'CONFIRMED',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        subtotal,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        tax_amount: gstAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        shop_name: shopName || 'Purani Dilli Chaat Bhandar',
        customer_name: 'Ayush Bhukkad',
        customer_phone: '+91 98765 43210',
        delivery_address: location.address,
        items: items.map((i) => ({
          id: i.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.itemPrice,
          total_price: i.itemPrice * i.quantity,
        })),
        created_at: new Date().toISOString(),
        estimated_delivery_minutes: 28,
        rider_name: 'Vikram Singh (Bhukkad Express Rider)',
        rider_phone: '+91 98111 22334',
      };

      // Clear the cart
      clearCart();

      // Navigate to tracking
      navigation.replace('OrderTracking', { order: newOrder });
    } catch {
      Alert.alert('Checkout Error', 'Unable to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SELECT PAYMENT & CONFIRM</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>DELIVERING TO</Text>
          </View>
          <Text style={styles.addressLine}>{location.address}</Text>
          <Text style={styles.addressSub}>Standard doorstep delivery • 25-35 mins</Text>
        </View>

        {/* Order Summary Snapshot */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>ORDER SUMMARY</Text>
          <Text style={styles.shopSubTitle}>{shopName}</Text>
          {items.map((i) => (
            <View key={i.id} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemName}>
                {i.quantity}x {i.product.name}
              </Text>
              <Text style={styles.summaryItemPrice}>₹{(i.itemPrice * i.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>PAYMENT OPTION</Text>

          {/* COD */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.activePaymentOption]}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <Banknote size={20} color={paymentMethod === 'COD' ? colors.primary : colors.textSecondary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentDesc}>Pay cash to rider upon delivery (Safe & contactless)</Text>
              </View>
            </View>
            {paymentMethod === 'COD' && <CheckCircle size={18} color={colors.primary} />}
          </TouchableOpacity>

          {/* Online UPI */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.activePaymentOption]}
            onPress={() => setPaymentMethod('ONLINE')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <CreditCard size={20} color={paymentMethod === 'ONLINE' ? colors.primary : colors.textSecondary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.paymentTitle}>UPI & Instant Cards</Text>
                <Text style={styles.paymentDesc}>Google Pay, PhonePe, Paytm or Netbanking</Text>
              </View>
            </View>
            {paymentMethod === 'ONLINE' && <CheckCircle size={18} color={colors.primary} />}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Place Order CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderBtnText}>
              Place Order • ₹{totalAmount.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1.2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  addressLine: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    marginBottom: 4,
  },
  addressSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  shopSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryItemName: {
    fontSize: 13,
    color: colors.text,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
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
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: 10,
  },
  activePaymentOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  placeOrderBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
