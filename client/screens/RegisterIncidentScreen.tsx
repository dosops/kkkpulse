import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert as RNAlert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { SeveritySelector } from "@/components/SeveritySelector";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAlert, useCreateIncident, Severity, Priority } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useI18n } from "@/lib/i18n";

const priorities: { label: string; value: Priority }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

export default function RegisterIncidentScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RegisterIncident'>>();
  const insets = useSafeAreaInsets();

  const { data: alert, isLoading } = useAlert(route.params.alertId);
  const createIncident = useCreateIncident();

  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');

  const colors = isDark ? Colors.dark : Colors.light;
  const isValid = title.trim().length > 0;
  const isSubmitting = createIncident.isPending;

  React.useEffect(() => {
    if (alert && !title) {
      setTitle(alert.title);
      setSeverity(alert.severity);
    }
  }, [alert]);

  const handleSubmit = () => {
    if (!isValid || !alert) return;

    RNAlert.alert(
      t.create.incident.confirmTitle,
      t.create.incident.confirmMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.create.incident.register,
          onPress: async () => {
            try {
              await createIncident.mutateAsync({
                title: title.trim(),
                description: notes.trim() || undefined,
                severity,
                priority,
                alertId: alert.id,
              });

              RNAlert.alert(t.common.success, t.create.incident.successMessage);
              navigation.popToTop();
            } catch (error: any) {
              RNAlert.alert(t.common.error, error.message || 'Failed to create incident');
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <ThemedText type="body" style={{ color: colors.primary }}>
            {t.common.cancel}
          </ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          style={{ opacity: isValid && !isSubmitting ? 1 : 0.5 }}
        >
          <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600' }}>
            {t.create.incident.submit}
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, isValid, isSubmitting, title, severity, priority, notes, t]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
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

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={[styles.alertCard, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.alertHeader}>
            <Feather name="alert-triangle" size={20} color={colors.severityHigh} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.create.incident.sourceAlert}
            </ThemedText>
          </View>
          <ThemedText type="body" numberOfLines={2}>
            {alert.title}
          </ThemedText>
          <SeverityBadge severity={alert.severity} compact />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.incident.titleField} *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Incident title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.incident.severity}
          </ThemedText>
          <SeveritySelector value={severity} onChange={setSeverity} />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.incident.priority}
          </ThemedText>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPriority(p.value)}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: priority === p.value ? colors.primary + '20' : theme.backgroundSecondary,
                    borderColor: priority === p.value ? colors.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: priority === p.value ? colors.primary : theme.text,
                    fontWeight: priority === p.value ? '600' : '400',
                  }}
                >
                  {p.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.incident.notes}
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder={t.create.incident.notesPlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
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
  alertCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    borderWidth: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
