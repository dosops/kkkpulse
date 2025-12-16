import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Alert } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface AlertCardProps {
  alert: Alert;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AlertStatusIndicator({ alert, colors, t }: { alert: Alert; colors: typeof Colors.light; t: any }) {
  if (alert.status === 'resolved') {
    return (
      <View style={[styles.statusRow, { backgroundColor: colors.success + '20' }]}>
        <Feather name="check-circle" size={14} color={colors.success} />
        <ThemedText type="caption" style={{ color: colors.success }}>
          {t.alerts.resolved}
        </ThemedText>
      </View>
    );
  }
  
  if (alert.status === 'in_progress' || alert.status === 'acknowledged') {
    return (
      <View style={[styles.statusRow, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="user" size={14} color={colors.primary} />
        <ThemedText type="caption" style={{ color: colors.primary }}>
          {t.alerts.inProgress}
        </ThemedText>
      </View>
    );
  }
  
  return (
    <View style={[styles.statusRow, { backgroundColor: colors.severityHigh + '20' }]}>
      <Feather name="alert-circle" size={14} color={colors.severityHigh} />
      <ThemedText type="caption" style={{ color: colors.severityHigh }}>
        {t.alerts.status.newNotReviewed}
      </ThemedText>
    </View>
  );
}

export function AlertCard({ alert, onPress }: AlertCardProps) {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const scale = useSharedValue(1);
  const colors = isDark ? Colors.dark : Colors.light;

  const severityColor = {
    critical: colors.severityCritical,
    high: colors.severityHigh,
    medium: colors.severityMedium,
    low: colors.severityLow,
  }[alert.severity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sourceLabel = alert.source === 'manual' ? t.alerts.source.manual : alert.source;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={[styles.severityBar, { backgroundColor: severityColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="h4" numberOfLines={2} style={styles.title}>
              {alert.title}
            </ThemedText>
            <SeverityBadge severity={alert.severity} compact />
          </View>
          <View style={styles.meta}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatRelativeTime(alert.createdAt)}
            </ThemedText>
            <View style={[styles.sourceBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption">
                {sourceLabel}
              </ThemedText>
            </View>
          </View>
          <AlertStatusIndicator alert={alert} colors={colors} t={t} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  severityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
});
