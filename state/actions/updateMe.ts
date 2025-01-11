import { CoreSchema, DirectusUser, updateMe, updateUser } from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const mutateMe = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusUser>) =>
      directus!.request(updateMe(data)),
  });
};
