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
import { queryClient } from "@/utils/react-query";

export const mutateFile = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusFile>) =>
      directus!.request(updateFile(id, data)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["files"],
      });
    },
  });
};
