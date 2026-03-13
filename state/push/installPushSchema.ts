import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCollection,
  createField,
  createFlow,
  createOperation,
  readCollections,
  readFlows,
  updateFlow,
} from "@directus/sdk";
import Constants from "expo-constants";
import {
  APP_PUSH_DEVICES_COLLECTION,
  APP_PUSH_FLOW_NAME,
  PUSH_ENDPOINT_URL,
} from "@/constants/push";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";

function getPushSecret(): string | undefined {
  return (Constants.expoConfig as { extra?: { pushSecret?: string } })?.extra
    ?.pushSecret;
}

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
    mutationFn: async (params: { staticApiKey: string }) => {
      const { staticApiKey } = params;
      if (!directus) throw new Error("Not authenticated");
      if (!staticApiKey?.trim()) {
        throw new Error("Static API key is required for the push flow.");
      }
      const [collections, flowsRaw] = await Promise.all([
        directus.request(readCollections()),
        directus.request(readFlows({ filter: { name: { _eq: APP_PUSH_FLOW_NAME } }, limit: 1 } as any)),
      ]);
      const collectionExists = Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_PUSH_DEVICES_COLLECTION
          )
        : false;
      const flowsList = Array.isArray(flowsRaw) ? flowsRaw : (flowsRaw as { data?: unknown[] })?.data ?? [];
      const flowExists = flowsList.length > 0;
      if (collectionExists && flowExists)
        return { installed: false, alreadyExists: true };

      if (!collectionExists) {
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
      }

      if (!flowExists) {
        const pushSecret = getPushSecret();
        if (!pushSecret?.trim()) {
          throw new Error(
            "Push secret is not set. Add PUSH_SECRET (or EXPO_PUBLIC_PUSH_SECRET) in .env or EAS Secrets. See README or app.config.js."
          );
        }

        const activeApiStr = await AsyncStorage.getItem(
          LocalStorageKeys.DIRECTUS_API_ACTIVE
        );
        const activeApi = activeApiStr
          ? (JSON.parse(activeApiStr) as { url?: string })
          : null;
        const directusUrl =
          activeApi?.url?.replace(/\/$/, "") ?? "";
        if (!directusUrl) {
          throw new Error("Could not determine Directus URL. Please try again.");
        }

        const directusToken = staticApiKey.trim();

        const flow = await directus.request(
          createFlow({
            name: APP_PUSH_FLOW_NAME,
            icon: "notifications",
            description:
              "Sends item create/update/delete to the push endpoint. Created by the app; URL and token are set at install.",
            status: "active",
            trigger: "event",
            options: {
              type: "action",
              scope: ["items.create", "items.update", "items.delete"],
            },
          } as any)
        );
        const flowId =
          (flow as { id?: string })?.id ??
          (flow as { data?: { id?: string } })?.data?.id;
        if (!flowId) throw new Error("Flow created but no id returned");

        const requestBody = JSON.stringify({
          directusUrl,
          directusToken,
          collection: "{{ $trigger.collection }}",
          action: "{{ $trigger.action }}",
          key: "{{ $trigger.key }}",
          payload: {
            title: "Item {{ $trigger.action }}d",
            body: "{{ $trigger.collection }} #{{ $trigger.key }}",
          },
        });

        const operation = await directus.request(
          createOperation({
            flow: flowId,
            key: "send-push-request",
            type: "request",
            name: "Send to push endpoint",
            position_x: 0,
            position_y: 0,
            options: {
              url: PUSH_ENDPOINT_URL,
              method: "POST",
              headers: [
                { name: "Content-Type", value: "application/json" },
                { name: "Authorization", value: `Bearer ${pushSecret.trim()}` },
              ],
              body: requestBody,
            },
          } as any)
        );
        const operationId =
          (operation as { id?: string })?.id ??
          (operation as { data?: { id?: string } })?.data?.id;
        if (operationId) {
          await directus.request(
            updateFlow(flowId, { operation: operationId } as any)
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["pushCollectionExists"] });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      return { installed: true };
    },
  });
}
