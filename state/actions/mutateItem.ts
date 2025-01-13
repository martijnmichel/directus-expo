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
  const { updateItem: updateCoreItem, updateMe } =
    coreCollections[collection] || {};

  console.log({ data, id });

  if ((id === "+" || !id) && !data?.meta.singleton) {
    return useMutation({
      mutationFn: (data: CoreSchema<keyof CoreSchema>) => {
        console.log("createItem", collection, id);
        return directus!.request(createItem(collection, data));
      },
    });
  }

  if (data?.meta.singleton) {
    console.log("updateSingleton", collection, data);
    return useMutation({
      mutationFn: (data: CoreSchema<keyof CoreSchema>) =>
        directus!.request(
          updateSingleton(collection as keyof CoreSchema, data)
        ),
    });
  }

  if (updateMe && user?.id === id) {
    return updateMe();
  }
  return updateCoreItem
    ? updateCoreItem(id as string)
    : useMutation({
        mutationFn: (data: CoreSchema<keyof CoreSchema>) =>
          directus!.request(
            updateItem(collection as keyof CoreSchema, id, data)
          ),
      });
};
