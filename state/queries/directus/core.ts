import { useMutation, useQuery } from "@tanstack/react-query";
import {
  aggregate,
  CoreSchema,
  createDirectus,
  deletePolicy,
  deleteRole,
  deleteRoles,
  deleteUser,
  deleteUsers,
  DirectusFile,
  Query,
  readCollections,
  readFile,
  readFiles,
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
  rest,
} from "@directus/sdk";
import { useAuth } from "@/contexts/AuthContext";
import { useMutateUser } from "@/state/actions/updateUser";
import { useMutateMe } from "@/state/actions/updateMe";
import { get, unset } from "lodash";
import { useAddRole } from "@/state/actions/addRole";
import { useAddPolicy } from "@/state/actions/addPolicy";
import { useRemoveFile } from "@/state/actions/deleteFile";
import { useRemoveFiles } from "@/state/actions/deleteFiles";
import { useMutateFile } from "@/state/actions/updateFile";
import { useAddUsers } from "@/state/actions/addUsers";
import { API } from "@/components/APIForm";
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
      return { items, total: 0 };
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

export const useProviders = (api?: API) => {
  console.log({ api });
  return useQuery({
    queryKey: ["providers", api?.url],
    queryFn: async () => {
      const local = createDirectus(api?.url ?? "").with(rest());
      const items = await local?.request(readProviders());

      return { items, total: 0 };
    },
    enabled: !!api?.url,
  });
};

export const useFiles = (query?: Query<CoreSchema, any>) => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["files", user?.id, query],
    queryFn: async () => {
      const items = (await directus?.request(
        readFiles(query)
      )) as unknown as DirectusFile[];
      const aggregateQuery = { ...(query ?? {}) };
      unset(aggregateQuery, ["page"]);
      const pagination = await directus?.request(
        aggregate("directus_files", {
          aggregate: { count: "*" },
          query: aggregateQuery as any,
        })
      );
      return { items: items, total: Number(get(pagination, "0.count")) };
    },
  });
};

export const useFile = (id: string, query?: Query<CoreSchema, any>) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["file", id, query],
    queryFn: () => directus?.request(readFile(id, query)),
  });
};

const prefix = "directus_";

export const useRemoveUser = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: () => directus!.request(deleteUser(id)),
  });
};

export const useRemoveUsers = (ids: string[]) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: () => directus!.request(deleteUsers(ids)),
  });
};

export const useRemoveRole = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: () => directus!.request(deleteRole(id)),
  });
};

export const useRemoveRoles = (ids: string[]) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: () => directus!.request(deleteRoles(ids)),
  });
};

export const useRemovePolicy = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: () => directus!.request(deletePolicy(id)),
  });
};

export const coreCollections = {
  [prefix + "users"]: {
    me: useMe,
    readItem: useUser,
    readItems: useUsers,
    createItems: useAddUsers,
    updateItem: useMutateUser,
    updateMe: useMutateMe,
    removeItem: useRemoveUser,
    removeItems: useRemoveUsers,
  },
  [prefix + "roles"]: {
    readItem: useRole,
    readItems: useRoles,
    createItem: useAddRole,
    removeItem: useRemoveRole,
    removeItems: useRemoveRoles,
  },
  [prefix + "policies"]: {
    readItem: usePolicy,
    readItems: usePolicies,
    createItem: useAddPolicy,
    removeItem: useRemovePolicy,
  },
  [prefix + "files"]: {
    readItem: useFile,
    readItems: useFiles,
    removeItem: useRemoveFile,
    removeItems: useRemoveFiles,
    updateItem: useMutateFile,
  },
  [prefix + "providers"]: {
    readItems: useProviders,
  },
  [prefix + "settings"]: {
    readItem: useSettings,
  },
};
