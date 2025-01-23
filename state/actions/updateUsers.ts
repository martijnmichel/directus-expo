import { DirectusUser, updateUsers } from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const mutateUsers = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (body: { ids: string[]; data: Partial<DirectusUser> }) =>
      directus!.request(updateUsers(body.ids, body.data)),
  });
};
