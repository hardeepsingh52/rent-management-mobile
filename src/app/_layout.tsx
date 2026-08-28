import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { SessionProvider, useSessionContext } from "@/lib/session-context";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigation />
    </SessionProvider>
  );
}

function RootNavigation() {
  const colorScheme = useColorScheme();
  const { user, loading } = useSessionContext();

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!user}>
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
            options={{ headerShown: true, title: "Property" }}
          />
          <Stack.Screen
            name="properties/new"
            options={{
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="properties/[id]/units/new"
            options={{
              headerShown: true,
              title: "Add unit",
              presentation: "modal",
            }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
