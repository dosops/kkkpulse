import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import AlertsStackNavigator from "@/navigation/AlertsStackNavigator";
import IncidentsStackNavigator from "@/navigation/IncidentsStackNavigator";
import ActivityScreen from "@/screens/ActivityScreen";
import StatusScreen from "@/screens/StatusScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useI18n } from "@/lib/i18n";

export type MainTabParamList = {
  AlertsTab: undefined;
  IncidentsTab: undefined;
  StatusTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function FAB() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate('CreateAlert')}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
          bottom: 60 + insets.bottom + Spacing.lg,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Feather name="plus" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="AlertsTab"
        screenOptions={{
          tabBarActiveTintColor: theme.tabIconSelected,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundRoot,
            }),
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="AlertsTab"
          component={AlertsStackNavigator}
          options={{
            title: t.tabs.alerts,
            tabBarIcon: ({ color, size }) => (
              <Feather name="bell" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="IncidentsTab"
          component={IncidentsStackNavigator}
          options={{
            title: t.tabs.incidents,
            tabBarIcon: ({ color, size }) => (
              <Feather name="file-text" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="StatusTab"
          component={StatusScreen}
          options={{
            title: t.tabs.status,
            headerShown: true,
            headerTitle: t.status.title,
            headerTintColor: theme.text,
            headerStyle: { backgroundColor: theme.backgroundRoot },
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ActivityTab"
          component={ActivityScreen}
          options={{
            title: t.tabs.activity,
            headerShown: true,
            headerTitle: t.activity.title,
            headerTintColor: theme.text,
            headerStyle: { backgroundColor: theme.backgroundRoot },
            tabBarIcon: ({ color, size }) => (
              <Feather name="activity" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            title: t.tabs.profile,
            headerShown: true,
            headerTitle: t.profile.title,
            headerTintColor: theme.text,
            headerStyle: { backgroundColor: theme.backgroundRoot },
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
