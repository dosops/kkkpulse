import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Priority } from "@/lib/api";

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const priorityColors: Record<Priority, string> = {
    critical: colors.severityCritical,
    high: colors.severityHigh,
    medium: colors.severityMedium,
    low: colors.severityLow,
  };

  const priorityLabels: Record<Priority, string> = {
    critical: 'P0',
    high: 'P1',
    medium: 'P2',
    low: 'P3',
  };

  const color = priorityColors[priority];

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <ThemedText type="caption" style={[styles.label, { color }]}>
        {priorityLabels[priority]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  label: {
    fontWeight: '700',
    fontSize: 12,
  },
});
