import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusChip } from "@/components/StatusChip";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Alert } from "@/lib/store";
import { formatRelativeTime } from "@/lib/utils";

interface AlertCardProps {
  alert: Alert;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlertCard({ alert, onPress }: AlertCardProps) {
  const { theme, isDark } = useTheme();
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
                {alert.source === 'manual' ? 'Manual' : 'System'}
              </ThemedText>
            </View>
            <StatusChip status={alert.status} compact />
          </View>
        </View>
        {alert.imageUri ? (
          <Image
            source={{ uri: alert.imageUri }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : null}
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
});
