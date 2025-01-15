import { useAuth } from "@/contexts/AuthContext";
import { serverHealth, serverInfo } from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";

export const useServerHealth = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["serverHealth"],
    queryFn: () => directus?.request(serverHealth()),
  });
};

export const useServerInfo = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["serverInfo"],
    queryFn: () => directus?.request(serverInfo()),
  });
};
