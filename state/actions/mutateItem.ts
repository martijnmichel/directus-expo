import { CoreSchema, createItem } from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { updateItem } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";
import { coreCollections } from "../queries/directus/core";

export const mutateDocument = (
  collection: keyof CoreSchema,
  id: number | string | "+"
) => {
  const { directus, user } = useAuth();
  const { updateItem: updateCoreItem, updateMe } =
    coreCollections[collection] || {};

  if (id === "+" || isNaN(Number(id))) {
    return useMutation({
      mutationFn: (data: CoreSchema<keyof CoreSchema>) => {
        console.log("createItem", collection, id);
        return directus!.request(createItem(collection, data));
      },
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
