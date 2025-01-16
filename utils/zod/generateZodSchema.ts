import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { z } from "zod";
import { directusToZod } from "./directusToZod";

// Generate Zod schema from fields
export const generateZodSchema = (fields: ReadFieldOutput<CoreSchema>[]) => {
  if (!fields) return z.object({});

  const schemaObject: Record<string, z.ZodType> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodType = z.any();

    // Convert field type to base Zod schema
    switch (field.type) {
      case "string":
      case "text":
        fieldSchema = z.string();
        break;
      case "integer":
      case "bigInteger":
        fieldSchema = z.number().int();
        break;
      case "float":
      case "decimal":
        fieldSchema = z.number();
        break;
      case "boolean":
        fieldSchema = z.boolean();
        break;
      case "json":
        fieldSchema = z.any();
        break;
      case "dateTime":
        fieldSchema = z.string().or(z.date());
        break;
      // Add other types as needed
    }

    // Apply Directus validation rules if they exist
    if (field.meta?.validation) {
      fieldSchema = directusToZod(field.meta.validation);
    }

    // Make field optional if not required
    if (!field.meta?.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[field.field] = fieldSchema;
  });

  return z.object(schemaObject);
};
