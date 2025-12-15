import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const user = store.getCurrentUser();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleLogout = () => {
    Alert.alert(t.profile.logOut, t.profile.logOutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.profile.logOut, style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.profile.deleteAccount,
      t.profile.deleteAccountConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t.profile.confirmDeletion,
              t.profile.permanentDelete,
              [
                { text: t.common.cancel, style: 'cancel' },
                { text: t.profile.deleteForever, style: 'destructive', onPress: () => {} },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={[styles.userCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h3">{user.name}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user.email}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.profile.settings}
          </ThemedText>
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Feather name="globe" size={20} color={theme.text} />
              <ThemedText type="body">{t.profile.language}</ThemedText>
            </View>
            <View style={styles.languageToggle}>
              <Pressable
                onPress={() => setLanguage('en')}
                style={[
                  styles.langButton,
                  {
                    backgroundColor: language === 'en' ? colors.primary : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText type="small" style={{ color: language === 'en' ? '#FFFFFF' : theme.text }}>
                  EN
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setLanguage('ru')}
                style={[
                  styles.langButton,
                  {
                    backgroundColor: language === 'ru' ? colors.primary : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText type="small" style={{ color: language === 'ru' ? '#FFFFFF' : theme.text }}>
                  RU
                </ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Feather name="bell" size={20} color={theme.text} />
              <ThemedText type="body">{t.profile.pushNotifications}</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.backgroundSecondary, true: colors.primary }}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.profile.appInfo}
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText type="body">{t.profile.version}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {Constants.expoConfig?.version ?? '1.0.0'}
            </ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="body">{t.profile.helpSupport}</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="body">{t.profile.privacyPolicy}</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.profile.account}
          </ThemedText>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="body">{t.profile.logOut}</ThemedText>
            <Feather name="log-out" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="body" style={{ color: colors.accent }}>
              {t.profile.deleteAccount}
            </ThemedText>
            <Feather name="trash-2" size={20} color={colors.accent} />
          </Pressable>
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
  userCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  languageToggle: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  langButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
