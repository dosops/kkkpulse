import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { SeveritySelector } from "@/components/SeveritySelector";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store, Severity } from "@/lib/store";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useI18n } from "@/lib/i18n";

export default function CreateAlertScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = isDark ? Colors.dark : Colors.light;
  const isValid = title.trim().length > 0;

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(t.common.notAvailable, t.common.runInExpoGo);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(t.common.notAvailable, t.common.runInExpoGo);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.common.permissionRequired, t.common.cameraAccessNeeded);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!isValid) return;

    setIsSubmitting(true);
    
    store.createAlert({
      title: title.trim(),
      description: description.trim(),
      severity,
      source: 'manual',
      imageUri,
    });

    setIsSubmitting(false);
    Alert.alert(t.common.success, t.alerts.detail.alertCreated);
    navigation.goBack();
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
            {t.create.alert.submit}
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, isValid, isSubmitting, title, description, severity, imageUri, t]);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.alert.titleField} *
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
            placeholder={t.create.alert.titlePlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.alert.description}
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
            placeholder={t.create.alert.descriptionPlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.alert.severity}
          </ThemedText>
          <SeveritySelector value={severity} onChange={setSeverity} />
        </View>

        <View style={styles.field}>
          <ThemedText type="h4" style={styles.label}>
            {t.create.alert.addImage}
          </ThemedText>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setImageUri(undefined)}
                style={[styles.removeImageButton, { backgroundColor: colors.accent }]}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.imageButtonsRow}>
              <Pressable
                onPress={takePhoto}
                style={[
                  styles.imageButton,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="camera" size={24} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Camera
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={pickImage}
                style={[
                  styles.imageButton,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="image" size={24} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Gallery
                </ThemedText>
              </Pressable>
            </View>
          )}
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
  imageButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imageButton: {
    flex: 1,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
