import {
  CoreSchema,
  createItem,
  deleteItem,
  updateSingleton,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { updateItem } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";
import { coreCollections } from "../queries/directus/core";
import { useCollection } from "../queries/directus/collection";

export const deleteDocument = (
  collection: keyof CoreSchema,
  id: number | string | "+"
) => {
  const { directus, user } = useAuth();
  const { data } = useCollection(collection);
  const { removeItem: removeCoreItem } = coreCollections[collection] || {};

  console.log({ data, id });

  return removeCoreItem
    ? removeCoreItem(id as string)
    : useMutation({
        mutationFn: () =>
          directus!.request(deleteItem(collection as keyof CoreSchema, id)),
      });
};
