import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCollection,
  createField,
  readCollections,
} from "@directus/sdk";
import { APP_PUSH_DEVICES_COLLECTION } from "@/constants/push";

const PUSH_FIELDS: Array<{
  field: string;
  type: string;
  meta: Record<string, unknown>;
}> = [
  {
    field: "token",
    type: "string",
    meta: { interface: "input", required: true },
  },
  {
    field: "platform",
    type: "string",
    meta: { interface: "select-dropdown", options: { choices: [{ text: "iOS", value: "ios" }, { text: "Android", value: "android" }] } },
  },
  {
    field: "subscriptions",
    type: "json",
    meta: { interface: "input-code", options: { language: "json" } },
  },
];

/**
 * Installs the app_push_devices collection and its fields (token, platform, subscriptions).
 * Requires admin. No relation to directus_users.
 */
export function useInstallPushSchema() {
  const { directus } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!directus) throw new Error("Not authenticated");
      const collections = await directus.request(readCollections());
      const exists = Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_PUSH_DEVICES_COLLECTION
          )
        : false;
      if (exists) return { installed: false, alreadyExists: true };

      await directus.request(
        createCollection({
          collection: APP_PUSH_DEVICES_COLLECTION,
          meta: {
            icon: "notifications",
            note: "Push device tokens for custom push endpoint",
            hidden: false,
          },
          schema: { name: APP_PUSH_DEVICES_COLLECTION },
        } as any)
      );

      for (const f of PUSH_FIELDS) {
        await directus.request(
          createField(APP_PUSH_DEVICES_COLLECTION as any, {
            field: f.field,
            type: f.type,
            meta: f.meta,
          } as any)
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["pushCollectionExists"] });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      return { installed: true };
    },
  });
}
