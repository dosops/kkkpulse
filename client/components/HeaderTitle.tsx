import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth";

export function HeaderTitle() {
  const { isDark, theme } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { project } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Feather name="bell" size={16} color="#FFFFFF" />
        </View>
        <ThemedText type="h4">AlertHub</ThemedText>
      </View>
      {project ? (
        <View style={[styles.projectBadge, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {project.name}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  projectBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
});
