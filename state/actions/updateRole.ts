import {
  CoreSchema,
  DirectusRole,
  DirectusUser,
  updateRole,
  updateUser,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const mutateRole = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusRole>) =>
      directus!.request(updateRole(id, data)),
  });
};
