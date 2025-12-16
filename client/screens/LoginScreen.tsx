import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError(t.auth.fillAllFields);
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const result = mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password, displayName.trim() || undefined, email.trim() || undefined);
      
      if (!result.success) {
        setError(result.error || t.auth.authError);
      }
    } catch (e) {
      setError(t.auth.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
            <Feather name="bell" size={40} color={theme.buttonText} />
          </View>
          <ThemedText style={styles.title}>AlertHub</ThemedText>
          <ThemedText style={styles.subtitle}>
            {mode === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>{t.auth.username}</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder={t.auth.usernamePlaceholder}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {mode === 'register' ? (
            <>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t.auth.displayName}</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t.auth.displayNamePlaceholder}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t.auth.email}</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t.auth.emailPlaceholder}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </>
          ) : null}

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>{t.auth.password}</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
            />
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.severityCritical + '20' }]}>
              <ThemedText style={[styles.errorText, { color: theme.severityCritical }]}>{error}</ThemedText>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: theme.buttonText }]}>
                {mode === 'login' ? t.auth.login : t.auth.register}
              </ThemedText>
            )}
          </Pressable>

          <Pressable style={styles.toggleButton} onPress={toggleMode}>
            <ThemedText style={[styles.toggleText, { color: theme.primary }]}>
              {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.md,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.small,
    fontWeight: '500',
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    ...Typography.small,
    textAlign: 'center',
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  toggleText: {
    ...Typography.small,
  },
});
