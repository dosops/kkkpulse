import React, { useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusChip } from "@/components/StatusChip";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/lib/store";
import { AlertsStackParamList } from "@/navigation/AlertsStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { formatRelativeTime } from "@/lib/utils";

export default function AlertDetailScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
        <ThemedText>Alert not found</ThemedText>
      </ThemedView>
    );
  }

  const handleTakeToWork = () => {
    store.takeAlertToWork(alert.id);
    Alert.alert('Success', 'Alert assigned to you');
  };

  const handleInspect = () => {
    store.inspectAlert(alert.id);
    Alert.alert('Success', 'Alert marked as inspected');
  };

  const handleRegisterIncident = () => {
    navigation.navigate('RegisterIncident', { alertId: alert.id });
  };

  const severityColors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
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
                {alert.source === 'manual' ? 'Manual' : 'System'}
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
            Description
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {alert.description}
          </ThemedText>

          {alert.metadata && Object.keys(alert.metadata).length > 0 ? (
            <View style={styles.metadataSection}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Details
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
              Action History
            </ThemedText>
            {alert.actions.map((action, index) => (
              <View key={action.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: severityColors.primary }]} />
                {index < alert.actions.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                ) : null}
                <View style={styles.timelineContent}>
                  <ThemedText type="body">
                    {action.type === 'taken_to_work' && `Taken to work by ${action.userName}`}
                    {action.type === 'inspected' && `Inspected by ${action.userName}`}
                    {action.type === 'incident_registered' && `Incident registered by ${action.userName}`}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {formatRelativeTime(action.timestamp)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.md,
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
            Take to Work
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
            Inspect
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
            Register
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
