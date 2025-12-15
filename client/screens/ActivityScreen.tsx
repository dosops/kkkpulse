import React, { useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  SectionList,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store, ActivityItem } from "@/lib/store";
import { formatRelativeTime, formatDate, isSameDay } from "@/lib/utils";

interface Section {
  title: string;
  data: ActivityItem[];
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'alert_created':
      return 'bell';
    case 'alert_taken':
      return 'briefcase';
    case 'alert_inspected':
      return 'search';
    case 'incident_registered':
      return 'file-plus';
    case 'incident_updated':
      return 'edit-2';
    default:
      return 'activity';
  }
}

function getActivityLabel(type: ActivityItem['type']) {
  switch (type) {
    case 'alert_created':
      return 'created alert';
    case 'alert_taken':
      return 'took alert to work';
    case 'alert_inspected':
      return 'inspected alert';
    case 'incident_registered':
      return 'registered incident';
    case 'incident_updated':
      return 'updated incident';
    default:
      return 'performed action';
  }
}

export default function ActivityScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const activities = useSyncExternalStore(
    store.subscribe,
    store.getActivities,
    store.getActivities
  );

  const groupedActivities = activities.reduce<Section[]>((acc, activity) => {
    const dateKey = formatDate(activity.timestamp);
    const existingSection = acc.find(s => s.title === dateKey);
    
    if (existingSection) {
      existingSection.data.push(activity);
    } else {
      acc.push({ title: dateKey, data: [activity] });
    }
    
    return acc;
  }, []);

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={groupedActivities}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {section.title}
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.activityItem, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Feather
                name={getActivityIcon(item.type)}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.activityContent}>
              <ThemedText type="body">
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {item.userName}
                </ThemedText>
                {' '}{getActivityLabel(item.type)}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.targetTitle}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {formatRelativeTime(item.timestamp)}
              </ThemedText>
            </View>
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="activity" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              No activity yet
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});
