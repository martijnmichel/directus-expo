import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

/** Pure helpers — keep in this file to avoid require cycles with `collection` query hooks. */

export const getPrimaryKey = (fields?: ReadFieldOutput<CoreSchema>[]) => {
  return fields?.find((f) => f.schema?.is_primary_key)?.field ?? "id";
};

export const getPrimaryKeyFromAllFields = (
  collection: keyof CoreSchema,
  allFields?: ReadFieldOutput<CoreSchema>[],
) => {
  const fields = allFields?.filter((f) => f.collection === collection);
  return fields?.find((f) => f.schema?.is_primary_key)?.field ?? "id";
};

export const getPrimaryKeyValue = (
  value: unknown,
  fields?: ReadFieldOutput<CoreSchema>[],
  fallback?: unknown,
) => {
  const pk = getPrimaryKey(fields);
  if (value == null) return fallback as string | number | undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const candidate = rec[pk] ?? rec.id ?? rec.uuid;
    if (typeof candidate === "string" || typeof candidate === "number") {
      return candidate;
    }
  }
  if (typeof fallback === "string" || typeof fallback === "number") {
    return fallback;
  }
  return undefined;
};
