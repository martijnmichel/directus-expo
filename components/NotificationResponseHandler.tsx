import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
import { useEffect } from "react";

/**
 * When the user taps a push notification, read the deep link from the payload
 * and open it so the app navigates to directus://content/{collection}/{id}.
 */
export function NotificationResponseHandler() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { deepLink?: string }
          | undefined;
        const deepLink = data?.deepLink;
        if (typeof deepLink === "string" && deepLink.startsWith("directus://")) {
          Linking.openURL(deepLink);
        }
      }
    );
    return () => sub.remove();
  }, []);
  return null;
}
