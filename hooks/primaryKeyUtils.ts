import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

/** Pure helpers — keep in this file to avoid require cycles with `collection` query hooks. */

export const getPrimaryKey = (fields?: ReadFieldOutput<CoreSchema>[]) => {
  return fields?.find((f) => f.schema?.is_primary_key)?.field;
};

export const getPrimaryKeyFromAllFields = (
  collection: keyof CoreSchema,
  allFields?: ReadFieldOutput<CoreSchema>[],
) => {
  const fields = allFields?.filter((f) => f.collection === collection);
  return fields?.find((f) => f.schema?.is_primary_key)?.field;
};
