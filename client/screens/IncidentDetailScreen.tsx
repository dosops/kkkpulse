import React, { useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusChip } from "@/components/StatusChip";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/lib/store";
import { IncidentsStackParamList } from "@/navigation/IncidentsStackNavigator";
import { formatRelativeTime, formatDate } from "@/lib/utils";

export default function IncidentDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<IncidentsStackParamList, 'IncidentDetail'>>();
  
  const incident = useSyncExternalStore(
    store.subscribe,
    () => store.getIncident(route.params.incidentId),
    () => store.getIncident(route.params.incidentId)
  );

  if (!incident) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Incident not found</ThemedText>
      </ThemedView>
    );
  }

  const categoryLabels: Record<string, string> = {
    hardware: 'Hardware',
    software: 'Software',
    network: 'Network',
    security: 'Security',
    other: 'Other',
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.idRow}>
            <ThemedText type="h3">{incident.id}</ThemedText>
            <StatusChip status={incident.status} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            {incident.title}
          </ThemedText>
          <View style={styles.badgeRow}>
            <SeverityBadge severity={incident.severity} />
            <PriorityBadge priority={incident.priority} />
            <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption">{categoryLabels[incident.category]}</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Description
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {incident.description}
          </ThemedText>
        </View>

        {incident.assigneeName ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Assigned To
            </ThemedText>
            <View style={styles.assigneeRow}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="user" size={20} color={theme.textSecondary} />
              </View>
              <ThemedText type="body">{incident.assigneeName}</ThemedText>
            </View>
          </View>
        ) : null}

        {incident.notes ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Notes
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {incident.notes}
            </ThemedText>
          </View>
        ) : null}

        {Object.keys(incident.customFields).length > 0 ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Custom Fields
            </ThemedText>
            {Object.entries(incident.customFields).map(([key, value]) => (
              <View key={key} style={styles.fieldRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {key}
                </ThemedText>
                <ThemedText type="body">{value}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Timeline
          </ThemedText>
          <View style={styles.timelineItem}>
            <Feather name="plus-circle" size={16} color={theme.textSecondary} />
            <View style={styles.timelineContent}>
              <ThemedText type="body">Incident created</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {formatDate(incident.createdAt)}
              </ThemedText>
            </View>
          </View>
          {incident.updatedAt.getTime() !== incident.createdAt.getTime() ? (
            <View style={styles.timelineItem}>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
              <View style={styles.timelineContent}>
                <ThemedText type="body">Last updated</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {formatRelativeTime(incident.updatedAt)}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
});
