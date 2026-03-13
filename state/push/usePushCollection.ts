import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { readCollections, readFlows } from "@directus/sdk";
import {
  APP_PUSH_DEVICES_COLLECTION,
  APP_PUSH_FLOW_NAME,
} from "@/constants/push";

/**
 * Returns true if both the app_push_devices collection and the push flow exist.
 */
export function usePushCollectionExists() {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["pushCollectionExists"],
    queryFn: async () => {
      const [collections, flows] = await Promise.all([
        directus?.request(readCollections()) ?? [],
        directus?.request(readFlows({ filter: { name: { _eq: APP_PUSH_FLOW_NAME } }, limit: 1 })) ?? [],
      ]);
      const collectionExists = Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_PUSH_DEVICES_COLLECTION
          )
        : false;
      const flowList = Array.isArray(flows) ? flows : (flows as { data?: unknown[] })?.data ?? [];
      const flowExists = flowList.length > 0;
      return collectionExists && flowExists;
    },
    enabled: !!directus,
  });
}
