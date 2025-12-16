import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert as RNAlert,
  ActivityIndicator,
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
import { useAlert, useAlertHistory, useAlertComments, useUpdateAlert, useAddAlertComment } from "@/lib/api";
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
  
  const { data: alert, isLoading } = useAlert(route.params.alertId);
  const { data: history = [] } = useAlertHistory(route.params.alertId);
  const { data: comments = [] } = useAlertComments(route.params.alertId);
  const updateAlert = useUpdateAlert();
  const addComment = useAddAlertComment();

  const severityColors = isDark ? Colors.dark : Colors.light;

  const handleTakeToWork = async () => {
    if (!alert) return;
    try {
      await updateAlert.mutateAsync({ id: alert.id, status: 'acknowledged' });
      RNAlert.alert(t.common.success, t.alerts.detail.alertAssigned);
    } catch (error: any) {
      RNAlert.alert(t.common.error, error.message);
    }
  };

  const handleInspect = async () => {
    if (!alert) return;
    try {
      await updateAlert.mutateAsync({ id: alert.id, status: 'in_progress' });
      RNAlert.alert(t.common.success, t.alerts.detail.alertInspected);
    } catch (error: any) {
      RNAlert.alert(t.common.error, error.message);
    }
  };

  const handleRegisterIncident = () => {
    if (!alert) return;
    navigation.navigate('RegisterIncident', { alertId: alert.id });
  };

  const handleAddComment = async (text: string) => {
    if (!alert) return;
    try {
      await addComment.mutateAsync({ alertId: alert.id, content: text });
    } catch (error: any) {
      RNAlert.alert(t.common.error, error.message);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={severityColors.primary} />
      </ThemedView>
    );
  }

  if (!alert) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Feather name="alert-circle" size={48} color={theme.textSecondary} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
          {t.common.alertNotFound}
        </ThemedText>
      </ThemedView>
    );
  }

  const sourceLabel = alert.source === 'manual' ? t.alerts.source.manual : alert.source;

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
                {sourceLabel}
              </ThemedText>
            </View>
            <StatusChip status={alert.status} />
          </View>
        </View>

        {alert.imageUrl ? (
          <View style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Image
              source={{ uri: alert.imageUrl }}
              style={styles.image}
              contentFit="contain"
            />
          </View>
        ) : null}

        {alert.description ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.alerts.detail.description}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {alert.description}
            </ThemedText>
          </View>
        ) : null}

        {history.length > 0 ? (
          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.alerts.detail.history}
            </ThemedText>
            {history.map((activity, index) => (
              <View key={activity.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: severityColors.primary }]} />
                {index < history.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                ) : null}
                <View style={styles.timelineContent}>
                  <ThemedText type="body">
                    {activity.action.replace(/_/g, ' ')} - {activity.user?.displayName || activity.user?.email || 'System'}
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
          disabled={updateAlert.isPending}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: severityColors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="briefcase" size={18} color="#FFFFFF" />
          <ThemedText type="small" style={styles.buttonText}>
            {t.alerts.actions.takeToWork}
          </ThemedText>
        </Pressable>
        
        <Pressable
          onPress={handleInspect}
          disabled={updateAlert.isPending}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="search" size={18} color={theme.text} />
          <ThemedText type="small">{t.alerts.actions.inspect}</ThemedText>
        </Pressable>
        
        <Pressable
          onPress={handleRegisterIncident}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: severityColors.accent, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="file-plus" size={18} color="#FFFFFF" />
          <ThemedText type="small" style={styles.buttonText}>
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
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
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
  imageContainer: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
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
  timelineItem: {
    flexDirection: 'row',
    paddingLeft: Spacing.sm,
    minHeight: 50,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: Spacing.sm + 4,
    top: 14,
    bottom: 0,
    width: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: Spacing.md,
  },
  actionBar: {
    position: 'absolute',
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
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
