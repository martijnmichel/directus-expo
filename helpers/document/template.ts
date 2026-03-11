import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { CoreSchema } from "@directus/sdk";

import { ReadFieldOutput } from "@directus/sdk";
import { map } from "lodash";

/** Get all leaf values at path, expanding arrays at any level (e.g. items.faq_id.translations.question). */
export function getValuesAtPath(obj: unknown, path: string): unknown[] {
  if (obj == null || !path) return [];
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) return [obj];
  const [key, ...rest] = segments;
  const restPath = rest.join(".");
  const val =
    typeof obj === "object" && obj !== null && key in obj
      ? (obj as Record<string, unknown>)[key]
      : undefined;
  if (rest.length === 0) return val != null ? [val] : [];
  if (Array.isArray(val))
    return val.flatMap((item) => getValuesAtPath(item, restPath));
  return getValuesAtPath(val, restPath);
}

/** Extract dot path from template string e.g. "{{ item.xy.z }}" or "{{ xy.z }}" -> "xy.z" */
export function getPathFromTemplate(template?: string): string {
  if (!template) return "";
  const match = template.match(/\{\{\s*(.+?)\s*\}\}/);
  const path = match?.[1]?.trim() ?? "";
  return path.replace(/^item\./, "");
}

/** Extract all paths from template (every {{ ... }}), normalized (junctionField: -> junctionField.). For M2A templates with multiple placeholders (e.g. items.collection, items.item:block_card.translations.title). */
export function getAllPathsFromTemplate(template?: string): string[] {
  if (!template) return [];
  const matches = [...template.matchAll(/\{\{\s*(.+?)\s*\}\}/g)];
  return matches
    .map((m) => m[1]?.trim() ?? "")
    .filter(Boolean)
    .map((p) => p.replace(/(\w+):/g, "$1."));
}

export const parseTemplate = <T>(
  template?: string,
  data?: T & { [key: string]: any },
  fields?: ReadFieldOutput<CoreSchema>[]
): string => {
  const pk = getPrimaryKey(fields as any);
  return (
    template?.replace(/\{\{(.*?)\}\}/g, (_, path) => {
      return (
        path
          .trim()
          .split(".")
          .reduce(
            (obj: unknown, key: string) => {
              if (Array.isArray(obj)) {
                // If we hit an array, join all the values from the array
                return obj.map(item => (item as Record<string, unknown>)?.[key]).filter(Boolean).join(", ");
              }
              return (obj as Record<string, unknown>)?.[key];
            },
            data as unknown
          ) ||
        data?.[pk as any] ||
        ""
      );
    }) ||
    data?.[pk as any] ||
    data?.id ||
    ""
  );
};

export const parseRepeaterTemplate = <T>(
  template: string,
  data: T & { id?: string }
): string => {
  return template?.replace(/\{\{(.*?)\}\}/g, (_, path) => {
    return (
      path
        .trim()
        .split(".")
        .reduce(
          (obj: unknown, key: string) =>
            (obj as Record<string, unknown>)?.[key],
          data as unknown
        ) ||
      Object.values(data || {})[0] ||
      "-"
    );
  });
};

type FieldValueBase = {
  type: "string" | "transform";
  value?: string;
};

type FieldValueString = FieldValueBase & {
  type: "string";
  value: string;
};

type FieldValueTransform = FieldValueBase & {
  name: string;
  type: "transform";
  path?: string;
  transformation?: string;
};

export type FieldTransform = FieldValueString | FieldValueTransform;

/** Return dot paths to request for a template (e.g. ["translations.title"]). */
export function getFieldPathsFromTemplate(template?: string): string[] {
  return getFieldsFromTemplate(template)
    .filter((s): s is FieldValueTransform => s.type === "transform")
    .map((s) => s.path || s.name)
    .filter(Boolean);
}

export const getFieldsFromTemplate = (template?: string): FieldTransform[] => {
  if (!template) return [];

  const segments: FieldTransform[] = [];
  let lastIndex = 0;

  // Modified regex to be more precise about capturing
  const regex = /(\{\{[^}]+\}\})/g; // Capture the entire match including braces
  let match;

  while ((match = regex.exec(template)) !== null) {
    // Add text before the match if it exists
    if (match.index > lastIndex) {
      segments.push({
        type: "string",
        value: template.slice(lastIndex, match.index),
      });
    }

    // Process the field transform - only trim the inner content
    const field = match[1].replace(/^\{\{|\}\}$/g, "").trim();
    const split = field.split(".");

    if (split.length === 1) {
      segments.push({ type: "transform", name: field });
    } else if (field.includes("$")) {
      segments.push({
        type: "transform",
        name: split[0],
        path: field,
        transformation: split[split.length - 1],
      });
    } else if (split[0] === "m2m") {
      segments.push({
        type: "transform",
        name: field.replace("m2m.", ""),
        path: field.replace("m2m.", ""),
      });
    } else {
      segments.push({
        type: "transform",
        name: field,
      });
    }

    lastIndex = match.index + match[1].length; // Use the exact match length
  }

  // Add remaining text after last match if it exists
  if (lastIndex < template.length) {
    segments.push({
      type: "string",
      value: template.slice(lastIndex),
    });
  }

  return segments;
};
