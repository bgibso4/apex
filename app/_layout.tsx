/**
 * APEX -- Root Layout
 * Sets up the dark theme, loads fonts, and shows splash screen.
 */

import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Colors } from '../src/theme';
import { CUSTOM_FONTS } from '../src/theme/fonts';
import { getDatabase } from '../src/db';
import { SplashScreen } from '../src/components/SplashScreen';

// Prevent the native splash from auto-hiding — we control it
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      // Run DB init and font loading in parallel
      await Promise.all([
        getDatabase(),
        Object.keys(CUSTOM_FONTS).length > 0
          ? Font.loadAsync(CUSTOM_FONTS)
          : Promise.resolve(),
      ]);

      // Hide the native splash screen (our custom one takes over)
      await ExpoSplashScreen.hideAsync().catch(() => {});

      setAppReady(true);
    })();
  }, []);

  const handleSplashFinished = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style="light" />
      {splashDone && (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="library"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="exercises"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen name="settings" />
          <Stack.Screen name="history" />
          <Stack.Screen
            name="activate"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      )}
      {!splashDone && (
        <SplashScreen
          isReady={appReady}
          onFinished={handleSplashFinished}
        />
      )}
    </GestureHandlerRootView>
  );
}
