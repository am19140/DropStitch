import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_800ExtraBold_Italic,
  Nunito_900Black,
  Nunito_900Black_Italic,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useProjectsHydrated } from '@/store/projects';

SplashScreen.preventAutoHideAsync();

// Opening a project directly (e.g. from a link) still puts the tabs underneath it.
export const unstable_settings = { anchor: '(tabs)' };

const C = Colors.light;

export default function RootLayout() {
  const hydrated = useProjectsHydrated();
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_800ExtraBold_Italic,
    Nunito_900Black,
    Nunito_900Black_Italic,
  });
  const ready = hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Keep the splash screen up until saved data and fonts are loaded.
  if (!ready) return null;

  return (
    <ThemeProvider
      value={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: C.primary,
          background: C.background,
          card: C.background,
          text: C.text,
          border: C.border,
        },
      }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="yarn/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/[id]/edit" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
