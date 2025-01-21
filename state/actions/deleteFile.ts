import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/utils/react-query";
import { deleteFile } from "@directus/sdk";
import { useMutation } from "@tanstack/react-query";

export const removeFile = (id: string) => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: () => directus!.request(deleteFile(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["files"],
      });
    },
  });
};
