import { CoreSchemaDocument } from "@/types/directus";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

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
        .map((part) => {
          // Match content within {{...}} or take the whole part if no brackets
          const match = part.match(/{{(.+?)}}/) || [null, part];
          const value = match[1]?.trim();
          // Replace "item:" with "item." in the value
          const normalizedValue = value?.replace(/item:/, "item.");
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
