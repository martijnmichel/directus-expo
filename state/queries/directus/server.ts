import { useAuth } from "@/contexts/AuthContext";
import { serverHealth, serverInfo } from "@directus/sdk";
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
