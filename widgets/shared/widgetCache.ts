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

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

/**
 * iOS: backed by App Group NSUserDefaults via @bacons/apple-targets ExtensionStorage.
 * Android: backed by files under the app sandbox (widgets can read these).
 */
export interface WidgetCache {
  setString(key: string, value: string | null): Promise<void>;
  getString(key: string): Promise<string | null>;
  /**
   * Ask the OS to refresh widgets after cache writes.
   */
  reload(): Promise<void>;
}

let cache: WidgetCache | null = null;

export function getWidgetCache(): WidgetCache {
  if (cache) return cache;

  if (Platform.OS === "ios") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ExtensionStorage } = require("@bacons/apple-targets") as {
      ExtensionStorage: any;
    };

    // Must match `ios.entitlements.com.apple.security.application-groups` in `app.config.js`.
    const storage = new ExtensionStorage("group.com.martijnmichel.directusexpo.widgets");

    cache = {
      setString: async (key, value) => {
        storage.set(key, value ?? undefined);
      },
      getString: async (key) => {
        const v = storage.get?.(key);
        return typeof v === "string" ? v : v == null ? null : String(v);
      },
      reload: async () => {
        ExtensionStorage.reloadWidget();
      },
    };

    return cache;
  }

  // Android: store one file per key in DocumentDirectory.
  const baseDir = `${FileSystem.documentDirectory ?? ""}widget-cache/`;
  const toSafeName = (key: string) =>
    key.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);

  cache = {
    setString: async (key, value) => {
      if (!FileSystem.documentDirectory) return;
      await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
      const path = `${baseDir}${toSafeName(key)}.txt`;
      if (value == null) {
        try {
          await FileSystem.deleteAsync(path, { idempotent: true });
        } catch {
          // ignore
        }
        return;
      }
      await FileSystem.writeAsStringAsync(path, value, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    },
    getString: async (key) => {
      if (!FileSystem.documentDirectory) return null;
      const path = `${baseDir}${toSafeName(key)}.txt`;
      try {
        return await FileSystem.readAsStringAsync(path, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch {
        return null;
      }
    },
    reload: async () => {
      // Android widgets are configured to refresh periodically via updatePeriodMillis.
      // (We avoid a native broadcast module to keep the managed workflow light.)
    },
  };
  return cache;
}

