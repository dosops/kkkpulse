import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SectionList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
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
import { useAlerts, Alert, AlertStatus } from "@/lib/api";
import { AlertsStackParamList } from "@/navigation/AlertsStackNavigator";
import { useI18n } from "@/lib/i18n";

type FilterStatus = AlertStatus | 'all';
type AlertGroupBy = 'none' | 'severity' | 'status' | 'time';

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isYesterday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function getSectionTitle(key: string, groupBy: AlertGroupBy, t: any): string {
  if (groupBy === 'severity') {
    return t.severity[key] || key;
  } else if (groupBy === 'status') {
    return t.alerts[key] || key;
  } else {
    if (key === 'today') return t.groupBy.today;
    if (key === 'yesterday') return t.groupBy.yesterday;
    return t.groupBy.older;
  }
}

export default function AlertsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<AlertsStackParamList>>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [groupBy, setGroupBy] = useState<AlertGroupBy>('none');
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: alerts = [], isLoading, refetch, isRefetching } = useAlerts();

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
    const statusOrder = ['new', 'acknowledged', 'in_progress', 'resolved'];
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

  const handleAlertPress = (alert: Alert) => {
    navigation.navigate('AlertDetail', { alertId: alert.id });
  };

  const handleGroupByChange = (newGroupBy: AlertGroupBy) => {
    setGroupBy(newGroupBy);
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filterRow}>
        {filters.map(f => (
          <Pressable
            key={f.value}
            style={[
              styles.filterChip,
              { backgroundColor: filter === f.value ? colors.primary : theme.backgroundSecondary }
            ]}
            onPress={() => setFilter(f.value)}
          >
            <ThemedText
              type="small"
              style={{ color: filter === f.value ? '#fff' : theme.text }}
            >
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.groupByRow}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>
          {t.groupBy.label}:
        </ThemedText>
        {groupByOptions.map(opt => (
          <Pressable
            key={opt.value}
            style={[
              styles.groupChip,
              { 
                backgroundColor: groupBy === opt.value ? colors.primary + '20' : 'transparent',
                borderColor: groupBy === opt.value ? colors.primary : theme.border,
              }
            ]}
            onPress={() => handleGroupByChange(opt.value)}
          >
            <ThemedText
              type="caption"
              style={{ color: groupBy === opt.value ? colors.primary : theme.textSecondary }}
            >
              {opt.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (groupBy !== 'none' && groupedSections) {
    return (
      <ThemedView style={styles.container}>
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
              <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: '600' }}>
                {section.title} ({section.data.length})
              </ThemedText>
            </View>
          )}
          renderItem={({ item }) => (
            <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerHeight + Spacing.sm, paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.sm, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t.alerts.noAlerts}
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  groupByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  groupChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
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
