import {
  CoreSchema,
  createItem,
  updateItem,
  updateSingleton,
} from "@directus/sdk";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { coreCollections } from "../queries/directus/core";
import { useCollection, useFields } from "../queries/directus/collection";

export const mutateDocument = (
  collection: keyof CoreSchema,
  id?: number | string | "+"
) => {
  const { directus, user } = useAuth();
  const { data: collectionData } = useCollection(collection);
  const { data: fields } = useFields(collection);
  const { updateItem: updateCoreItem, updateMe } =
    coreCollections[collection] || {};

  // Helper to filter out system-managed fields
  const filterSystemFields = (data: Record<string, any>) => {
    if (!collectionData?.fields) return data;

    return Object.fromEntries(
      Object.entries(data).filter(([key]) => {
        const fieldMeta = fields?.find((f) => f.field === key)?.meta;
        return !(
          fieldMeta?.system === true ||
          fieldMeta?.special?.includes("conceal") ||
          fieldMeta?.interface?.startsWith("system-")
        );
      })
    );
  };

  // Create new item
  if ((id === "+" || !id) && !collectionData?.meta.singleton) {
    return useMutation({
      mutationFn: (data: CoreSchema<keyof CoreSchema>) => {
        const filteredData = filterSystemFields(data);
        return directus!.request(createItem(collection, filteredData));
      },
    });
  }

  // Update singleton
  if (collectionData?.meta.singleton) {
    return useMutation({
      mutationFn: (data: CoreSchema<keyof CoreSchema>) => {
        const filteredData = filterSystemFields(data);
        return directus!.request(updateSingleton(collection, filteredData));
      },
    });
  }

  // Update current user
  if (updateMe && user?.id === id) {
    return useMutation({
      mutationFn: (data: CoreSchema<keyof CoreSchema>) => {
        const filteredData = filterSystemFields(data);
        return directus!.request(updateMe(filteredData));
      },
    });
  }

  // Update any other item
  return useMutation({
    mutationFn: (data: CoreSchema<keyof CoreSchema>) => {
      const filteredData = filterSystemFields(data);
      if (updateCoreItem) {
        return directus!.request(updateCoreItem(id as string, filteredData));
      }
      return directus!.request(updateItem(collection, id!, filteredData));
    },
  });
};
