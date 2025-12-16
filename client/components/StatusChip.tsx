import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface StatusChipProps {
  status: string;
  compact?: boolean;
}

export function StatusChip({ status, compact = false }: StatusChipProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const config: Record<string, { color: string; label: string }> = {
    new: { color: colors.info, label: 'New' },
    open: { color: colors.info, label: 'Open' },
    acknowledged: { color: colors.primary, label: 'Acknowledged' },
    in_progress: { color: colors.warning, label: 'In Progress' },
    investigating: { color: colors.warning, label: 'Investigating' },
    identified: { color: colors.warning, label: 'Identified' },
    monitoring: { color: colors.primary, label: 'Monitoring' },
    resolved: { color: colors.success, label: 'Resolved' },
    closed: { color: colors.secondary, label: 'Closed' },
  };

  const { color, label } = config[status] ?? { 
    color: colors.secondary, 
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') 
  };

  return (
    <View style={[styles.chip, { backgroundColor: color + '20' }]}>
      <ThemedText
        type="caption"
        style={[styles.label, { color }, compact && styles.compactLabel]}
      >
        {compact ? label.charAt(0).toUpperCase() : label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  label: {
    fontWeight: '600',
    fontSize: 12,
  },
  compactLabel: {
    fontSize: 10,
  },
});
