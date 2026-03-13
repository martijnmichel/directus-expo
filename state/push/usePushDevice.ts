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
 * Fetches the current user's device record from app_push_devices by token and user.
 * Scoped by user so multiple logins on the same device (same token) don't share one row.
 */
export function usePushDevice(pushToken: string | null) {
  const { directus, user } = useAuth();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey: ["pushDevice", userId, pushToken],
    queryFn: async (): Promise<AppPushDeviceRecord | null> => {
      if (!directus || !pushToken) return null;
      const filter: Record<string, unknown> = { token: { _eq: pushToken } };
      if (userId) filter.user_id = { _eq: userId };
      const result = await directus.request(
        readItems(APP_PUSH_DEVICES_COLLECTION as any, {
          filter,
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
 * Registers or updates this device in app_push_devices (create or update by token + user).
 * Scoped by current user so multi-user on the same device keeps separate rows per server/user.
 */
export function useUpsertPushDevice() {
  const { directus, user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (params: {
      token: string;
      subscriptions: PushSubscriptionEntry[];
    }) => {
      if (!directus) throw new Error("Not authenticated");
      const platform = getPlatform();
      const filter: Record<string, unknown> = { token: { _eq: params.token } };
      if (userId) filter.user_id = { _eq: userId };
      const result = await directus.request(
        readItems(APP_PUSH_DEVICES_COLLECTION as any, {
          filter,
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
        await queryClient.invalidateQueries({
          queryKey: ["pushDevice", userId, params.token],
        });
        return { created: false };
      } else {
        const payload: Record<string, unknown> = {
          token: params.token,
          platform,
          subscriptions: params.subscriptions,
        };
        if (userId) payload.user_id = userId;
        await directus.request(
          createItem(APP_PUSH_DEVICES_COLLECTION as any, payload) as RestCommand<unknown, any>
        );
        await queryClient.invalidateQueries({
          queryKey: ["pushDevice", userId, params.token],
        });
        return { created: true };
      }
    },
  });
}
