import { useQuery } from "@tanstack/react-query";
import {
  readCollections,
  readMe,
  readPermissions,
  readRelations,
} from "@directus/sdk";
import { useAuth } from "@/contexts/AuthContext";
export const useUser = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["user"],
    queryFn: () => directus?.request(readMe()),
  });
};

export const usePermissions = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => directus?.request(readPermissions()),
  });
};

export const useCollections = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => directus?.request(readCollections()),
  });
};

export const useRelations = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["relations"],
    queryFn: () => directus?.request(readRelations()),
  });
};
