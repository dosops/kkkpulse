import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import LoginScreen from "@/screens/LoginScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <RootStackNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
                <StatusBar style="auto" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
