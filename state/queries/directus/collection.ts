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
  QueryOptions,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { coreCollections } from "./core";
import { get, unset } from "lodash";
import { useMemo } from "react";
import { CoreSchemaDocument, DirectusErrorResponse } from "@/types/directus";
import { getPrimaryKey } from "@/hooks/usePrimaryKey";

export const useCollection = (id: string) => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["collection", id, user?.id],
    queryFn: () => directus?.request(readCollection(id as keyof CoreSchema)),
  });
};

export const useDocuments = (
  collection: keyof CoreSchema,
  query?: Query<CoreSchema, any>,
  options?: Omit<
    UseQueryOptions<{ items: any[]; total: number }>,
    "queryKey" | "queryFn"
  >
) => {
  const { directus } = useAuth();
  const coreCollection = coreCollections[collection];
  const { data: fields } = useFields(collection);
  return coreCollection?.readItems
    ? coreCollection.readItems(query)
    : useQuery({
        ...options,
        queryKey: ["documents", collection, query],

        queryFn: async () => {
          const items = await directus?.request(
            readItems(collection as any, query)
          );
          const aggregateQuery = { ...query };
          unset(aggregateQuery, ["page"]);
          const pk = getPrimaryKey(fields);
          const pagination = await directus?.request(
            aggregate(collection as any, {
              aggregate: { countDistinct: `${pk}` },
              query: aggregateQuery,
            })
          );

          const total = Number(get(pagination, `0.countDistinct.${pk}`));

          return {
            items: items || [],
            total: !isNaN(total) ? total : 0,
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
  id?: number | string | "+";
  options?: Query<CoreSchema, any>;
  query?: Omit<UseQueryOptions, "queryKey" | "queryFn">;
}): UseQueryResult<
  Record<string, unknown> | undefined,
  Error | DirectusErrorResponse
> => {
  const { directus } = useAuth();
  const { data: collectionData } = useCollection(
    collection as keyof CoreSchema
  );

  const coreCollection = coreCollections[collection];

  if (id === "+") {
    return useQuery({
      queryKey: ["document-add", collection, "+"],
      queryFn: async () => ({}),
      ...queryOptions,
    });
  }

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
            directus?.request(readItem(collection as any, id!, options)),
          ...queryOptions,
        });
};

export const useFields = (collection: keyof CoreSchema) => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["fields", collection, user?.id],
    queryFn: () => directus?.request(readFieldsByCollection(collection)),
  });
};

export const usePresets = () => {
  const { directus, user } = useAuth();
  return useQuery({
    queryKey: ["presets", user?.id],
    queryFn: () => directus?.request(readPresets()),
  });
};
