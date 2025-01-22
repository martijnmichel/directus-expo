import {
  CoreSchema,
  createRole,
  createUsers,
  DirectusRole,
  DirectusUser,
  updateRole,
  updateUser,
  updateUsers,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const mutateUsers = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (ids: string[], data: Partial<DirectusUser>) =>
      directus!.request(updateUsers(ids, data)),
  });
};
