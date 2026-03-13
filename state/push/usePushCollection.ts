import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { readCollections } from "@directus/sdk";
import { APP_PUSH_DEVICES_COLLECTION } from "@/constants/push";

/**
 * Returns true if the app_push_devices collection exists on the current Directus instance.
 */
export function usePushCollectionExists() {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["pushCollectionExists"],
    queryFn: async () => {
      const collections = await directus?.request(readCollections());
      return Array.isArray(collections)
        ? collections.some(
            (c: { collection?: string }) =>
              c.collection === APP_PUSH_DEVICES_COLLECTION
          )
        : false;
    },
    enabled: !!directus,
  });
}
