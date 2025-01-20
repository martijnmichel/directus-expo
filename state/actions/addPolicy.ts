import {
  CoreSchema,
  createPolicy,
  createRole,
  DirectusPolicy,
} from "@directus/sdk";

import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

export const addPolicy = () => {
  const { directus } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<DirectusPolicy<CoreSchema>>) =>
      directus!.request(createPolicy(data)),
  });
};
