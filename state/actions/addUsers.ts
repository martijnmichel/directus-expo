import {
  CoreSchema,
  createRole,
  createUsers,
  DirectusRole,
  DirectusUser,
  updateRole,
  updateUser,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const addUsers = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusUser>[]) =>
      directus!.request(createUsers(data)),
  });
};
