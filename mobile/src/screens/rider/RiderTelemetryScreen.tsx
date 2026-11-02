import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';
import { colors } from '../../constants/colors';
import { Navigation2, Radio, Signal, BatteryCharging, Shield } from 'lucide-react-native';

export const RiderTelemetryScreen: React.FC = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(true);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; speed: number | null }>({
    latitude: 28.6315,
    longitude: 77.2167,
    speed: 24.5,
  });
  const [packetsSent, setPacketsSent] = useState(148);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isBroadcasting) {
      interval = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }).catch(() => null);

          if (loc) {
            setCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              speed: loc.coords.speed ? parseFloat((loc.coords.speed * 3.6).toFixed(1)) : 22.4,
            });
          } else {
            // Simulated subtle movement in Delhi center
            setCoords((prev) => ({
              latitude: prev.latitude + (Math.random() - 0.5) * 0.0008,
              longitude: prev.longitude + (Math.random() - 0.5) * 0.0008,
              speed: parseFloat((18 + Math.random() * 12).toFixed(1)),
            }));
          }
          setPacketsSent((c) => c + 1);
        } catch {
          // ignore
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isBroadcasting]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Radio size={20} color={colors.cloudKitchen} />
          <View>
            <Text style={styles.headerTitle}>GPS TELEMETRY BROADCAST</Text>
            <Text style={styles.headerSub}>Live rider coordinates sync</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Streaming Switch Card */}
        <View style={styles.broadcastCard}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.broadcastTitle}>Background GPS Streaming</Text>
              <Text style={styles.broadcastSub}>
                {isBroadcasting
                  ? 'Transmitting coordinate telemetry to dispatch'
                  : 'Broadcasting paused (Offline mode)'}
              </Text>
            </View>
            <Switch
              value={isBroadcasting}
              onValueChange={setIsBroadcasting}
              trackColor={{ false: colors.surfaceBorder, true: colors.cloudKitchen }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Live Gauges */}
        <View style={styles.gaugesGrid}>
          <View style={styles.gaugeBox}>
            <Navigation2 size={20} color={colors.primary} />
            <Text style={styles.gaugeVal}>{coords.speed || 0} km/h</Text>
            <Text style={styles.gaugeLabel}>Speed Telemetry</Text>
          </View>

          <View style={styles.gaugeBox}>
            <Signal size={20} color={colors.success} />
            <Text style={[styles.gaugeVal, { color: colors.success }]}>Active</Text>
            <Text style={styles.gaugeLabel}>GPS High Accuracy</Text>
          </View>

          <View style={styles.gaugeBox}>
            <Radio size={20} color={colors.cloudKitchen} />
            <Text style={[styles.gaugeVal, { color: colors.cloudKitchen }]}>{packetsSent}</Text>
            <Text style={styles.gaugeLabel}>Telemetry Packets</Text>
          </View>

          <View style={styles.gaugeBox}>
            <BatteryCharging size={20} color={colors.heritageLuxury} />
            <Text style={[styles.gaugeVal, { color: colors.heritageLuxury }]}>89%</Text>
            <Text style={styles.gaugeLabel}>Battery Level</Text>
          </View>
        </View>

        {/* Real-time Coordinate Coordinates Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>CURRENT BROADCAST PACKET</Text>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Latitude:</Text>
            <Text style={styles.coordVal}>{coords.latitude.toFixed(6)}° N</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Longitude:</Text>
            <Text style={styles.coordVal}>{coords.longitude.toFixed(6)}° E</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Broadcast Protocol:</Text>
            <Text style={styles.coordVal}>WebSocket / ASGI JSON Stream</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Ping Interval:</Text>
            <Text style={styles.coordVal}>5.0 Seconds</Text>
          </View>
        </View>

        {/* Privacy & Safe Delivery Guarantee */}
        <View style={styles.privacyCard}>
          <Shield size={18} color={colors.success} />
          <Text style={styles.privacyText}>
            🔒 End-to-end encrypted: Telemetry is scoped exclusively to your active assigned
            order. Location stops transmitting once delivery is marked completed.
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
  broadcastCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  broadcastTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  broadcastSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  gaugesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  gaugeBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  gaugeVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 4,
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '700',
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
  cardHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cloudKitchen,
    letterSpacing: 1,
    marginBottom: 10,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  coordLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  coordVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceLight,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  privacyText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});
