import { useAuth } from "@/contexts/AuthContext";
import {
  aggregate,
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
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { coreCollections } from "./core";
import { get } from "lodash";

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

  console.log({ collection, query });

  return coreCollection?.readItems
    ? coreCollection.readItems(query)
    : useQuery({
        queryKey: ["documents", collection, query],
        queryFn: async () => {
          const items = await directus?.request(
            readItems(collection as any, query)
          );
          const pagination = await directus?.request(
            aggregate(collection as any, {
              aggregate: { count: "*" },
              query,
            })
          );

          return {
            items,
            total: Number(get(pagination, "0.count")),
          };
        },
      });
};

export const useDocument = ({
  collection,
  id,
  options,
  ...queryOptions
}: {
  collection: keyof CoreSchema;
  id?: number | string;
  options?: Query<CoreSchema, any>;
  query?: Omit<UseQueryOptions, "queryKey" | "queryFn">;
}): UseQueryResult<Record<string, unknown> | undefined, Error> => {
  const { directus } = useAuth();
  const { data: collectionData } = useCollection(
    collection as keyof CoreSchema
  );

  const coreCollection = coreCollections[collection];

  if (collectionData?.meta.singleton) {
    return useQuery({
      queryKey: ["document", collection, id],
      queryFn: async () =>
        directus?.request(readSingleton(collection as any, options)),
      retry: false,
      ...queryOptions,
    });
  } else
    return coreCollection?.readItem
      ? coreCollection.readItem(id as string)
      : useQuery({
          queryKey: ["document", collection, id],
          queryFn: async () =>
            id === "+"
              ? {}
              : directus?.request(readItem(collection as any, id!, options)),
          ...queryOptions,
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
