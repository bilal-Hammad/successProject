import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { BottomNav } from '../../src/components/BottomNav';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    // position: 'relative' so BottomNav's absolute coords are relative to this root
    <View style={{ flex: 1, position: 'relative' }}>
      <Tabs
        // Suppress the built-in tab bar entirely — BottomNav is rendered as an
        // absolute overlay below, completely outside the Tab navigator's layout.
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="profile" />
      </Tabs>

      {/* Root-level absolute overlay — gets full screen height, independent of
          any tab screen. Content scrolls freely underneath. */}
      <BottomNav />
    </View>
  );
}
