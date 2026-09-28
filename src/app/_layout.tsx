import { AnimatedSplashOverlay } from "@/components/animated-icon";
import {
  registerForPushNotifications,
  subscribeToTokenRefresh,
} from "@/lib/push-notifications";
import { SessionProvider, useSessionContext } from "@/lib/session-context";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

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

  useEffect(() => {
    if (!user) {
      return;
    }
    registerForPushNotifications(user.token).catch(() => {
      // Best-effort: push is a nice-to-have, don't block the app on it.
    });
    return subscribeToTokenRefresh(user.token);
  }, [user?.id]);

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
          <Stack.Screen name="(auth)/register" />
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
          <Stack.Screen
            name="notifications"
            options={{ headerShown: true, title: "Notifications" }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
