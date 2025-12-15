import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { OrganizationSelector } from "@/components/OrganizationSelector";

export function HeaderTitle() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Feather name="bell" size={16} color="#FFFFFF" />
        </View>
        <ThemedText type="h4">AlertHub</ThemedText>
      </View>
      <OrganizationSelector />
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
});
