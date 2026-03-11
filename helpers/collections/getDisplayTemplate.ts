import { CoreSchemaDocument } from "@/types/directus";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

/**
 * Convert M2A (many-to-any) field path to Directus REST syntax.
 * Path shape: aliasField.junctionField.collection.rest (e.g. items.item.block_card.translations.title).
 * Junction field name is configurable in Directus (meta.junction_field), so we use path position.
 * Directus expects items.item:collection.field not items.item.collection.field.
 * @see https://docs.directus.io/guides/connect/query-parameters#many-to-any-m2a
 */
export function toM2AQueryField(path: string): string {
  const parts = path.split(".");
  if (parts.length < 3) return path;
  const [aliasField, junctionField, collection, ...rest] = parts;
  return [aliasField, `${junctionField}:${collection}`, ...rest].join(".");
}

/**
 * Path to read M2A expanded data from API response (full path with alias).
 * Response has items[].<junctionField> = { ... } (no collection key). Drop collection segment.
 * "items.item.block_card.translations.title" -> "items.item.translations.title".
 */
export function toM2AReadPath(path: string): string {
  const parts = path.split(".");
  if (parts.length < 4) return path;
  return [...parts.slice(0, 2), ...parts.slice(3)].join(".");
}

/**
 * Entry-relative path: junctionField.collection.rest (e.g. item.block_card.translations.title).
 * Drop the collection segment (index 1) to read from API shape: item.translations.title.
 */
export function toM2AReadPathEntryRelative(path: string): string {
  const parts = path.split(".");
  if (parts.length < 3) return path;
  return [...parts.slice(0, 1), ...parts.slice(2)].join(".");
}

export const getDisplayTemplateQueryFields = (
  field?: ReadFieldOutput<CoreSchema>
) => {
  if (!field) return null;
  switch (field.meta.display) {
    default: {
      const template = field.meta.display_options?.template;
      if (!template) return null;

      // Split by commas and process each template part
      const fields = template
        .split(",")
        .map((part: string) => {
          // Match content within {{...}} or take the whole part if no brackets
          const match = part.match(/{{(.+?)}}/) || [null, part];
          const value = match[1]?.trim();
          // Replace "junctionField:collection" with "junctionField.collection" (Directus M2A syntax; junction field name is configurable)
          const normalizedValue = value?.replace(/(\w+):/g, "$1.");
          // If brackets were present (match[0] exists), add ${field.field} prefix
          const fieldPath = match[0]
            ? `${field.field}.${normalizedValue}`
            : normalizedValue;
          // Remove everything from .$ onwards
          return fieldPath.split(".$")[0];
        })
        .filter(Boolean);

      return fields[0] || null;
    }
  }
};

export const getDisplayTemplateTransformName = (
  field?: ReadFieldOutput<CoreSchema>
) => {
  if (!field) return null;
  switch (field.meta.display) {
    default:
      return field.meta.display_options?.template.split(".$")[1];
  }
};
