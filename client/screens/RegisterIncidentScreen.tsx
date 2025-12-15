import React, { useState, useSyncExternalStore } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
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
import { store, Severity, IncidentCategory, Priority } from "@/lib/store";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const categories: { label: string; value: IncidentCategory }[] = [
  { label: 'Hardware', value: 'hardware' },
  { label: 'Software', value: 'software' },
  { label: 'Network', value: 'network' },
  { label: 'Security', value: 'security' },
  { label: 'Other', value: 'other' },
];

const priorities: { label: string; value: Priority }[] = [
  { label: 'P0', value: 'P0' },
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
  { label: 'P4', value: 'P4' },
];

export default function RegisterIncidentScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RegisterIncident'>>();
  const insets = useSafeAreaInsets();

  const alert = useSyncExternalStore(
    store.subscribe,
    () => store.getAlert(route.params.alertId),
    () => store.getAlert(route.params.alertId)
  );

  const [title, setTitle] = useState(alert?.title ?? '');
  const [severity, setSeverity] = useState<Severity>(alert?.severity ?? 'medium');
  const [category, setCategory] = useState<IncidentCategory>('software');
  const [priority, setPriority] = useState<Priority>('P2');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = isDark ? Colors.dark : Colors.light;
  const isValid = title.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid || !alert) return;

    Alert.alert(
      'Confirm Registration',
      'Convert this alert to an incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: () => {
            setIsSubmitting(true);

            store.createIncident(alert.id, {
              title: title.trim(),
              description: alert.description,
              severity,
              status: 'open',
              category,
              priority,
              notes: notes.trim(),
              customFields: {},
            });

            setIsSubmitting(false);
            Alert.alert('Success', 'Incident registered successfully');
            navigation.popToTop();
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
            Cancel
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
            Register
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, isValid, isSubmitting, title, severity, category, priority, notes]);

  if (!alert) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Alert not found</ThemedText>
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
        <View style={[styles.alertReference, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.alertHeader}>
            <Feather name="alert-circle" size={20} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Source Alert
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {alert.title}
          </ThemedText>
          <SeverityBadge severity={alert.severity} />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            Incident Title *
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
            placeholder="Enter incident title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            Severity
          </ThemedText>
          <SeveritySelector value={severity} onChange={setSeverity} />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            Category
          </ThemedText>
          <View style={styles.optionsRow}>
            {categories.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: category === c.value
                      ? colors.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: category === c.value ? '#FFFFFF' : theme.text }}
                >
                  {c.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            Priority
          </ThemedText>
          <View style={styles.optionsRow}>
            {priorities.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPriority(p.value)}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: priority === p.value
                      ? colors.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: priority === p.value ? '#FFFFFF' : theme.text, fontWeight: '600' }}
                >
                  {p.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            Notes
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
            placeholder="Add notes or additional context..."
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  alertReference: {
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  priorityChip: {
    width: 48,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});
