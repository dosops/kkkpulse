import React, { useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

function formatDowntime(minutes: number, t: ReturnType<typeof useI18n>['t']) {
  if (minutes === 0) {
    return t.status.noDowntime;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}${t.status.hours} ${remainingMinutes}${t.status.minutes}`;
  }
  if (hours > 0) {
    return `${hours}${t.status.hours}`;
  }
  return `${remainingMinutes}${t.status.minutes}`;
}

function getSystemStatus(openCount: number, availabilityPercent: number): 'operational' | 'degraded' | 'majorOutage' {
  if (openCount === 0 && availabilityPercent >= 99.9) {
    return 'operational';
  }
  if (availabilityPercent >= 95) {
    return 'degraded';
  }
  return 'majorOutage';
}

export default function StatusScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { t } = useI18n();

  const metrics = useSyncExternalStore(
    store.subscribe,
    store.getStatusMetrics,
    store.getStatusMetrics
  );

  const colors = isDark ? Colors.dark : Colors.light;
  const systemStatus = getSystemStatus(metrics.openIncidentsCount, metrics.availabilityPercent);

  const statusColors = {
    operational: '#22C55E',
    degraded: '#F59E0B',
    majorOutage: '#EF4444',
  };

  const statusLabels = {
    operational: t.status.operational,
    degraded: t.status.degraded,
    majorOutage: t.status.majorOutage,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <View style={[styles.statusCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColors[systemStatus] + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[systemStatus] }]} />
            <ThemedText type="h3" style={{ color: statusColors[systemStatus] }}>
              {statusLabels[systemStatus]}
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
            {t.status.last30Days}
          </ThemedText>
        </View>

        <View style={[styles.metricsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.availabilityRow}>
            <ThemedText type="h4">{t.status.availability}</ThemedText>
            <ThemedText type="h1" style={{ color: colors.primary }}>
              {metrics.availabilityPercent.toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={[styles.metricsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.metricRow}>
            <View style={[styles.metricIcon, { backgroundColor: colors.severityCritical + '20' }]}>
              <Feather name="clock" size={20} color={colors.severityCritical} />
            </View>
            <View style={styles.metricContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t.status.totalDowntime}
              </ThemedText>
              <ThemedText type="h3">
                {formatDowntime(metrics.totalDowntimeMinutes, t)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="file-text" size={24} color={colors.primary} />
            </View>
            <ThemedText type="h2">{metrics.totalIncidents}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              {t.status.totalIncidents}
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
              <Feather name="alert-circle" size={24} color={colors.warning} />
            </View>
            <ThemedText type="h2">{metrics.openIncidentsCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              {t.status.openIncidents}
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={24} color={colors.success} />
            </View>
            <ThemedText type="h2">{metrics.resolvedIncidentsCount}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              {t.status.resolvedIncidents}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricsCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  availabilityRow: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
