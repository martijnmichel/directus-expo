import { useAuth } from "@/contexts/AuthContext";
import {
  CoreSchema,
  Query,
  readCollection,
  readFields,
  readFieldsByCollection,
  readItem,
  readItems,
  readMe,
  readPermissions,
  readPresets,
  readSingleton,
  RequestOptions,
} from "@directus/sdk";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { coreCollections } from "./core";

export const useCollection = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["collection", id],
    queryFn: () => directus?.request(readCollection(id as keyof CoreSchema)),
  });
};

export const useDocuments = (
  collection: keyof CoreSchema,
  query?: Query<CoreSchema, any>
) => {
  const { directus } = useAuth();
  const coreCollection = coreCollections[collection];

  return coreCollection?.readItems
    ? coreCollection.readItems(query)
    : useQuery({
        queryKey: ["documents", collection],
        queryFn: () => directus?.request(readItems(collection, query)),
      });
};

export const useDocument = (
  collection: keyof CoreSchema,
  id: number | string | true,
  query?: Query<CoreSchema, any>
): UseQueryResult<{ [x: string]: any } | undefined, Error> => {
  const { directus } = useAuth();

  const coreCollection = coreCollections[collection];

  return coreCollection?.readItem
    ? coreCollection.readItem(id as string)
    : useQuery({
        queryKey: ["document", collection, id],
        queryFn: async () => directus?.request(readItem(collection, id, query)),
        retry: false,
      });
};

export const useFields = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["fields", collection],
    queryFn: () => directus?.request(readFieldsByCollection(collection)),
  });
};

export const usePresets = () => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["presets"],
    queryFn: () => directus?.request(readPresets()),
  });
};
