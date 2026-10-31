import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { APP_CONFIG } from '../../constants/config';
import { Wallet, ShieldAlert, CheckCircle, ArrowDownCircle, Mail } from 'lucide-react-native';

export const RiderFloatWalletScreen: React.FC = () => {
  const [cashInHand, setCashInHand] = useState<number>(650.0);
  const [completedDeliveries, setCompletedDeliveries] = useState<number>(6);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');

  const maxFloat = APP_CONFIG.MAX_RIDER_COD_CASH_FLOAT;
  const isLocked = cashInHand >= maxFloat;
  const floatPercentage = Math.min((cashInHand / maxFloat) * 100, 100);
  const todayWages = completedDeliveries * APP_CONFIG.RIDER_WAGE_PER_DELIVERY;

  const handleDepositCash = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash deposit amount.');
      return;
    }
    if (amount > cashInHand) {
      Alert.alert('Amount Exceeds Float', `You only hold ₹${cashInHand.toFixed(2)} cash in hand.`);
      return;
    }
    if (!utrNumber.trim()) {
      Alert.alert('Missing UTR', 'Please enter your UPI / Bank deposit UTR or reference number.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }

    const nextCash = Math.max(0, cashInHand - amount);
    setCashInHand(nextCash);
    setDepositAmount('');
    setUtrNumber('');

    Alert.alert(
      'Deposit Submitted! 💸',
      `₹${amount.toFixed(2)} submitted under UTR ${utrNumber}. Your cash float has been reconciled to ₹${nextCash.toFixed(2)}.`
    );
  };

  const getGaugeColor = () => {
    if (isLocked) return colors.danger;
    if (floatPercentage >= 75) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Wallet size={20} color={colors.primary} />
          <View>
            <Text style={styles.headerTitle}>CASH FLOAT & WAGES WALLET</Text>
            <Text style={styles.headerSub}>Anti-theft ₹1,500 float threshold</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Anti-Theft Float Gauge Card */}
        <View style={[styles.card, isLocked && styles.cardLocked]}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeTitle}>COD CASH-IN-HAND FLOAT</Text>
            <Text style={[styles.gaugeStatus, { color: getGaugeColor() }]}>
              {isLocked ? 'FLOAT LOCKED' : 'HEALTHY FLOAT'}
            </Text>
          </View>

          <Text style={styles.cashAmount}>₹{cashInHand.toFixed(2)}</Text>
          <Text style={styles.cashSub}>Maximum allowed float: ₹{maxFloat.toFixed(2)}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${floatPercentage}%`, backgroundColor: getGaugeColor() },
              ]}
            />
          </View>

          {isLocked ? (
            <View style={styles.alertBox}>
              <ShieldAlert size={16} color={colors.danger} />
              <Text style={styles.alertText}>
                ⚠️ Virtual float limit reached. Deposit collected COD cash immediately to unlock
                delivery acceptance.
              </Text>
            </View>
          ) : (
            <Text style={styles.safeFloatText}>
              Remaining buffer before lock: ₹{(maxFloat - cashInHand).toFixed(2)}
            </Text>
          )}
        </View>

        {/* Guaranteed Wages Card */}
        <View style={styles.wagesCard}>
          <View style={styles.wagesHeader}>
            <CheckCircle size={18} color={colors.success} />
            <Text style={styles.wagesTitle}>GUARANTEED DELIVERY WAGES</Text>
          </View>

          <View style={styles.wagesRow}>
            <View>
              <Text style={styles.wagesVal}>₹{todayWages.toFixed(2)}</Text>
              <Text style={styles.wagesSub}>
                {completedDeliveries} completed deliveries × ₹{APP_CONFIG.RIDER_WAGE_PER_DELIVERY}
              </Text>
            </View>
            <View style={styles.wagesPill}>
              <Text style={styles.wagesPillText}>100% Free Transfer</Text>
            </View>
          </View>
        </View>

        {/* Deposit Cash Form */}
        <View style={styles.card}>
          <View style={styles.depositHeader}>
            <ArrowDownCircle size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>DEPOSIT COD CASH TO CLEAR FLOAT</Text>
          </View>

          <Text style={styles.depositInstructions}>
            Scan the BhukkadVerse merchant QR or transfer via UPI to{' '}
            <Text style={{ fontWeight: '800', color: colors.primary }}>
              bhukkadverse@icici
            </Text>
            , then submit the UTR reference below.
          </Text>

          <TextInput
            placeholder="Deposit Amount (₹)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={depositAmount}
            onChangeText={setDepositAmount}
            style={styles.input}
          />

          <TextInput
            placeholder="UPI Reference / UTR Number (12 digits)"
            placeholderTextColor={colors.textMuted}
            value={utrNumber}
            onChangeText={setUtrNumber}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.depositBtn}
            onPress={handleDepositCash}
            activeOpacity={0.85}
          >
            <Text style={styles.depositBtnText}>Submit Deposit & Reset Float</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.supportBox}>
          <Mail size={16} color={colors.textSecondary} />
          <Text style={styles.supportText}>
            Fleet Support Desk: {APP_CONFIG.OFFICIAL_EMAIL}
          </Text>
        </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
  },
  cardLocked: {
    borderColor: colors.danger,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gaugeTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  gaugeStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  cashAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 4,
  },
  cashSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  alertText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '700',
    flex: 1,
  },
  safeFloatText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  wagesCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 14,
  },
  wagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  wagesTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.success,
    letterSpacing: 1,
  },
  wagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wagesVal: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
  },
  wagesSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  wagesPill: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  wagesPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },
  depositHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  depositInstructions: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  depositBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  depositBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  supportText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
