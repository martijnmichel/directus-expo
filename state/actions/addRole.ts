import {
  CoreSchema,
  createRole,
  DirectusRole,
  DirectusUser,
  updateRole,
  updateUser,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const addRole = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusRole>) =>
      directus!.request(createRole(data)),
  });
};
