import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useCallback, useState } from "react";

/**
 * Imperative helper to request notification permissions and get the
 * native FCM/APNs device token.
 *
 * Does NOTHING until you call `requestToken()`, so you can:
 * - First check that the server-side schema is installed
 * - Then, on button press, ask the user to enable notifications
 */
export function usePushToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestToken = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      setToken(null);
      return null;
    }

    setLoading(true);
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let final = existing;

      // Only show the permission prompt when the user explicitly taps the button
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        final = status;
      }

      if (final !== "granted") {
        setToken(null);
        return null;
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();
      setToken(tokenData.data);
      return tokenData.data;
    } catch {
      setToken(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    token,
    loading,
    requestToken,
  };
}
