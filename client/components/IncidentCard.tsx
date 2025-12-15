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
import { StatusChip } from "@/components/StatusChip";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Incident } from "@/lib/store";
import { formatRelativeTime } from "@/lib/utils";

interface IncidentCardProps {
  incident: Incident;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

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
      <View style={styles.header}>
        <ThemedText type="h4" style={{ color: theme.textSecondary }}>
          {incident.id}
        </ThemedText>
        <StatusChip status={incident.status} />
      </View>

      <ThemedText type="body" numberOfLines={2} style={styles.title}>
        {incident.title}
      </ThemedText>

      <View style={styles.badges}>
        <SeverityBadge severity={incident.severity} compact />
        <View style={[styles.priorityBadge, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="caption" style={{ fontWeight: '600' }}>
            {incident.priority}
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        {incident.assigneeName ? (
          <View style={styles.assignee}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="user" size={12} color={theme.textSecondary} />
            </View>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {incident.assigneeName}
            </ThemedText>
          </View>
        ) : null}
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {formatRelativeTime(incident.updatedAt)}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
