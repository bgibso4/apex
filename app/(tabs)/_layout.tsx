/**
 * APEX — Tab Navigation Layout
 * Bottom tabs: Home, Workout, Progress, Running
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Colors, FontSize, ComponentSize, Spacing } from '../../src/theme';

// expo-router types the tab color as ColorValue; Ionicons accepts only string | OpaqueColorValue.
// Our tint colors are string tokens, so the narrowing is safe.
const tabIcon = (name: ComponentProps<typeof Ionicons>['name']) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Ionicons name={name} size={22} color={color as string} />;
  };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: ComponentSize.tabBarHeight,
          paddingBottom: ComponentSize.tabBarPaddingBottom,
          paddingTop: ComponentSize.tabBarPaddingTop,
          paddingHorizontal: Spacing.lg,
        },
        tabBarActiveTintColor: Colors.indigo,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.tabLabel,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home'),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: tabIcon('barbell'),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: tabIcon('trending-up'),
        }}
      />
      <Tabs.Screen
        name="running"
        options={{
          title: 'Running',
          tabBarIcon: tabIcon('footsteps'),
        }}
      />
    </Tabs>
  );
}
