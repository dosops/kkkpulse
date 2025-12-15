import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Priority } from "@/lib/store";

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const priorityColors: Record<Priority, string> = {
    P0: colors.severityCritical,
    P1: colors.severityHigh,
    P2: colors.severityMedium,
    P3: colors.info,
    P4: colors.secondary,
  };

  const color = priorityColors[priority];

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <ThemedText type="caption" style={[styles.label, { color }]}>
        {priority}
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
