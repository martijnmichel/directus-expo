import {
  CoreSchema,
  createItem,
  createItems,
  updateItems,
  updateSingleton,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { updateItem } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";
import { coreCollections } from "../queries/directus/core";
import { useCollection } from "../queries/directus/collection";

export const mutateDocuments = (
  collection: keyof CoreSchema,
  id: number | string | "+"
) => {
  const { directus, user } = useAuth();
  const { data } = useCollection(collection);
  const { createItems: createCoreItems } = coreCollections[collection] || {};

  return createCoreItems
    ? createCoreItems()
    : useMutation({
        mutationFn: (data: Record<string, any>) => {
          console.log("createItem", collection, id);
          return directus!.request(createItems(collection, data as any));
        },
      });

  /**
  return updateCoreItems
    ? updateCoreItems(id as string)
    : useMutation({
        mutationFn: (data: Record<string, unknown>) =>
          directus!.request(
            updateItems(collection as keyof CoreSchema, id, data)
          ),
      }); */
};
