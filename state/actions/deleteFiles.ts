import { useAuth } from "@/contexts/AuthContext";
import { deleteFile, deleteFiles } from "@directus/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const removeFiles = () => {
  const { directus } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => directus!.request(deleteFiles(ids)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
};
