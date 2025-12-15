import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import IncidentsScreen from "@/screens/IncidentsScreen";
import IncidentDetailScreen from "@/screens/IncidentDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type IncidentsStackParamList = {
  Incidents: undefined;
  IncidentDetail: { incidentId: string };
};

const Stack = createNativeStackNavigator<IncidentsStackParamList>();

export default function IncidentsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Incidents"
        component={IncidentsScreen}
        options={{
          headerTitle: "Incidents",
        }}
      />
      <Stack.Screen
        name="IncidentDetail"
        component={IncidentDetailScreen}
        options={{
          headerTitle: "Incident Details",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
