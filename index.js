import messaging from "@react-native-firebase/messaging";

import "expo-router/entry";

// Must be registered outside the React tree so it also runs when the app is
// launched from a killed state by a background push notification (Android).
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Background FCM message:", remoteMessage.messageId);
});
