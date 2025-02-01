import { useAuth } from "@/contexts/AuthContext";
import { readItems, serverHealth, serverInfo } from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";

export const useServerHealth = () => {
  const { directus } = useAuth();

  return useQuery({
    queryKey: ["serverHealth", directus?.url.origin],
    queryFn: () => directus?.request(serverHealth()),
    enabled: !!directus,
  });
};

export const useServerInfo = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["serverInfo", directus?.url.origin],
    queryFn: () => directus?.request(serverInfo()),
    enabled: !!directus,
  });
};

/**
 * Get the languages from the server
 * @returns
 *
 * does not work safely because the languages in Directus are a collection which can be another name, and with another object.
 * Maybe try to make an app setting, like: "languages_collection_name" and "languages_object_label" and "languages_object_value"
 */
export const useLanguages = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["languages", directus?.url.origin],

    queryFn: () =>
      // @ts-ignore works but is not in the SDK
      directus?.request(readItems("languages")) as {
        code: string;
        name: string;
      }[],
    enabled: !!directus,
  });
};
