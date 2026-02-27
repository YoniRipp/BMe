import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { MoneyScreen } from '../screens/MoneyScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { BodyScreen } from '../screens/BodyScreen';
import { EnergyScreen } from '../screens/EnergyScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontSize: 11 },
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', headerTitle: 'BeMe' }}
      />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Money" component={MoneyScreen} options={{ tabBarLabel: 'Money' }} />
      <Tab.Screen name="Body" component={BodyScreen} options={{ tabBarLabel: 'Body' }} />
      <Tab.Screen name="Energy" component={EnergyScreen} options={{ tabBarLabel: 'Energy' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarLabel: 'Insights' }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ tabBarLabel: 'Groups' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}
