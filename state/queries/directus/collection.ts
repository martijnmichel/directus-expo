import { useAuth } from "@/contexts/AuthContext";
import {
  CoreSchema,
  readCollection,
  readFields,
  readFieldsByCollection,
  readItem,
  readItems,
} from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";

export const useCollection = (id: string) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["collection", id],
    queryFn: () => directus?.request(readCollection(id)),
  });
};

export const useDocuments = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["documents", collection],
    queryFn: () => directus?.request(readItems(collection)),
  });
};

export const useDocument = (collection: keyof CoreSchema, id: number) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["document", collection, id],
    queryFn: () => directus?.request(readItem(collection, id)),
  });
};

export const useFields = (collection: keyof CoreSchema) => {
  const { directus } = useAuth();
  return useQuery({
    queryKey: ["fields", collection],
    queryFn: () => directus?.request(readFieldsByCollection(collection)),
  });
};
