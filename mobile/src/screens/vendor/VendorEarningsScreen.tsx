import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';
import { APP_CONFIG } from '../../constants/config';
import { Landmark, TrendingUp, ShieldCheck, Mail } from 'lucide-react-native';

export const VendorEarningsScreen: React.FC = () => {
  const grossSalesToday = 3450.0;
  const platformFeeCommission = grossSalesToday * 0.1; // 10%
  const netEarningsToday = grossSalesToday * 0.9; // 90%

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TrendingUp size={20} color={colors.heritageLuxury} />
          <View>
            <Text style={styles.headerTitle}>SETTLEMENT & EARNINGS</Text>
            <Text style={styles.headerSub}>Transparent 90% direct bank payout</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Big Payout Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsSub}>TODAY'S NET VENDOR PAYOUT (90%)</Text>
          <Text style={styles.earningsVal}>₹{netEarningsToday.toFixed(2)}</Text>
          <View style={styles.payoutStatusRow}>
            <ShieldCheck size={14} color={colors.success} />
            <Text style={styles.payoutStatusText}>
              Next Automated T+1 NEFT Transfer: Tomorrow 11:00 AM
            </Text>
          </View>
        </View>

        {/* 4-Way Fair Economics Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>AGGREGATOR VS BHUKKADVERSE COMPARISON</Text>

          <View style={styles.comparisonRow}>
            <Text style={styles.compLabel}>Legacy Aggregators (Swiggy/Zomato)</Text>
            <Text style={[styles.compVal, { color: colors.danger }]}>25% - 35% Cut</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.compLabel}>BhukkadVerse Egalitarian Fee</Text>
            <Text style={[styles.compVal, { color: colors.success }]}>Flat 10% Only</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsBreakdown}>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Today's Gross Kitchen Sales</Text>
              <Text style={styles.statValue}>₹{grossSalesToday.toFixed(2)}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Platform Commission (10%)</Text>
              <Text style={styles.statValue}>-₹{platformFeeCommission.toFixed(2)}</Text>
            </View>
            <View style={[styles.statLine, { marginTop: 4 }]}>
              <Text style={[styles.statLabel, { fontWeight: '800', color: colors.text }]}>
                Your Retained Share (90%)
              </Text>
              <Text style={[styles.statValue, { fontWeight: '900', color: colors.success }]}>
                ₹{netEarningsToday.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank Account Details */}
        <View style={styles.card}>
          <View style={styles.bankHeader}>
            <Landmark size={18} color={colors.primary} />
            <Text style={styles.cardHeading}>REGISTERED SETTLEMENT ACCOUNT</Text>
          </View>
          <Text style={styles.bankName}>HDFC Bank Ltd. (Chandni Chowk Branch)</Text>
          <Text style={styles.bankAcc}>A/C: ************4829 • IFSC: HDFC0000122</Text>
          <Text style={styles.bankVerifyNote}>✓ KYC & FSSAI Verified for Direct Instant Transfers</Text>
        </View>

        {/* Support & Contact */}
        <View style={styles.supportCard}>
          <Mail size={18} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.supportTitle}>Vendor Partner Desk</Text>
            <Text style={styles.supportEmail}>{APP_CONFIG.OFFICIAL_EMAIL}</Text>
          </View>
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
  earningsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    marginBottom: 14,
    alignItems: 'center',
  },
  earningsSub: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.heritageLuxury,
    letterSpacing: 1,
    marginBottom: 4,
  },
  earningsVal: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  payoutStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  payoutStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  compLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  compVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 10,
  },
  statsBreakdown: {
    gap: 4,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  bankAcc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bankVerifyNote: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
    marginTop: 8,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  supportEmail: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
});
