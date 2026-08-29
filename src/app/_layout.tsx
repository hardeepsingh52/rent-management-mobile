import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { SessionProvider, useSessionContext } from "@/lib/session-context";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigation />
    </SessionProvider>
  );
}

function RootNavigation() {
  const { user, loading } = useSessionContext();

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)/onboarding" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen
            name="(auth)/forgot-password"
            options={{ headerShown: true, title: "Forgot password" }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="properties/[id]"
            options={{ headerShown: false, title: "Property" }}
          />
          <Stack.Screen
            name="properties/new"
            options={{
              presentation: "modal",
            }}
          />
                 <Stack.Screen
            name="properties/[id]/units/new"
            options={{ headerShown: false, presentation: "modal" }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}