import { CoreSchema, createItem, updateSingleton } from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { updateItem } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";
import { coreCollections } from "../queries/directus/core";
import { useCollection } from "../queries/directus/collection";

export const mutateDocument = (
  collection: keyof CoreSchema,
  id: number | string | "+"
) => {
  const { directus, user } = useAuth();
  const { data } = useCollection(collection);
  const {
    updateItem: updateCoreItem,
    updateMe,
    createItem: createCoreItem,
  } = coreCollections[collection] || {};

  if ((id === "+" || !id) && !data?.meta.singleton) {
    return createCoreItem
      ? createCoreItem()
      : useMutation({
          mutationFn: (data: Record<string, unknown>) => {
            console.log("createItem", collection, id);
            return directus!.request(createItem(collection, data as any));
          },
        });
  }

  if (data?.meta.singleton) {
    return useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        directus!.request(updateSingleton(collection as any, data)),
    });
  }

  if (updateMe && user?.id === id) {
    return updateMe();
  }
  return updateCoreItem
    ? updateCoreItem(id as string)
    : useMutation({
        mutationFn: (data: Record<string, unknown>) =>
          directus!.request(
            updateItem(collection as keyof CoreSchema, id, data)
          ),
      });
};
