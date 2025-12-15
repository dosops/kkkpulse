import React, { useState, useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusChip } from "@/components/StatusChip";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store, IncidentCategory } from "@/lib/store";
import { IncidentsStackParamList } from "@/navigation/IncidentsStackNavigator";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function IncidentDetailScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<IncidentsStackParamList, 'IncidentDetail'>>();
  const { t } = useI18n();
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [consequences, setConsequences] = useState('');
  
  const incident = useSyncExternalStore(
    store.subscribe,
    () => store.getIncident(route.params.incidentId),
    () => store.getIncident(route.params.incidentId)
  );

  if (!incident) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{t.incidents.noIncidents}</ThemedText>
      </ThemedView>
    );
  }

  const categoryLabels: Record<IncidentCategory, string> = {
    hardware: t.incidents.categories.hardware,
    software: t.incidents.categories.software,
    network: t.incidents.categories.network,
    security: t.incidents.categories.security,
    other: t.incidents.categories.other,
  };

  const canClose = incident.status !== 'closed';

  const handleCloseIncident = () => {
    if (endTime.getTime() <= startTime.getTime()) {
      Alert.alert(t.common.error, t.incidents.closeModal.timeValidationError);
      return;
    }
    store.closeIncident(incident.id, {
      startTime,
      endTime,
      consequences,
    });
    setShowCloseModal(false);
    setConsequences('');
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString();
  };

  const colors = isDark ? Colors.dark : Colors.light;

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
            {t.alerts.detail.description}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {incident.description}
          </ThemedText>
        </View>

        {incident.assigneeName ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.incidents.assignee}
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
              {t.incidents.notes}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {incident.notes}
            </ThemedText>
          </View>
        ) : null}

        {Object.keys(incident.customFields).length > 0 ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.incidents.customFields}
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

        {incident.status === 'closed' && incident.consequences ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.incidents.closeModal.consequences}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {incident.consequences}
            </ThemedText>
            {incident.incidentStartTime && incident.incidentEndTime ? (
              <View style={styles.timeRange}>
                <View style={styles.timeRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t.incidents.closeModal.startTime}:
                  </ThemedText>
                  <ThemedText type="body">
                    {formatDateTime(incident.incidentStartTime)}
                  </ThemedText>
                </View>
                <View style={styles.timeRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t.incidents.closeModal.endTime}:
                  </ThemedText>
                  <ThemedText type="body">
                    {formatDateTime(incident.incidentEndTime)}
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.alerts.detail.history}
          </ThemedText>
          <View style={styles.timelineItem}>
            <Feather name="plus-circle" size={16} color={theme.textSecondary} />
            <View style={styles.timelineContent}>
              <ThemedText type="body">{t.alerts.detail.incidentRegistered}</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {formatDate(incident.createdAt)}
              </ThemedText>
            </View>
          </View>
          {incident.updatedAt.getTime() !== incident.createdAt.getTime() ? (
            <View style={styles.timelineItem}>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
              <View style={styles.timelineContent}>
                <ThemedText type="body">{t.activity.types.incidentUpdated}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {formatRelativeTime(incident.updatedAt)}
                </ThemedText>
              </View>
            </View>
          ) : null}
          {incident.closedAt ? (
            <View style={styles.timelineItem}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <View style={styles.timelineContent}>
                <ThemedText type="body">{t.activity.types.incidentClosed}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {formatRelativeTime(incident.closedAt)}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>

        {canClose ? (
          <Button
            onPress={() => {
              setStartTime(incident.createdAt);
              setEndTime(new Date());
              setShowCloseModal(true);
            }}
            style={styles.closeButton}
          >
            {t.incidents.close}
          </Button>
        ) : null}
      </ScrollView>

      <Modal
        visible={showCloseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCloseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h3" style={styles.modalTitle}>
              {t.incidents.closeModal.title}
            </ThemedText>

            <View style={styles.formGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t.incidents.closeModal.startTime}
              </ThemedText>
              <View style={[styles.dateDisplay, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="calendar" size={18} color={theme.textSecondary} />
                <ThemedText type="body">{formatDateTime(startTime)}</ThemedText>
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t.incidents.closeModal.endTime}
              </ThemedText>
              <View style={[styles.dateDisplay, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="calendar" size={18} color={theme.textSecondary} />
                <ThemedText type="body">{formatDateTime(endTime)}</ThemedText>
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t.incidents.closeModal.consequences}
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={consequences}
                onChangeText={setConsequences}
                placeholder={t.incidents.closeModal.consequencesPlaceholder}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowCloseModal(false)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="body">{t.incidents.closeModal.cancel}</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleCloseIncident}
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF' }}>
                  {t.incidents.closeModal.confirm}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  timeRange: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  closeButton: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});
