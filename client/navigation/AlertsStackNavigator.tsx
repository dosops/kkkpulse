import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AlertsScreen from "@/screens/AlertsScreen";
import AlertDetailScreen from "@/screens/AlertDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type AlertsStackParamList = {
  Alerts: undefined;
  AlertDetail: { alertId: string };
};

const Stack = createNativeStackNavigator<AlertsStackParamList>();

export default function AlertsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          headerTitle: () => <HeaderTitle />,
        }}
      />
      <Stack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{
          headerTitle: "Alert Details",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
