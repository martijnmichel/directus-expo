import { CoreSchema } from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { updateItem } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";

export const mutateItem = (collection: keyof CoreSchema, id: number) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: CoreSchema<keyof CoreSchema>) =>
      directus!.request(updateItem(collection as keyof CoreSchema, id, data)),
  });
};
