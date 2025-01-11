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
  readSingleton,
  RequestOptions,
} from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";
import { coreCollections } from "./core";

export const useCollection = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["collection", id],
    queryFn: () => directus?.request(readCollection(id as keyof CoreSchema)),
  });
};

export const useDocuments = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["documents", collection],
    queryFn: () => async () => {
      const coreCollection = coreCollections[collection];
      if (coreCollection?.readItem) {
        // Use the core collection hook
        const result = await directus?.request(coreCollection.readItems(id));
        console.log({ result });
        return result;
      }
      // Fallback to standard readItem
      return directus?.request(readItems(collection, id));
    },
  });
};

export const useDocument = (
  collection: keyof CoreSchema,
  id: number | string | true,
  query?: Query<CoreSchema, keyof CoreSchema>
) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["document", collection, id],
    queryFn: async () => {
      const coreCollection = coreCollections[collection];
      if (coreCollection?.readItem) {
        // Use the core collection hook
        console.log({ coreCollection, id });
        const result = await directus?.request(coreCollection.readItem(id));
        console.log({ result });
        return result;
      }
      // Fallback to standard readItem
      return directus?.request(readItem(collection, id, query));
    },
  });
};

export const useFields = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["fields", collection],
    queryFn: () => directus?.request(readFieldsByCollection(collection)),
  });
};
