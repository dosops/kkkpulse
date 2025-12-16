import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Severity } from "@/lib/api";

interface SeveritySelectorProps {
  value: Severity;
  onChange: (severity: Severity) => void;
}

const severities: { value: Severity; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'low', label: 'Low', icon: 'info' },
  { value: 'medium', label: 'Medium', icon: 'alert-circle' },
  { value: 'high', label: 'High', icon: 'alert-triangle' },
  { value: 'critical', label: 'Critical', icon: 'alert-octagon' },
];

export function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const getColor = (severity: Severity) => {
    return {
      low: colors.severityLow,
      medium: colors.severityMedium,
      high: colors.severityHigh,
      critical: colors.severityCritical,
    }[severity];
  };

  return (
    <View style={styles.container}>
      {severities.map((s) => {
        const isSelected = value === s.value;
        const color = getColor(s.value);

        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? color + '20' : theme.backgroundSecondary,
                borderColor: isSelected ? color : 'transparent',
              },
            ]}
          >
            <Feather
              name={s.icon}
              size={18}
              color={isSelected ? color : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={{ color: isSelected ? color : theme.text, fontWeight: isSelected ? '600' : '400' }}
            >
              {s.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.xs,
  },
});
