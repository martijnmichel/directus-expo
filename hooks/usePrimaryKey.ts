import { useFields } from "@/state/queries/directus/collection";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

export const usePrimaryKey = (collection: string) => {
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const primaryKey = fields?.find((f) => f.schema.is_primary_key)?.field;
  return primaryKey;
};

export const getPrimaryKey = (fields?: ReadFieldOutput<CoreSchema>[]) => {
  return fields?.find((f) => f.schema.is_primary_key)?.field;
};
