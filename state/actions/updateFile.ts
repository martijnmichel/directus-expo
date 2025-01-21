import {
  CoreSchema,
  DirectusFile,
  DirectusRole,
  DirectusUser,
  updateFile,
  updateRole,
  updateUser,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const mutateFile = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusFile>) =>
      directus!.request(updateFile(id, data)),
  });
};
