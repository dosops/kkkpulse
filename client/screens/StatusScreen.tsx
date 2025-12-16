import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useStatus } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function StatusScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { t } = useI18n();

  const { data: status, isLoading, refetch, isRefetching } = useStatus();

  const colors = isDark ? Colors.dark : Colors.light;

  const statusColors: Record<string, string> = {
    operational: '#22C55E',
    degraded: '#F59E0B',
    outage: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    operational: t.status.operational,
    degraded: t.status.degraded,
    outage: t.status.majorOutage,
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  const currentStatus = status?.currentStatus || 'operational';
  const activeIncidents = status?.activeIncidents || 0;
  const timeline = status?.timeline || [];

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
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={[styles.statusCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColors[currentStatus] + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[currentStatus] }]} />
            <ThemedText type="h3" style={{ color: statusColors[currentStatus] }}>
              {statusLabels[currentStatus] || currentStatus}
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
            {t.status.last30Days}
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.severityCritical + '20' }]}>
              <Feather name="alert-circle" size={24} color={colors.severityCritical} />
            </View>
            <ThemedText type="h2">{activeIncidents}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              {t.status.openIncidents}
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={24} color={colors.success} />
            </View>
            <ThemedText type="h2">{timeline.filter(d => d.status === 'operational').length}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Days Healthy
            </ThemedText>
          </View>
        </View>

        <View style={[styles.timelineCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.status.last30Days}
          </ThemedText>
          <View style={styles.timelineGrid}>
            {timeline.map((day, index) => {
              const dayColor = statusColors[day.status] || statusColors.operational;
              return (
                <View
                  key={day.date || index}
                  style={[styles.timelineDay, { backgroundColor: dayColor }]}
                />
              );
            })}
          </View>
          <View style={styles.timelineLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: statusColors.operational }]} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Operational
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: statusColors.degraded }]} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Degraded
              </ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: statusColors.outage }]} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Outage
              </ThemedText>
            </View>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
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
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
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
  timelineCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  timelineDay: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
