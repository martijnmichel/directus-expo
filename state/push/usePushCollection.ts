import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  readCollections,
  readFlows,
  readItems,
  type RestCommand,
} from "@directus/sdk";
import {
  APP_PUSH_DEVICES_COLLECTION,
  APP_PUSH_FLOW_NAME,
} from "@/constants/push";

export type PushSetupState = {
  collectionExists: boolean;
  flowExists: boolean;
  /**
   * Whether the current user role can at least read from app_push_devices.
   * "unknown" is used when the collection does not exist yet or when
   * the permission check failed with a non-403 error.
   */
  deviceAccess: "ok" | "forbidden" | "unknown";
};

function isForbiddenError(error: unknown): boolean {
  const anyErr = error as any;
  const status =
    anyErr?.status ??
    anyErr?.response?.status ??
    anyErr?.errors?.[0]?.extensions?.status;
  const code =
    anyErr?.code ?? anyErr?.errors?.[0]?.extensions?.code;
  return status === 403 || code === "FORBIDDEN";
}

/**
 * Returns details about the push setup:
 * - whether the app_push_devices collection exists
 * - whether the push flow exists
 * - whether the current role can read from app_push_devices
 */
export function usePushCollectionExists() {
  const { directus } = useAuth();
  return useQuery<PushSetupState>({
    queryKey: ["pushCollectionExists"],
    staleTime: 1,
    enabled: !!directus,
    queryFn: async () => {
      const [collections, flows] = await Promise.all([
        directus!.request(readCollections()),
        directus!.request(
          readFlows({
            filter: { name: { _eq: APP_PUSH_FLOW_NAME } },
            limit: 1,
          } as any)
        ),
      ]);

      const collectionExists = Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_PUSH_DEVICES_COLLECTION
          )
        : false;

      const flowList = Array.isArray(flows)
        ? flows
        : ((flows as { data?: unknown[] })?.data ?? []);
      const flowExists = flowList.length > 0;

      let deviceAccess: PushSetupState["deviceAccess"] = "unknown";
      if (collectionExists) {
        try {
          // Try a minimal read to infer permissions for this role.
          await directus!.request(
            readItems(APP_PUSH_DEVICES_COLLECTION as any, {
              limit: 1,
            }) as RestCommand<unknown, any>
          );
          deviceAccess = "ok";
        } catch (error) {
          if (isForbiddenError(error)) {
            deviceAccess = "forbidden";
          } else {
            deviceAccess = "unknown";
          }
        }
      }

      return { collectionExists, flowExists, deviceAccess };
    },
  });
}
