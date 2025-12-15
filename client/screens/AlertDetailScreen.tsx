import React, { useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusChip } from "@/components/StatusChip";
import { CommentsSection } from "@/components/CommentsSection";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/lib/store";
import { AlertsStackParamList } from "@/navigation/AlertsStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function AlertDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const route = useRoute<RouteProp<AlertsStackParamList, 'AlertDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const alert = useSyncExternalStore(
    store.subscribe,
    () => store.getAlert(route.params.alertId),
    () => store.getAlert(route.params.alertId)
  );

  if (!alert) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>{t.common.alertNotFound}</ThemedText>
      </ThemedView>
    );
  }

  const handleTakeToWork = () => {
    store.takeAlertToWork(alert.id);
    Alert.alert(t.common.success, t.alerts.detail.alertAssigned);
  };

  const handleInspect = () => {
    store.inspectAlert(alert.id);
    Alert.alert(t.common.success, t.alerts.detail.alertInspected);
  };

  const handleRegisterIncident = () => {
    navigation.navigate('RegisterIncident', { alertId: alert.id });
  };

  const severityColors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 80 + tabBarHeight },
        ]}
      >
        <View style={styles.header}>
          <SeverityBadge severity={alert.severity} />
          <ThemedText type="h2" style={styles.title}>
            {alert.title}
          </ThemedText>
          <View style={styles.meta}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formatRelativeTime(alert.createdAt)}
            </ThemedText>
            <View style={[styles.sourceBadge, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption">
                {alert.source === 'manual' ? t.alerts.source.manual : t.alerts.source.system}
              </ThemedText>
            </View>
            <StatusChip status={alert.status} />
          </View>
        </View>

        {alert.imageUri ? (
          <View style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Image
              source={{ uri: alert.imageUri }}
              style={styles.image}
              contentFit="contain"
            />
          </View>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.alerts.detail.description}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {alert.description}
          </ThemedText>

          {alert.metadata && Object.keys(alert.metadata).length > 0 ? (
            <View style={styles.metadataSection}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                {t.alerts.detail.details}
              </ThemedText>
              {Object.entries(alert.metadata).map(([key, value]) => (
                <View key={key} style={styles.metadataRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {key}
                  </ThemedText>
                  <ThemedText type="body">{value}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {alert.actions.length > 0 ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.alerts.detail.history}
            </ThemedText>
            {alert.actions.map((action, index) => (
              <View key={action.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: severityColors.primary }]} />
                {index < alert.actions.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                ) : null}
                <View style={styles.timelineContent}>
                  <ThemedText type="body">
                    {action.type === 'taken_to_work' && `${t.alerts.detail.takenToWork} - ${action.userName}`}
                    {action.type === 'inspected' && `${t.alerts.detail.inspected} - ${action.userName}`}
                    {action.type === 'incident_registered' && `${t.alerts.detail.incidentRegistered} - ${action.userName}`}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {formatRelativeTime(action.timestamp)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <CommentsSection
          comments={alert.comments}
          onAddComment={(text) => store.addAlertComment(alert.id, text)}
        />
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.backgroundRoot,
            bottom: tabBarHeight,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={handleTakeToWork}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: severityColors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="briefcase" size={18} color="#FFFFFF" />
          <ThemedText type="small" style={styles.actionButtonText}>
            {t.alerts.actions.takeToWork}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleInspect}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: severityColors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="search" size={18} color="#FFFFFF" />
          <ThemedText type="small" style={styles.actionButtonText}>
            {t.alerts.actions.inspect}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleRegisterIncident}
          style={({ pressed }) => [
            styles.actionButton,
            styles.accentButton,
            { backgroundColor: severityColors.accent, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="file-plus" size={18} color="#FFFFFF" />
          <ThemedText type="small" style={styles.actionButtonText}>
            {t.alerts.actions.registerIncident}
          </ThemedText>
        </Pressable>
      </View>
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
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  imageContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  metadataSection: {
    marginTop: Spacing.md,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingLeft: Spacing.md,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    left: 0,
    top: 5,
  },
  timelineLine: {
    width: 2,
    height: '100%',
    position: 'absolute',
    left: 4,
    top: 15,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  accentButton: {
    flex: 1.2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
