import {
  CoreSchema,
  createItem,
  deleteItem,
  deleteItems,
  updateSingleton,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { updateItem } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";
import { coreCollections } from "../queries/directus/core";
import { useCollection } from "../queries/directus/collection";

export const deleteDocuments = (
  collection: keyof CoreSchema,
  ids: number[] | string[]
) => {
  const { directus, user } = useAuth();
  const { data } = useCollection(collection);
  const { removeItems: removeCoreItems } = coreCollections[collection] || {};

  return removeCoreItems
    ? removeCoreItems(ids as string[])
    : useMutation({
        mutationFn: () =>
          directus!.request(deleteItems(collection as keyof CoreSchema, ids)),
      });
};
