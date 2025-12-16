import React from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusChip } from "@/components/StatusChip";
import { PriorityBadge } from "@/components/PriorityBadge";
import { CommentsSection } from "@/components/CommentsSection";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useIncident, useIncidentHistory, useIncidentComments, useAddIncidentComment } from "@/lib/api";
import { IncidentsStackParamList } from "@/navigation/IncidentsStackNavigator";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function IncidentDetailScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<IncidentsStackParamList, 'IncidentDetail'>>();
  const { t } = useI18n();
  
  const { data: incident, isLoading } = useIncident(route.params.incidentId);
  const { data: history = [] } = useIncidentHistory(route.params.incidentId);
  const { data: comments = [] } = useIncidentComments(route.params.incidentId);
  const addComment = useAddIncidentComment();

  const colors = isDark ? Colors.dark : Colors.light;

  const handleAddComment = async (text: string) => {
    if (!incident) return;
    try {
      await addComment.mutateAsync({ incidentId: incident.id, content: text });
    } catch (error: any) {
      console.error('Failed to add comment:', error);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!incident) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
          {t.incidents.noIncidents}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.idRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              #{incident.id.slice(0, 8)}
            </ThemedText>
            <StatusChip status={incident.status} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            {incident.title}
          </ThemedText>
          <View style={styles.badgeRow}>
            <SeverityBadge severity={incident.severity} />
            <PriorityBadge priority={incident.priority} />
          </View>
        </View>

        {incident.description ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.alerts.detail.description}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {incident.description}
            </ThemedText>
          </View>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Timeline
          </ThemedText>
          <View style={styles.timelineRow}>
            <View style={[styles.timelineIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="clock" size={16} color={colors.primary} />
            </View>
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Created
              </ThemedText>
              <ThemedText type="body">
                {formatRelativeTime(incident.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>

        {history.length > 0 ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.alerts.detail.history}
            </ThemedText>
            {history.map((activity, index) => (
              <View key={activity.id} style={styles.historyItem}>
                <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
                {index < history.length - 1 ? (
                  <View style={[styles.historyLine, { backgroundColor: theme.border }]} />
                ) : null}
                <View style={styles.historyContent}>
                  <ThemedText type="body">
                    {activity.action.replace(/_/g, ' ')}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {formatRelativeTime(activity.createdAt)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <CommentsSection
          comments={comments.map(c => ({
            id: c.id,
            userId: c.userId,
            userName: c.user?.displayName || c.user?.email || 'Unknown',
            text: c.content,
            createdAt: new Date(c.createdAt),
          }))}
          onAddComment={handleAddComment}
        />
      </KeyboardAwareScrollViewCompat>
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
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    paddingLeft: Spacing.sm,
    minHeight: 50,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    zIndex: 1,
  },
  historyLine: {
    position: 'absolute',
    left: Spacing.sm + 4,
    top: 14,
    bottom: 0,
    width: 2,
  },
  historyContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: Spacing.md,
  },
});
