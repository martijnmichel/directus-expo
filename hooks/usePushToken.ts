import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useEffect, useState } from "react";

/**
 * Returns the native FCM/APNs device push token for this device, or null if
 * not available (web, permission denied, or simulator).
 * Use this token when registering with app_push_devices for our custom push endpoint.
 */
export function usePushToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      setToken(null);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { status: existing } =
          await Notifications.getPermissionsAsync();
        let final = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          final = status;
        }
        if (final !== "granted" || !mounted) {
          if (mounted) setToken(null);
          return;
        }
        const tokenData = await Notifications.getDevicePushTokenAsync();
        if (mounted) setToken(tokenData.data);
      } catch {
        if (mounted) setToken(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return token;
}
