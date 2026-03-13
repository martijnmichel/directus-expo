import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createItem,
  readItems,
  updateItem,
  type RestCommand,
} from "@directus/sdk";
import { APP_PUSH_DEVICES_COLLECTION } from "@/constants/push";
import type { AppPushDeviceRecord, PushSubscriptionEntry } from "@/constants/push";
import { Platform } from "react-native";

function getPlatform(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}

/**
 * Fetches the current device record from app_push_devices by token, if it exists.
 */
export function usePushDevice(pushToken: string | null) {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["pushDevice", pushToken],
    queryFn: async (): Promise<AppPushDeviceRecord | null> => {
      if (!directus || !pushToken) return null;
      const result = await directus.request(
        readItems(APP_PUSH_DEVICES_COLLECTION as any, {
          filter: { token: { _eq: pushToken } },
          limit: 1,
        }) as RestCommand<AppPushDeviceRecord[], any>
      );
      const list = Array.isArray(result) ? result : (result as { data?: unknown[] })?.data;
      const arr = Array.isArray(list) ? list : [];
      return arr.length > 0 ? (arr[0] as AppPushDeviceRecord) : null;
    },
    enabled: !!directus && !!pushToken,
  });
}

/**
 * Registers or updates this device in app_push_devices (create or update by token).
 */
export function useUpsertPushDevice() {
  const { directus } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      token: string;
      subscriptions: PushSubscriptionEntry[];
    }) => {
      if (!directus) throw new Error("Not authenticated");
      const platform = getPlatform();
      const result = await directus.request(
        readItems(APP_PUSH_DEVICES_COLLECTION as any, {
          filter: { token: { _eq: params.token } },
          limit: 1,
        }) as RestCommand<AppPushDeviceRecord[], any>
      );
      const list = Array.isArray(result) ? result : (result as { data?: unknown[] })?.data;
      const arr = Array.isArray(list) ? list : [];
      const existing = arr[0] as AppPushDeviceRecord | undefined;

      if (existing) {
        await directus.request(
          updateItem(
            APP_PUSH_DEVICES_COLLECTION as any,
            existing.id,
            { subscriptions: params.subscriptions }
          ) as RestCommand<unknown, any>
        );
        await queryClient.invalidateQueries({ queryKey: ["pushDevice", params.token] });
        return { created: false };
      } else {
        await directus.request(
          createItem(APP_PUSH_DEVICES_COLLECTION as any, {
            token: params.token,
            platform,
            subscriptions: params.subscriptions,
          }) as RestCommand<unknown, any>
        );
        await queryClient.invalidateQueries({ queryKey: ["pushDevice", params.token] });
        return { created: true };
      }
    },
  });
}
