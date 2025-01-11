import { CoreSchema, DirectusUser, updateUser } from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const mutateUser = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusUser>) =>
      directus!.request(updateUser(id, data)),
  });
};
