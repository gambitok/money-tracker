import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthGate } from '@/components/AuthGate';
import { AppProviders } from '@/providers/AppProviders';
import { useThemeMode } from '@/providers/ThemeModeProvider';
import { ThemeModeProvider } from '@/providers/ThemeModeProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeModeProvider>
      <RootLayoutNav />
    </ThemeModeProvider>
  );
}

function RootLayoutNav() {
  const { theme: paperTheme, mode } = useThemeMode();

  return (
    <AppProviders theme={paperTheme}>
      <AuthGate>
        <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="categories" options={{ headerShown: true, title: 'Categories' }} />
            <Stack.Screen name="budgets" options={{ headerShown: true, title: 'Budgets' }} />
            <Stack.Screen name="transaction/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
          </Stack>
        </ThemeProvider>
      </AuthGate>
    </AppProviders>
  );
}
