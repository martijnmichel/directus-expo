import { useAuth } from "@/contexts/AuthContext";
import {
  CoreSchema,
  Query,
  readCollection,
  readFields,
  readFieldsByCollection,
  readItem,
  readItems,
  readMe,
  readPermissions,
  readSingleton,
} from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";

export const useCollection = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["collection", id],
    queryFn: () => directus?.request(readCollection(id as keyof CoreSchema)),
  });
};

export const useDocuments = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["documents", collection],
    queryFn: () => directus?.request(readItems(collection)),
  });
};

export const useDocument = (
  collection: keyof CoreSchema,
  id: number | true,
  query?: Query<CoreSchema, keyof CoreSchema>
) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["document", collection, id],
    queryFn: () =>
      id === true
        ? directus?.request(readSingleton(collection))
        : directus?.request(readItem(collection, id, query)),
  });
};

export const useFields = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["fields", collection],
    queryFn: () => directus?.request(readFieldsByCollection(collection)),
  });
};
