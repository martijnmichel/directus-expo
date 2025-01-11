import { useQuery } from "@tanstack/react-query";
import {
  readCollections,
  readMe,
  readPermissions,
  readProviders,
  readRelations,
  readRoles,
  readSettings,
  readSingleton,
  readUserPermissions,
  readUsers,
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
    queryFn: () => directus?.request(readUserPermissions()),
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

export const useSettings = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => directus?.request(readSettings()),
  });
};

export const useUsers = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["users"],
    queryFn: () => directus?.request(readUsers()),
  });
};

export const useRoles = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => directus?.request(readRoles()),
  });
};

export const useProviders = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["providers"],
    queryFn: () => directus?.request(readProviders()),
  });
};

const prefix = "directus_";
export const coreCollections = {
  [prefix + "users"]: useUsers,
  [prefix + "roles"]: useRoles,
  [prefix + "providers"]: useProviders,
  [prefix + "settings"]: useSettings,
};

export const useCoreCollection = (collection: keyof typeof coreCollections) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["coreCollection", collection],
    queryFn: () => directus?.request(coreCollections[collection]()),
  });
};
