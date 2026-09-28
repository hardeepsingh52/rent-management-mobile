import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerDeviceToken } from "./notifications-api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function registerForPushNotifications(
  sessionToken: string,
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  await ensureAndroidChannel();

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) {
    return;
  }

  const deviceToken = await messaging().getToken();
  await registerDeviceToken(
    deviceToken,
    Platform.OS === "ios" ? "ios" : "android",
    sessionToken,
  );
}

export function subscribeToTokenRefresh(sessionToken: string): () => void {
  return messaging().onTokenRefresh((deviceToken) => {
    registerDeviceToken(
      deviceToken,
      Platform.OS === "ios" ? "ios" : "android",
      sessionToken,
    ).catch(() => {
      // Best-effort: a failed re-registration will retry on next app launch.
    });
  });
}

export function subscribeToForegroundMessages(
  onMessage: () => void,
): () => void {
  return messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title ?? "New notification";
    const body = remoteMessage.notification?.body ?? "";
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: remoteMessage.data },
      trigger: null,
    });
    onMessage();
  });
}
