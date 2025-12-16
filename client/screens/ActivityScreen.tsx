import React from "react";
import {
  View,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useActivities, Activity } from "@/lib/api";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Section {
  title: string;
  data: Activity[];
}

function getActivityIcon(action: string) {
  switch (action) {
    case 'alert_created':
      return 'bell';
    case 'alert_acknowledged':
    case 'alert_taken':
      return 'briefcase';
    case 'alert_inspected':
      return 'search';
    case 'alert_resolved':
      return 'check-circle';
    case 'incident_created':
    case 'incident_registered':
      return 'file-plus';
    case 'incident_updated':
      return 'edit-2';
    case 'incident_resolved':
    case 'incident_closed':
      return 'check-square';
    case 'comment_added':
      return 'message-circle';
    default:
      return 'activity';
  }
}

function getActivityLabel(action: string, t: any): string {
  switch (action) {
    case 'alert_created':
      return t.activity.types.alertCreated;
    case 'alert_acknowledged':
    case 'alert_taken':
      return t.activity.types.alertTaken;
    case 'alert_inspected':
      return t.activity.types.alertInspected;
    case 'alert_resolved':
      return 'resolved alert';
    case 'incident_created':
    case 'incident_registered':
      return t.activity.types.incidentRegistered;
    case 'incident_updated':
      return t.activity.types.incidentUpdated;
    case 'incident_resolved':
    case 'incident_closed':
      return t.activity.types.incidentClosed;
    case 'comment_added':
      return 'added comment';
    default:
      return action.replace(/_/g, ' ');
  }
}

export default function ActivityScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: activities = [], isLoading, refetch, isRefetching } = useActivities(50);

  const groupedActivities = activities.reduce<Section[]>((acc, activity) => {
    const dateKey = formatDate(activity.createdAt);
    const existingSection = acc.find(s => s.title === dateKey);
    
    if (existingSection) {
      existingSection.data.push(activity);
    } else {
      acc.push({ title: dateKey, data: [activity] });
    }
    
    return acc;
  }, []);

  const colors = isDark ? Colors.dark : Colors.light;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

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
                name={getActivityIcon(item.action) as any}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.activityContent}>
              <ThemedText type="body">
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {item.user?.displayName || item.user?.email || 'System'}
                </ThemedText>
                {' '}{getActivityLabel(item.action, t)}
              </ThemedText>
              {item.details ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.details}
                </ThemedText>
              ) : null}
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {formatRelativeTime(item.createdAt)}
              </ThemedText>
            </View>
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.sm, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="activity" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t.activity.noActivity}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
});
