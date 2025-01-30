import { useFields } from "@/state/queries/directus/collection";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

export const usePrimaryKey = (collection: string) => {
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const primaryKey =
    fields?.find((f) => f.schema.is_primary_key)?.field ?? "id";
  return primaryKey;
};

export const getPrimaryKey = (fields?: ReadFieldOutput<CoreSchema>[]) => {
  return fields?.find((f) => f.schema.is_primary_key)?.field ?? "id";
};

export const getPrimaryKeyFromAllFields = (
  collection: keyof CoreSchema,
  allFields?: ReadFieldOutput<CoreSchema>[]
) => {
  const fields = allFields?.filter((f) => f.collection === collection);
  return fields?.find((f) => f.schema.is_primary_key)?.field ?? "id";
};
