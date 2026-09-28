import { Platform } from "react-native";

import "expo-router/entry";

// Must be registered outside the React tree so it also runs when the app is
// launched from a killed state by a background push notification (Android).
// @react-native-firebase/messaging has no web implementation, so this must
// stay native-only or it throws during the web bundle's module init.
if (Platform.OS !== "web") {
  const messaging = require("@react-native-firebase/messaging").default;
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("Background FCM message:", remoteMessage.messageId);
  });
}
