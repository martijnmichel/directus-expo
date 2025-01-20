import { useMutation, useQuery } from "@tanstack/react-query";
import {
  aggregate,
  CoreSchema,
  deletePolicy,
  deleteRole,
  deleteRoles,
  deleteUser,
  deleteUsers,
  Query,
  readCollections,
  readItemPermissions,
  readMe,
  readPermissions,
  readPolicies,
  readPolicy,
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
import { addRole } from "@/state/actions/addRole";
import { addPolicy } from "@/state/actions/addPolicy";
export const useMe = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => directus?.request(readMe()),
  });
};

export const usePermissions = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["permissions", user?.id],
    queryFn: () => directus?.request(readUserPermissions()),
  });
};

export const useCollections = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => directus?.request(readCollections()),
  });
};

export const useRelations = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["relations", user?.id],
    queryFn: () => directus?.request(readRelations()),
  });
};

export const useSettings = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["settings", user?.id],
    queryFn: () => directus?.request(readSettings()),
  });
};

export const useItemPermissions = (
  collection: keyof CoreSchema,
  docId?: number | string | "+"
) => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["document-permissions", user?.id, collection, docId],
    queryFn: () =>
      directus?.request(readItemPermissions(collection as any, docId)),
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
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["users", user?.id, query],
    queryFn: async () => {
      const items = await directus?.request(readUsers(query));
      const pagination = await directus?.request(
        aggregate("directus_users", { aggregate: { count: "*" } })
      );
      return { items, total: Number(get(pagination, "0.count")) };
    },
  });
};

export const usePolicy = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["policy", id],
    queryFn: () => directus?.request(readPolicy(id)),
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
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => {
      const items = await directus?.request(readRoles(query));

      return { items, total: 0 };
    },
  });
};

export const usePolicies = (query?: Query<CoreSchema, any>) => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["policies", user?.id],
    queryFn: async () => {
      const items = await directus?.request(readPolicies(query));

      return { items, total: 0 };
    },
  });
};

export const useProviders = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["providers", user?.id],
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
    removeItem: (id: string) => {
      const { directus } = useAuth();
      return useMutation({
        mutationFn: () => directus!.request(deleteUser(id)),
      });
    },
    removeItems: (ids: string[]) => {
      const { directus } = useAuth();
      return useMutation({
        mutationFn: () => directus!.request(deleteUsers(ids)),
      });
    },
  },
  [prefix + "roles"]: {
    readItem: useRole,
    readItems: useRoles,
    createItem: addRole,
    removeItem: (id: string) => {
      const { directus } = useAuth();
      return useMutation({
        mutationFn: () => directus!.request(deleteRole(id)),
      });
    },
    removeItems: (ids: string[]) => {
      const { directus } = useAuth();
      return useMutation({
        mutationFn: () => directus!.request(deleteRoles(ids)),
      });
    },
  },
  [prefix + "policies"]: {
    readItem: usePolicy,
    readItems: usePolicies,
    createItem: addPolicy,
    removeItem: (id: string) => {
      const { directus } = useAuth();
      return useMutation({
        mutationFn: () => directus!.request(deletePolicy(id)),
      });
    },
  },
  [prefix + "providers"]: {
    readItems: useProviders,
  },
  [prefix + "settings"]: {
    readItem: useSettings,
  },
};
