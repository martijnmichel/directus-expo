import { useAuth } from "@/contexts/AuthContext";

export const useDirectusClient = () => {
  const { directus } = useAuth();

  if (!directus) {
    throw new Error("Directus client not initialized");
  }

  return { client: directus };
};
