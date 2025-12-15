import React, { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SectionList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AlertCard } from "@/components/AlertCard";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store, Alert, AlertStatus, AlertGroupBy } from "@/lib/store";
import { AlertsStackParamList } from "@/navigation/AlertsStackNavigator";
import { useI18n } from "@/lib/i18n";

type FilterStatus = AlertStatus | 'all';

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

export default function AlertsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<AlertsStackParamList>>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const colors = isDark ? Colors.dark : Colors.light;

  const alerts = useSyncExternalStore(
    store.subscribe,
    store.getAlerts,
    store.getAlerts
  );

  const groupBy = useSyncExternalStore(
    store.subscribe,
    store.getAlertGroupBy,
    store.getAlertGroupBy
  );

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.status === filter);

  const groupedSections = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups: Record<string, Alert[]> = {};
    
    filteredAlerts.forEach(alert => {
      let key: string;
      if (groupBy === 'severity') {
        key = alert.severity;
      } else if (groupBy === 'status') {
        key = alert.status;
      } else {
        if (isToday(alert.createdAt)) {
          key = 'today';
        } else if (isYesterday(alert.createdAt)) {
          key = 'yesterday';
        } else {
          key = 'older';
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
    });

    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const statusOrder = ['new', 'in_progress', 'resolved'];
    const timeOrder = ['today', 'yesterday', 'older'];
    
    let order: string[];
    if (groupBy === 'severity') order = severityOrder;
    else if (groupBy === 'status') order = statusOrder;
    else order = timeOrder;

    return order
      .filter(key => groups[key] && groups[key].length > 0)
      .map(key => ({
        title: getSectionTitle(key, groupBy, t),
        data: groups[key],
      }));
  }, [filteredAlerts, groupBy, t]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleAlertPress = (alert: Alert) => {
    navigation.navigate('AlertDetail', { alertId: alert.id });
  };

  const handleGroupByChange = (newGroupBy: AlertGroupBy) => {
    store.setAlertGroupBy(newGroupBy);
  };

  const filters: { label: string; value: FilterStatus }[] = [
    { label: t.alerts.all, value: 'all' },
    { label: t.alerts.new, value: 'new' },
    { label: t.alerts.inProgress, value: 'in_progress' },
    { label: t.alerts.resolved, value: 'resolved' },
  ];

  const groupByOptions: { label: string; value: AlertGroupBy }[] = [
    { label: t.groupBy.none, value: 'none' },
    { label: t.groupBy.severity, value: 'severity' },
    { label: t.groupBy.status, value: 'status' },
    { label: t.groupBy.time, value: 'time' },
  ];

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="bell-off" size={48} color={theme.textSecondary} />
      <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t.alerts.noAlerts}
      </ThemedText>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundDefault }]}>
      <ThemedText type="h4" style={styles.sectionTitle}>
        {section.title}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.controlsContainer, { paddingTop: headerHeight + Spacing.sm }]}>
        <View style={styles.filterContainer}>
          {filters.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.value
                    ? colors.primary
                    : theme.backgroundSecondary,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.filterText,
                  { color: filter === f.value ? '#FFFFFF' : theme.text },
                ]}
              >
                {f.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={styles.groupByContainer}>
          <ThemedText type="caption" style={[styles.groupByLabel, { color: theme.textSecondary }]}>
            {t.groupBy.label}:
          </ThemedText>
          {groupByOptions.map((g) => (
            <Pressable
              key={g.value}
              onPress={() => handleGroupByChange(g.value)}
              style={[
                styles.groupByChip,
                {
                  backgroundColor: groupBy === g.value
                    ? colors.primary + '20'
                    : 'transparent',
                  borderColor: groupBy === g.value ? colors.primary : theme.backgroundTertiary,
                },
              ]}
            >
              <ThemedText
                type="caption"
                style={[
                  styles.groupByText,
                  { color: groupBy === g.value ? colors.primary : theme.textSecondary },
                ]}
              >
                {g.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {groupBy === 'none' ? (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl + 80 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyComponent}
        />
      ) : (
        <SectionList
          sections={groupedSections || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
          )}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl + 80 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyComponent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </ThemedView>
  );
}

function getSectionTitle(key: string, groupBy: AlertGroupBy, t: any): string {
  if (groupBy === 'severity') {
    const severityMap: Record<string, string> = {
      critical: t.severity.critical,
      high: t.severity.high,
      medium: t.severity.medium,
      low: t.severity.low,
    };
    return severityMap[key] || key;
  }
  if (groupBy === 'status') {
    const statusMap: Record<string, string> = {
      new: t.alerts.new,
      in_progress: t.alerts.inProgress,
      resolved: t.alerts.resolved,
    };
    return statusMap[key] || key;
  }
  const timeMap: Record<string, string> = {
    today: t.groupBy.today,
    yesterday: t.groupBy.yesterday,
    older: t.groupBy.older,
  };
  return timeMap[key] || key;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  filterText: {
    fontWeight: '500',
  },
  groupByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  groupByLabel: {
    marginRight: Spacing.xs,
  },
  groupByChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  groupByText: {
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
  },
  separator: {
    height: Spacing.sm,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
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
