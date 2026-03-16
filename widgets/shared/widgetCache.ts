import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Abstraction for widget config/payload storage.
 *
 * - On iOS/Android, if a native module `WidgetSharedStorage` exists, we call
 *   into that so it can write to the widget's app group / shared prefs.
 * - Otherwise, we fall back to AsyncStorage so the app still behaves
 *   predictably during development (widgets just won't see the data).
 */

type NativeWidgetSharedStorage = {
  setConfigList?(json: string): Promise<void> | void;
  setPayload?(id: string, json: string | null): Promise<void> | void;
};

type WidgetCache = {
  setConfigList(json: string): Promise<void>;
  setPayload(id: string, json: string | null): Promise<void>;
};

export function getWidgetCache(): WidgetCache {
  const native: NativeWidgetSharedStorage | undefined =
    (NativeModules as any).WidgetSharedStorage;

  const hasNative = !!native;

  return {
    async setConfigList(json: string) {
      if (hasNative && native!.setConfigList) {
        await Promise.resolve(native!.setConfigList!(json));
        return;
      }
      // Fallback: AsyncStorage under a known key (for debugging / dev only).
      await AsyncStorage.setItem(
        "directus.widgets.latestItems.v1.configList",
        json,
      );
    },

    async setPayload(id: string, json: string | null) {
      if (hasNative && native!.setPayload) {
        await Promise.resolve(native!.setPayload!(id, json));
        return;
      }
      const key = `directus.widgets.latestItems.v1.payload.${id}`;
      if (json == null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, json);
      }
    },
  };
}

