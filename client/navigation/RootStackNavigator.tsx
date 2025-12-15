import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CreateAlertScreen from "@/screens/CreateAlertScreen";
import RegisterIncidentScreen from "@/screens/RegisterIncidentScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  CreateAlert: undefined;
  RegisterIncident: { alertId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateAlert"
        component={CreateAlertScreen}
        options={{
          presentation: "modal",
          headerTitle: "New Alert",
        }}
      />
      <Stack.Screen
        name="RegisterIncident"
        component={RegisterIncidentScreen}
        options={{
          presentation: "modal",
          headerTitle: "Register Incident",
        }}
      />
    </Stack.Navigator>
  );
}
