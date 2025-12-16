import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Severity } from "@/lib/api";

interface SeverityBadgeProps {
  severity: Severity;
  compact?: boolean;
}

export function SeverityBadge({ severity, compact = false }: SeverityBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const config = {
    critical: {
      color: colors.severityCritical,
      icon: 'alert-octagon' as const,
      label: 'Critical',
    },
    high: {
      color: colors.severityHigh,
      icon: 'alert-triangle' as const,
      label: 'High',
    },
    medium: {
      color: colors.severityMedium,
      icon: 'alert-circle' as const,
      label: 'Medium',
    },
    low: {
      color: colors.severityLow,
      icon: 'info' as const,
      label: 'Low',
    },
  }[severity];

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: config.color + '20' }]}>
        <Feather name={config.icon} size={12} color={config.color} />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
      <Feather name={config.icon} size={14} color={config.color} />
      <ThemedText type="caption" style={[styles.label, { color: config.color }]}>
        {config.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  compactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
});
