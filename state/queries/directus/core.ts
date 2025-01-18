import { useQuery } from "@tanstack/react-query";
import {
  aggregate,
  CoreSchema,
  Query,
  readCollections,
  readMe,
  readPermissions,
  readProviders,
  readRelations,
  readRole,
  readRoles,
  readSettings,
  readSingleton,
  readUser,
  readUserPermissions,
  readUsers,
} from "@directus/sdk";
import { useAuth } from "@/contexts/AuthContext";
import { mutateUser } from "@/state/actions/updateUser";
import { mutateMe } from "@/state/actions/updateMe";
import { get } from "lodash";
export const useMe = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["me"],
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

/**
 *
 * CORE COLLECTIONS
 *
 */

export const useUser = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => directus?.request(readUser(id)),
  });
};

export const useUsers = (query?: Query<CoreSchema, any>) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["users", query],
    queryFn: async () => {
      const items = await directus?.request(readUsers(query));
      const pagination = await directus?.request(
        aggregate("directus_users", { aggregate: { count: "*" } })
      );
      return { items, total: Number(get(pagination, "0.count")) };
    },
  });
};

export const useRole = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => directus?.request(readRole(id)),
  });
};

export const useRoles = (query?: Query<CoreSchema, any>) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const items = await directus?.request(readRoles(query));
      const pagination = await directus?.request(
        aggregate("directus_roles", {
          aggregate: { count: "*", query },
        })
      );
      return { items, total: Number(get(pagination, "0.count")) };
    },
  });
};

export const useProviders = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const items = await directus?.request(readProviders());

      return { items, total: 0 };
    },
  });
};

const prefix = "directus_";

export const coreCollections = {
  [prefix + "users"]: {
    me: useMe,
    readItem: useUser,
    readItems: useUsers,
    updateItem: mutateUser,
    updateMe: mutateMe,
  },
  [prefix + "roles"]: {
    readItem: useRole,
    readItems: useRoles,
  },
  [prefix + "providers"]: {
    readItems: useProviders,
  },
  [prefix + "settings"]: {
    readItem: useSettings,
  },
};
